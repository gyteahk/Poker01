import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const now = new Date();

  const paths = [
    "",
    "/play",
    "/play/daily",
    "/play/practice",
    "/play/memory",
    "/play/quiz",
    "/play/start-hand",
    "/news",
    "/wiki",
  ];

  return paths.map((path) => ({
    url: `${base}${path || "/"}`,
    lastModified: now,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : path === "/play/daily" ? 0.9 : 0.7,
  }));
}
