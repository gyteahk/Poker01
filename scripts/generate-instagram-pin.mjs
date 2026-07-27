/**
 * Instagram 4:5 pin poster for POKER01 (same image reused for daily story posts).
 * Gemini paints the background; Sharp/SVG draws exact bilingual copy.
 * Run: node scripts/generate-instagram-pin.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_W = 1080;
const OUT_H = 1350;

function loadEnvLocal() {
  const raw = readFileSync(path.join(root, ".env.local"), "utf8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return env;
}

const bgPrompt = `Create a vertical 4:5 Instagram background ONLY — no text, no letters, no logos, no watermarks, no URLs, no numbers.

Eye-catching promotional atmosphere for a colorful poker INFO brand:
- Bold, bright, high-energy but clean — teal/cyan poker felt with vivid pink-orange-purple suit accents
- Large dramatic poker chips and cards toward the edges / corners (bokeh depth), leave center quieter for overlay text
- Premium social-media poster vibe, magazine cover energy, strong contrast
- NOT dark neon nightclub, NOT purple-only gradient, NOT cream/terracotta, NOT casino slots
- No people, no phones, no QR codes`;

async function geminiBackground(apiKey) {
  const models = [
    "gemini-2.5-flash-image",
    "gemini-3.1-flash-image",
    "gemini-3.1-flash-lite-image",
  ];
  let lastErr = "Gemini image unavailable";

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    console.log("Trying", model);
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: bgPrompt }] }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: { aspectRatio: "4:5" },
        },
      }),
    });
    if (!res.ok) {
      lastErr = `${model} HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`;
      console.log(lastErr);
      continue;
    }
    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      const inline = part.inlineData ?? part.inline_data;
      if (inline?.data) {
        console.log("Background from", model);
        return Buffer.from(inline.data, "base64");
      }
    }
    lastErr = `${model} empty`;
  }
  throw new Error(lastErr);
}

function textOverlaySvg() {
  // Hooky, skimmable intro — no "daily stories" label (that's the user's posting habit)
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${OUT_W}" height="${OUT_H}" viewBox="0 0 ${OUT_W} ${OUT_H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#001820" flood-opacity="0.55"/>
    </filter>
    <linearGradient id="panel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#041820" stop-opacity="0.28"/>
      <stop offset="40%" stop-color="#03141c" stop-opacity="0.62"/>
      <stop offset="100%" stop-color="#021018" stop-opacity="0.72"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#FF6B4A"/>
      <stop offset="50%" stop-color="#00D4E8"/>
      <stop offset="100%" stop-color="#FF4DA6"/>
    </linearGradient>
  </defs>

  <rect x="56" y="120" width="968" height="1110" rx="40" fill="url(#panel)"/>
  <rect x="56" y="120" width="968" height="10" rx="5" fill="url(#accent)"/>

  <g filter="url(#glow)" text-anchor="middle" font-family="Segoe UI, PingFang TC, Microsoft JhengHei, Noto Sans TC, sans-serif">
    <text x="540" y="250" font-size="92" font-weight="900" fill="#FFFFFF" letter-spacing="6">POKER01</text>

    <text x="540" y="360" font-size="54" font-weight="800" fill="#FFFFFF">一站式 Poker 資訊站</text>

    <text x="540" y="450" font-size="30" font-weight="700" fill="#9EFFF6">玩住學 · 睇得明 · 決策更穩</text>

    <!-- three eye-catching benefit chips -->
    <rect x="120" y="520" width="840" height="78" rx="39" fill="#00C2D7" fill-opacity="0.92"/>
    <text x="540" y="570" font-size="32" font-weight="800" fill="#03141C">迷你遊戲暖身 · 上手更快</text>

    <rect x="120" y="630" width="840" height="78" rx="39" fill="#FF6B4A" fill-opacity="0.95"/>
    <text x="540" y="680" font-size="32" font-weight="800" fill="#FFFFFF">時事快睇 · 撲克圈新鮮事</text>

    <rect x="120" y="740" width="840" height="78" rx="39" fill="#FF4DA6" fill-opacity="0.95"/>
    <text x="540" y="790" font-size="32" font-weight="800" fill="#FFFFFF">Poker 小百科 · 心態同術語</text>

    <text x="540" y="920" font-size="34" font-weight="700" fill="#E8FFFB">輕鬆玩、玩住學</text>
    <text x="540" y="980" font-size="28" font-weight="600" fill="#B8F4F8" font-style="italic">Play light. Learn as you go.</text>

    <text x="540" y="1120" font-size="56" font-weight="900" fill="#FFFFFF" letter-spacing="1">poker01.club</text>
  </g>
</svg>`;
}

async function main() {
  const apiKey = loadEnvLocal().GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY in .env.local");

  const outDir = path.join(root, "marketing");
  mkdirSync(outDir, { recursive: true });

  const bgBuf = await geminiBackground(apiKey);
  writeFileSync(path.join(outDir, "instagram-pin-4x5-bg.png"), bgBuf);

  const out = path.join(outDir, "instagram-pin-4x5.png");
  await sharp(bgBuf)
    .resize(OUT_W, OUT_H, { fit: "cover", position: "centre" })
    .composite([{ input: Buffer.from(textOverlaySvg()), top: 0, left: 0 }])
    .png()
    .toFile(out);

  // Same creative, story canvas with letterbox (optional reuse)
  const story = path.join(outDir, "instagram-story-9x16.png");
  await sharp(out)
    .resize(1080, 1920, {
      fit: "contain",
      background: { r: 2, g: 16, b: 24, alpha: 1 },
    })
    .png()
    .toFile(story);

  console.log("SAVED", out);
  console.log("SAVED", story);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
