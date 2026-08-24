import { NextResponse } from "next/server";
import {
  fallbackNews,
  fetchPokerHeadlines,
  filterNewHeadlines,
  headlineKey,
  isNewsCheckStale,
  loadNewsArchive,
  markNewsChecked,
  mergeArchiveArticles,
  NEWS_CHECK_INTERVAL_MS,
  saveNewsArchive,
  writeNewsWithAI,
  type NewsArticle,
} from "@/lib/news";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Allow DeepSeek + Gemini cover generation on cold start / refresh. */
export const maxDuration = 60;

/**
 * GET /api/news
 * - Default: return persisted archive (no DeepSeek / Gemini).
 * - Auto piggyback: if lastCheckAt is older than NEWS_CHECK_INTERVAL_MS (6h),
 *   run one incremental RSS check on that request, then serve the result.
 * - ?refresh=1 or ?check=1: force incremental check now.
 * - ?force=1: admin full regenerate (rewrites archive from current headlines).
 * - ?id=: filter a single article id.
 *
 * Cold start (empty archive): first request bootstraps like a check (may call AI once).
 * Subsequent loads within the interval cost ~0 AI tokens.
 */

declare global {
  // eslint-disable-next-line no-var
  var __poker01NewsUpdateLock: Promise<void> | undefined;
}

async function withUpdateLock<T>(fn: () => Promise<T>): Promise<T> {
  const started = Date.now();
  while (globalThis.__poker01NewsUpdateLock) {
    // Hard-killed Netlify invokes can leave a stale lock on a warm isolate.
    if (Date.now() - started > 45_000) {
      globalThis.__poker01NewsUpdateLock = undefined;
      break;
    }
    try {
      await Promise.race([
        globalThis.__poker01NewsUpdateLock,
        new Promise((resolve) => setTimeout(resolve, 5_000)),
      ]);
    } catch {
      // previous updater failed; proceed
    }
  }
  let release!: () => void;
  globalThis.__poker01NewsUpdateLock = new Promise<void>((resolve) => {
    release = resolve;
  });
  try {
    return await fn();
  } finally {
    release();
    globalThis.__poker01NewsUpdateLock = undefined;
  }
}

