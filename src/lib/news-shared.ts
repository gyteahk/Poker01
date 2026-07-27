export type NewsArticle = {
  id: string;
  date: string;
  title: { zh: string; en: string };
  body: { zh: string; en: string };
  source?: string;
  /** Original RSS link when available */
  sourceLink?: string;
  /** Stable dedupe key from source title/link */
  sourceKey?: string;
  /** ISO timestamp when the article was appended to the archive */
  createdAt?: string;
  /** Public URL or data URL for the cover image */
  imageUrl?: string;
  imageSource?: "gemini" | "unsplash" | "placeholder";
};

export function newsExcerpt(body: string, maxLen = 110): string {
  const text = body.replace(/\s+/g, " ").trim();
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen).replace(/[，。,.!！?？\s]+$/u, "")}…`;
}

export function hashHue(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % 360;
}

export function placeholderCover(id: string, label: string): string {
  const h1 = hashHue(id);
  const h2 = (h1 + 48) % 360;
  const h3 = (h1 + 96) % 360;
  const safe = label.replace(/[<>&"']/g, "").slice(0, 42);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${h1},72%,58%)"/>
      <stop offset="55%" stop-color="hsl(${h2},68%,46%)"/>
      <stop offset="100%" stop-color="hsl(${h3},70%,38%)"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <circle cx="180" cy="140" r="110" fill="rgba(255,255,255,0.16)"/>
  <circle cx="1020" cy="500" r="160" fill="rgba(0,0,0,0.14)"/>
  <rect x="70" y="430" width="420" height="8" rx="4" fill="rgba(255,255,255,0.55)"/>
  <text x="70" y="520" fill="rgba(255,255,255,0.95)" font-family="Georgia,serif" font-size="44" font-weight="700">${safe || "Poker News"}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
