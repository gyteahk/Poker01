import { createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import {
  placeholderCover,
  hashHue,
  type NewsArticle,
} from "@/lib/news-shared";
import {
  durableGetJson,
  durableSetBinary,
  durableSetJson,
} from "@/lib/storage";

export type { NewsArticle } from "@/lib/news-shared";
export { newsExcerpt, placeholderCover } from "@/lib/news-shared";

const ARCHIVE_PATH = path.join(process.cwd(), "data", "news-archive.json");
const ARCHIVE_KEY = "news-archive";
const MAX_ARCHIVE_ARTICLES = 40;

/** How often traffic can trigger an incremental RSS/AI check (piggyback). */
export const NEWS_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

export type NewsArchive = {
  updatedAt: string;
  /** ISO time of last RSS check (even when no new headlines). */
  lastCheckAt?: string;
  articles: NewsArticle[];
};

export function isNewsCheckStale(archive: NewsArchive): boolean {
  const ts = archive.lastCheckAt || archive.updatedAt;
  if (!ts) return true;
  const t = Date.parse(ts);
  if (Number.isNaN(t)) return true;
  return Date.now() - t >= NEWS_CHECK_INTERVAL_MS;
}

function normalizeHeadlineText(input: string): string {
  return input.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Stable key for RSS/source dedupe (title + link). */
export function headlineKey(headline: { title: string; link?: string }): string {
  const raw = `${normalizeHeadlineText(headline.title)}|${normalizeHeadlineText(headline.link || "")}`;
  return createHash("sha256").update(raw).digest("hex").slice(0, 16);
}

export function articleSourceKey(article: NewsArticle): string {
  if (article.sourceKey) return article.sourceKey;
  if (article.source || article.sourceLink) {
    return headlineKey({
      title: article.source || article.title.en || article.title.zh,
      link: article.sourceLink,
    });
  }
  return headlineKey({ title: article.title.en || article.title.zh || article.id });
}

export async function loadNewsArchive(): Promise<NewsArchive> {
  const fromDurable = await durableGetJson<NewsArchive>(ARCHIVE_KEY);
  if (fromDurable && Array.isArray(fromDurable.articles)) {
    return {
      updatedAt: fromDurable.updatedAt || "",
      lastCheckAt: fromDurable.lastCheckAt || fromDurable.updatedAt || "",
      articles: fromDurable.articles,
    };
  }

  // Legacy local JSON (pre-Netlify) — migrate into durable store when found
  try {
    const raw = (await fs.readFile(ARCHIVE_PATH, "utf8")).replace(/^\uFEFF/, "");
    const parsed = JSON.parse(raw) as NewsArchive;
    if (parsed && Array.isArray(parsed.articles) && parsed.articles.length) {
      const archive = {
        updatedAt: parsed.updatedAt || "",
        lastCheckAt: parsed.lastCheckAt || parsed.updatedAt || "",
        articles: parsed.articles,
      };
      await durableSetJson(ARCHIVE_KEY, archive).catch(() => undefined);
      return archive;
    }
  } catch {
    // empty
  }
  return { updatedAt: "", lastCheckAt: "", articles: [] };
}

async function writeArchiveFile(archive: NewsArchive): Promise<NewsArchive> {
  await durableSetJson(ARCHIVE_KEY, archive);
  // Best-effort local mirror for local tooling
  try {
    await fs.mkdir(path.dirname(ARCHIVE_PATH), { recursive: true });
    await fs.writeFile(ARCHIVE_PATH, JSON.stringify(archive, null, 2), "utf8");
  } catch {
    // ignore on read-only serverless FS
  }
  return archive;
}

export async function saveNewsArchive(articles: NewsArticle[]): Promise<NewsArchive> {
  const now = new Date().toISOString();
  const trimmed = articles.slice(0, MAX_ARCHIVE_ARTICLES);
  return writeArchiveFile({
    updatedAt: now,
    lastCheckAt: now,
    articles: trimmed,
  });
}

/** Persist lastCheckAt after an RSS check that did not change articles. */
export async function markNewsChecked(
  archive: NewsArchive,
): Promise<NewsArchive> {
  const now = new Date().toISOString();
  return writeArchiveFile({
    updatedAt: archive.updatedAt || now,
    lastCheckAt: now,
    articles: archive.articles.slice(0, MAX_ARCHIVE_ARTICLES),
  });
}

export function filterNewHeadlines(
  headlines: { title: string; link: string }[],
  archive: NewsArchive,
): { title: string; link: string; key: string }[] {
  const seen = new Set(archive.articles.map(articleSourceKey));
  const out: { title: string; link: string; key: string }[] = [];
  for (const h of headlines) {
    const key = headlineKey(h);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...h, key });
  }
  return out;
}