function withFallbackCovers(articles: NewsArticle[]): NewsArticle[] {
  return articles.map((a) =>
    a.imageUrl
      ? a
      : {
          ...a,
          imageUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#7b6cff"/><text x="60" y="520" fill="#fff" font-size="42" font-family="sans-serif">Poker News</text></svg>`,
          )}`,
          imageSource: "placeholder" as const,
        },
  );
}

function pickArticles(articles: NewsArticle[], id: string | null) {
  return id ? articles.filter((a) => a.id === id) : articles;
}

function jsonPayload(args: {
  articles: NewsArticle[];
  id: string | null;
  mode: "ai" | "fallback";
  cached: boolean;
  fromArchive: boolean;
  checked?: boolean;
  appended?: number;
  providers?: { deepseek: boolean; geminiImages: boolean };
  errors?: string[];
  needsApiKey?: boolean;
  headlines?: string[];
  updatedAt?: string;
  lastCheckAt?: string;
  checkIntervalMs?: number;
}) {
  return NextResponse.json({
    articles: pickArticles(args.articles, args.id),
    mode: args.mode,
    cached: args.cached,
    fromArchive: args.fromArchive,
    checked: args.checked ?? false,
    appended: args.appended ?? 0,
    providers: args.providers,
    errors: args.errors,
    needsApiKey: args.needsApiKey,
    headlines: args.headlines,
    updatedAt: args.updatedAt,
    lastCheckAt: args.lastCheckAt,
    checkIntervalMs: args.checkIntervalMs ?? NEWS_CHECK_INTERVAL_MS,
  });
}

async function runIncrementalUpdate(options: {
  force: boolean;
  id: string | null;
}) {
  const { force, id } = options;
  const archive = await loadNewsArchive();
  const headlines = await fetchPokerHeadlines();

  const keyed = (
    force
      ? headlines.slice(0, 1).map((h) => ({ ...h, key: headlineKey(h) }))
      : filterNewHeadlines(headlines, archive).slice(0, 1)
  );

  if (!keyed.length) {
    const stamped = archive.articles.length
      ? await markNewsChecked(archive)
      : archive;
    const articles = withFallbackCovers(stamped.articles);
    if (articles.length) {
      return jsonPayload({
        articles,
        id,
        mode: "ai",
        cached: true,
        fromArchive: true,
        checked: true,
        appended: 0,
        providers: { deepseek: false, geminiImages: false },
        updatedAt: stamped.updatedAt,
        lastCheckAt: stamped.lastCheckAt,
      });
    }
    return jsonPayload({
      articles: withFallbackCovers(fallbackNews),
      id,
      mode: "fallback",
      cached: true,
      fromArchive: false,
      checked: true,
      appended: 0,
      providers: { deepseek: false, geminiImages: false },
      needsApiKey: !process.env.DEEPSEEK_API_KEY,
      lastCheckAt: stamped.lastCheckAt,
    });
  }

  // Incremental: text + stock covers (fast). Force: still skip Gemini to avoid 502.
  const written = await writeNewsWithAI(keyed, {
    limit: 1,
    withImages: false,
  });

  if (written?.articles?.length) {
    const incoming = withFallbackCovers(written.articles);
    const merged = force
      ? incoming
      : mergeArchiveArticles(archive.articles, incoming);
    const saved = await saveNewsArchive(merged);
    return jsonPayload({
      articles: saved.articles,
      id,
      mode: "ai",
      cached: false,
      fromArchive: true,
      checked: true,
      appended: force ? saved.articles.length : incoming.length,
      providers: written.providers,
      errors: written.errors,
      headlines: keyed.map((h) => h.title),
      updatedAt: saved.updatedAt,
      lastCheckAt: saved.lastCheckAt,
    });
  }

  // AI unavailable — keep archive if any; else headline stubs / fallback
  if (archive.articles.length && !force) {
    const stamped = await markNewsChecked(archive);
    return jsonPayload({
      articles: withFallbackCovers(stamped.articles),
      id,
      mode: "ai",
      cached: true,
      fromArchive: true,
      checked: true,
      appended: 0,
      providers: { deepseek: false, geminiImages: false },
      errors: ["AI write skipped or failed; returning saved archive"],
      updatedAt: stamped.updatedAt,
      lastCheckAt: stamped.lastCheckAt,
    });
  }

  const fromHeadlines: NewsArticle[] = headlines.slice(0, 3).map((h, i) => ({
    id: `raw-${i}`,
    date: new Date().toISOString().slice(0, 10),
    title: { zh: h.title, en: h.title },
    body: {
      zh: "AI 尚未整理全文。設定 DEEPSEEK_API_KEY 後可由小編自動撰寫中英文章；封面圖可用 GEMINI_API_KEY 生成。",
      en: "AI rewrite unavailable. Add DEEPSEEK_API_KEY so 小編 can write bilingual articles; GEMINI_API_KEY powers cover images.",
    },
    source: h.title,
    sourceLink: h.link,
  }));

  return jsonPayload({
    articles: withFallbackCovers(
      fromHeadlines.length ? fromHeadlines : fallbackNews,
    ),
    id,
    mode: "fallback",
    cached: false,
    fromArchive: false,
    checked: true,
    appended: 0,
    providers: { deepseek: false, geminiImages: false },
    needsApiKey: !process.env.DEEPSEEK_API_KEY,
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const force = searchParams.get("force") === "1";
  const explicitCheck =
    force ||
    searchParams.get("refresh") === "1" ||
    searchParams.get("check") === "1";
  const id = searchParams.get("id");

  const archive = await loadNewsArchive();
  const stale = isNewsCheckStale(archive);
  const check = explicitCheck || (!!archive.articles.length && stale);

  // Fast path: serve disk archive — no RSS, no DeepSeek, no Gemini
  if (!check && archive.articles.length) {
    return jsonPayload({
      articles: withFallbackCovers(archive.articles),
      id,
      mode: "ai",
      cached: true,
      fromArchive: true,
      checked: false,
      appended: 0,
      providers: { deepseek: false, geminiImages: false },
      updatedAt: archive.updatedAt,
      lastCheckAt: archive.lastCheckAt,
    });
  }

  // Empty archive on plain GET → bootstrap once (same as check)
  // Stale lastCheckAt / explicit refresh / force → incremental or full rewrite
  return withUpdateLock(() => runIncrementalUpdate({ force, id }));
}
