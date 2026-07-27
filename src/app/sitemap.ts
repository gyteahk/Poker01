import type { MetadataRoute } from "next";
import { loadNewsArchive } from "@/lib/news";
import { getSiteUrl } from "@/lib/site";
import { listWikiArticles } from "@/lib/wiki-articles";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const paths: {
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  }[] = [
    { path: "", changeFrequency: "daily", priority: 1 },
    { path: "/play", changeFrequency: "weekly", priority: 0.8 },
    { path: "/play/daily", changeFrequency: "daily", priority: 0.9 },
    { path: "/play/practice", changeFrequency: "weekly", priority: 0.7 },
    { path: "/play/memory", changeFrequency: "weekly", priority: 0.65 },
    { path: "/play/quiz", changeFrequency: "weekly", priority: 0.65 },
    { path: "/play/start-hand", changeFrequency: "weekly", priority: 0.65 },
    { path: "/news", changeFrequency: "daily", priority: 0.85 },
    { path: "/wiki", changeFrequency: "weekly", priority: 0.9 },
  ];

  const staticEntries: MetadataRoute.Sitemap = paths.map((item) => ({
    url: `${base}${item.path || "/"}`,
    lastModified: now,
    changeFrequency: item.changeFrequency,
    priority: item.priority,
  }));

  const wikiEntries: MetadataRoute.Sitemap = listWikiArticles().map((article) => ({
    url: `${base}/wiki/${article.slug}`,
    lastModified: article.updatedAt,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  let newsEntries: MetadataRoute.Sitemap = [];
  try {
    const archive = await loadNewsArchive();
    newsEntries = archive.articles.map((article) => ({
      url: `${base}/news/${encodeURIComponent(article.id)}`,
      lastModified: article.createdAt || article.date || now.toISOString(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // Blobs may be unavailable at build time — static + wiki still publish
  }

  return [...staticEntries, ...wikiEntries, ...newsEntries];
}