export const fallbackNews: NewsArticle[] = [
  {
    id: "fallback-1",
    date: new Date().toISOString().slice(0, 10),
    title: {
      zh: "線上撲克流量持續上升",
      en: "Online poker traffic keeps climbing",
    },
    body: {
      zh: "夏季大型賽事檔期同 mobile 玩家增加，線上桌數同 MTT 報名流量都見活躍。小編觀察到晚間高峰更容易湊齊合適 stakes，新手宜先留意盲注結構同桌型節奏，再決定上邊啲桌。無論現金桌定錦標賽，保持穩定選桌同休息節奏，先至係長線玩法。",
      en: "Summer series calendars and more mobile players are lifting online traffic across cash tables and MTTs. Peak evening hours tend to fill stakes faster. Beginners should learn blind structures and table tempo before jumping in. Steady table selection and rest habits still matter more than chasing every hot seat.",
    },
    source: "sample",
    imageUrl: placeholderCover("fallback-1", "Online poker traffic"),
    imageSource: "placeholder",
  },
  {
    id: "fallback-2",
    date: new Date().toISOString().slice(0, 10),
    title: {
      zh: "新手點樣開始第一場 MTT",
      en: "How beginners start their first MTT",
    },
    body: {
      zh: "第一次打 MTT，唔好急住追大獎。先搞清楚起始籌碼、盲注升盲節奏同淘汰規則，再用較淺嘅起手牌範圍站穩前段。中段注意籌碼深度同桌位壓力，避免無謂 all-in。小編建議新手由低買入開始，打完一場就複盤幾個關鍵決策，進步會穩陣好多。",
      en: "For a first MTT, skip the jackpot chase. Learn starting stacks, blind levels, and elimination rules, then play a tighter early range. Mid-game, watch stack depth and seat pressure instead of spewing chips. Start at low buy-ins and review a few key hands after each flight — that builds skill faster than volume alone.",
    },
    source: "sample",
    imageUrl: placeholderCover("fallback-2", "First MTT tips"),
    imageSource: "placeholder",
  },
  {
    id: "fallback-3",
    date: new Date().toISOString().slice(0, 10),
    title: {
      zh: "亞洲線上俱樂部生態持續熱鬧",
      en: "Asia’s online club scene stays lively",
    },
    body: {
      zh: "亞洲時區高峰，俱樂部同 union 流量仍然集中，玩家較易搵到心水 stakes。小編提醒大家留意桌型差異：有啲桌偏鬆軟，有啲偏攻擊，選錯桌會直接影響 win rate。保持紀錄同休息，先至跟得上長期節奏。",
      en: "During Asia peak hours, club and union traffic stays concentrated, so preferred stakes are easier to find. Table textures still differ — some games run soft, others aggressive — and poor selection hurts win rate. Logging sessions and resting between blocks keeps the long-term game sustainable.",
    },
    source: "sample",
    imageUrl: placeholderCover("fallback-3", "Asia club poker"),
    imageSource: "placeholder",
  },
];

function stripHtml(input: string): string {
  return input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function parseRssItems(xml: string): { title: string; link: string }[] {
  const items: { title: string; link: string }[] = [];
  const chunks = xml.split(/<item[\s>]/i).slice(1);
  for (const chunk of chunks.slice(0, 8)) {
    const title =
      chunk.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "";
    const link =
      chunk.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1] ??
      chunk.match(/<link[^>]*href=["']([^"']+)["']/i)?.[1] ??
      "";
    const cleanTitle = stripHtml(title);
    if (cleanTitle) items.push({ title: cleanTitle, link: stripHtml(link) });
  }
  return items;
}

export async function fetchPokerHeadlines(): Promise<
  { title: string; link: string }[]
> {
  const feeds = [
    "https://news.google.com/rss/search?q=poker+OR+%22texas+holdem%22&hl=en-US&gl=US&ceid=US:en",
    "https://www.pokernews.com/rss/news.xml",
  ];

  for (const url of feeds) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "PokerNewsBot/1.0" },
        next: { revalidate: 1800 },
      });
      if (!res.ok) continue;
      const xml = await res.text();
      const items = parseRssItems(xml);
      if (items.length) return items.slice(0, 5);
    } catch {
      // try next feed
    }
  }
  return [];
}

async function callDeepSeek(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      temperature: 0.6,
      messages: [
        {
          role: "system",
          content:
            "You are 小編, an independent poker news editor. Write fuller bilingual poker news as strict JSON only. Chinese bodies should be about 300 Traditional Chinese characters. Never promote clubs, apps, WhatsApp, Telegram, or brand CTAs.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`DeepSeek error ${res.status}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const raw = (fenced ?? text).trim();
  return JSON.parse(raw);
}

function buildPrompt(headlines: { title: string; link: string }[]): string {
  const n = Math.max(1, Math.min(5, headlines.length));
  return `You are 小編 (Xiao Bian), an independent poker editor — not tied to any club or app.
Given these headlines, write exactly ${n} fuller news article(s) for players — one article per headline, in the same order.
Return ONLY a JSON array:
[
  {
    "id": "n1",
    "date": "YYYY-MM-DD",
    "title": { "zh": "...", "en": "..." },
    "body": {
      "zh": "about 280-320 Traditional Chinese characters, Hong Kong Cantonese-friendly, one string",
      "en": "equivalent fuller English article, roughly 120-180 words"
    },
    "source": "headline text"
  }
]
Hard rules:
- Stay fact-grounded in the headlines; no fake winners or invented prize amounts
- zh must be Traditional Chinese and feel Hong Kong Cantonese-friendly
- each zh body ~300 Chinese characters (not 2-3 short sentences)
- Voice: curious independent editor 小編; you may sign tone lightly but do NOT invent club affiliations
- FORBIDDEN in titles and bodies (any language): Poker01, POKER01, ClubGG, HotShot GG, HotShot, 124963, WhatsApp, Telegram, wa.me, t.me, "join our club", "加入我哋", "一鍵加入", or any club/app CTA
Headlines:
${headlines.map((h, i) => `${i + 1}. ${h.title}`).join("\n")}
Today: ${new Date().toISOString().slice(0, 10)}`;
}

function normalizeArticles(
  parsed: NewsArticle[],
  headlines: { title: string; link: string; key?: string }[],
): NewsArticle[] {
  const now = new Date().toISOString();
  return parsed.slice(0, headlines.length || 5).map((item, i) => {
    const headline = headlines[i];
    const key =
      headline?.key ||
      (headline ? headlineKey(headline) : `ai-${i}-${Date.now()}`);
    return {
      id: String(item.id || `n-${key}`).replace(/[^a-zA-Z0-9_-]/g, "-"),
      date: item.date || now.slice(0, 10),
      createdAt: now,
      title: {
        zh: item.title?.zh || headline?.title || "Poker update",
        en: item.title?.en || headline?.title || "Poker update",
      },
      body: {
        zh: item.body?.zh || "",
        en: item.body?.en || "",
      },
      source: item.source || headline?.title,
      sourceLink: headline?.link || "",
      sourceKey: key,
    };
  });
}

function parseArticles(
  text: string,
  headlines: { title: string; link: string; key?: string }[],
): NewsArticle[] | null {
  try {
    const parsed = extractJson(text) as NewsArticle[];
    if (!Array.isArray(parsed) || !parsed.length) return null;
    return normalizeArticles(parsed, headlines);
  } catch {
    return null;
  }
}

const UNSPLASH_POKER = [
  "https://images.unsplash.com/photo-1541278107931-e006523892df?auto=format&fit=crop&w=1200&h=630&q=80",
  "https://images.unsplash.com/photo-1511193311914-0346f16efe90?auto=format&fit=crop&w=1200&h=630&q=80",
  "https://images.unsplash.com/photo-1596838132734-3300becd4fbe?auto=format&fit=crop&w=1200&h=630&q=80",
  "https://images.unsplash.com/photo-1529486989270-e4d0f2b8a2b4?auto=format&fit=crop&w=1200&h=630&q=80",
];

function unsplashCover(id: string): string {
  const idx = hashHue(id) % UNSPLASH_POKER.length;
  return UNSPLASH_POKER[idx];
}

function buildImagePrompt(article: NewsArticle): string {
  return `Create a wide 16:9 editorial cover illustration for an independent poker news article.
No text, no watermarks, no logos, no brand names, no QR codes, no app UI.
Cinematic poker atmosphere with cards, chips, or felt — tasteful, colorful, magazine-quality.
Theme inspired by: "${article.title.en}".
Mood cue: ${(article.body.en || article.body.zh || "").slice(0, 180)}`;
}

type GeminiImageResult = {
  base64: string;
  mimeType: string;
};

async function callGeminiImage(
  prompt: string,
  apiKey: string,
): Promise<GeminiImageResult> {
  const models = [
    "gemini-3.1-flash-image",
    "gemini-2.5-flash-image",
    "gemini-3.1-flash-lite-image",
  ];
  let lastError = "Gemini image unavailable";

  for (const model of models) {
    const endpoints = [
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`,
    ];

    for (const endpoint of endpoints) {
      try {
        const res = await fetch(`${endpoint}?key=${encodeURIComponent(apiKey)}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseModalities: ["TEXT", "IMAGE"],
            },
          }),
        });

        if (!res.ok) {
          lastError = `Gemini image error ${res.status} (${model})`;
          continue;
        }

        const data = await res.json();
        const parts = data?.candidates?.[0]?.content?.parts ?? [];
        for (const part of parts) {
          const inline = part.inlineData ?? part.inline_data;
          if (inline?.data) {
            return {
              base64: inline.data as string,
              mimeType: (inline.mimeType ?? inline.mime_type ?? "image/png") as string,
            };
          }
        }
        lastError = `Gemini image empty (${model})`;
      } catch (e) {
        lastError = e instanceof Error ? e.message : "Gemini image failed";
      }
    }
  }

  // Legacy Imagen predict (may still work before Aug 2026 shutdown)
  try {
    const imagenModels = [
      "imagen-4.0-fast-generate-001",
      "imagen-4.0-generate-001",
    ];
    for (const model of imagenModels) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            instances: [{ prompt }],
            parameters: { sampleCount: 1 },
          }),
        },
      );
      if (!res.ok) {
        lastError = `Imagen error ${res.status} (${model})`;
        continue;
      }
      const data = await res.json();
      const b64 =
        data?.predictions?.[0]?.bytesBase64Encoded ??
        data?.predictions?.[0]?.image?.bytesBase64Encoded;
      if (b64) {
        return { base64: b64, mimeType: "image/png" };
      }
      lastError = `Imagen empty (${model})`;
    }
  } catch (e) {
    lastError = e instanceof Error ? e.message : "Imagen failed";
  }

  throw new Error(lastError);
}

async function saveCoverFile(
  articleId: string,
  image: GeminiImageResult,
): Promise<string> {
  const ext = image.mimeType.includes("jpeg")
    ? "jpg"
    : image.mimeType.includes("webp")
      ? "webp"
      : "png";
  const filename = `${articleId}-${Date.now()}.${ext}`;
  const key = `news-images/${filename}`;
  const buf = Buffer.from(image.base64, "base64");
  await durableSetBinary(key, buf, image.mimeType);

  // Best-effort local public mirror for local `next dev`
  try {
    const dir = path.join(process.cwd(), "public", "news-images");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, filename), buf);
  } catch {
    // ignore
  }

  return `/api/news-image/${encodeURIComponent(filename)}`;
}

async function attachCoverImages(
  articles: NewsArticle[],
  geminiKey: string | undefined,
  errors: string[],
): Promise<{ articles: NewsArticle[]; geminiImages: boolean }> {
  let geminiImages = false;

  const withImages = await Promise.all(
    articles.map(async (article) => {
      if (geminiKey) {
        try {
          const image = await callGeminiImage(buildImagePrompt(article), geminiKey);
          const imageUrl = await saveCoverFile(article.id, image);
          geminiImages = true;
          return { ...article, imageUrl, imageSource: "gemini" as const };
        } catch (e) {
          errors.push(
            e instanceof Error
              ? `Image ${article.id}: ${e.message}`
              : `Image ${article.id}: failed`,
          );
        }
      }

      // Prefer Unsplash stock, then colorful SVG placeholder
      try {
        return {
          ...article,
          imageUrl: unsplashCover(article.id),
          imageSource: "unsplash" as const,
        };
      } catch {
        return {
          ...article,
          imageUrl: placeholderCover(article.id, article.title.en || article.title.zh),
          imageSource: "placeholder" as const,
        };
      }
    }),
  );

  return { articles: withImages, geminiImages };
}

export type WriteNewsResult = {
  articles: NewsArticle[];
  providers: { deepseek: boolean; geminiImages: boolean };
  errors: string[];
};

export async function writeNewsWithAI(
  headlines: { title: string; link: string; key?: string }[],
): Promise<WriteNewsResult | null> {
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!deepseekKey) return null;
  if (!headlines.length) return null;

  const capped = headlines.slice(0, 5);
  const errors: string[] = [];
  let articles: NewsArticle[] | null = null;

  try {
    const text = await callDeepSeek(buildPrompt(capped), deepseekKey);
    articles = parseArticles(text, capped);
    if (!articles) errors.push("DeepSeek returned unparseable JSON");
  } catch (e) {
    errors.push(e instanceof Error ? e.message : "DeepSeek failed");
  }

  if (!articles?.length) return null;

  // Prefer stable ids tied to source keys so re-runs don't collide in image names
  articles = articles.map((a, i) => ({
    ...a,
    id: `n-${capped[i]?.key || a.sourceKey || a.id}`.replace(
      /[^a-zA-Z0-9_-]/g,
      "-",
    ),
  }));

  const imaged = await attachCoverImages(articles, geminiKey, errors);

  return {
    articles: imaged.articles,
    providers: {
      deepseek: true,
      geminiImages: imaged.geminiImages,
    },
    errors,
  };
}

/** Prepend newly written articles; never rewrite existing archive rows. */
export function mergeArchiveArticles(
  existing: NewsArticle[],
  incoming: NewsArticle[],
): NewsArticle[] {
  const seen = new Set(existing.map(articleSourceKey));
  const fresh: NewsArticle[] = [];
  for (const article of incoming) {
    const key = articleSourceKey(article);
    if (seen.has(key)) continue;
    seen.add(key);
    fresh.push(article);
  }
  return [...fresh, ...existing].slice(0, MAX_ARCHIVE_ARTICLES);
}
