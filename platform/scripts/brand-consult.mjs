/**
 * Consult DeepSeek + Gemini for cyber888.win brand/logo brief, then generate logo via Gemini image.
 * Usage: node --env-file=../.env.local scripts/brand-consult.mjs
 * (or load dotenv manually)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnv = path.join(__dirname, "..", "..", ".env.local");
const platformPublic = path.join(__dirname, "..", "public", "brand");

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnv(rootEnv);

const deepseekKey = process.env.DEEPSEEK_API_KEY;
const geminiKey = process.env.GEMINI_API_KEY;

const BRIEF = `Brand: cyber888.win
Product: crypto sportsbook + casino lobby (USDT-TRC20), purple + gold palette, bet365-like density but branded cyber888.
Need: logo mark + wordmark direction for dark purple header with gold accents.
Constraints: no "365", no copying bet365 trademark, readable at 32px height, works on #5b2d8e purple bar.
Return concise JSON with keys: concept, markDescription, wordmarkStyle, colorHex, imagePromptEnglish (detailed for image model), uiTweaks (array of 3 short CSS/layout tips).`;

async function askDeepSeek() {
  if (!deepseekKey) return { error: "no DEEPSEEK_API_KEY" };
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${deepseekKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content:
            "You are a brand designer for an online betting platform. Reply with JSON only, no markdown.",
        },
        { role: "user", content: BRIEF },
      ],
    }),
  });
  if (!res.ok) return { error: `deepseek ${res.status}`, body: await res.text() };
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "";
  try {
    return JSON.parse(text.replace(/^```json\s*|\s*```$/g, "").trim());
  } catch {
    return { raw: text };
  }
}

async function askGeminiRefine(deepseekBrief) {
  if (!geminiKey) return { error: "no GEMINI_API_KEY" };
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(geminiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Refine this sportsbook logo brief into ONE best English image-generation prompt for a square app logo (transparent or dark purple background). Also suggest final hex colors. Input JSON:\n${JSON.stringify(deepseekBrief)}\n\nReply JSON only: { "imagePrompt": "...", "primary": "#...", "accent": "#...", "note": "..." }`,
              },
            ],
          },
        ],
      }),
    },
  );
  if (!res.ok) return { error: `gemini ${res.status}`, body: await res.text() };
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
  try {
    return JSON.parse(text.replace(/^```json\s*|\s*```$/g, "").trim());
  } catch {
    return { raw: text };
  }
}

async function geminiLogo(prompt) {
  const models = ["gemini-2.5-flash-image", "gemini-3.1-flash-image", "gemini-2.0-flash-preview-image-generation"];
  let last = "no image";
  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(geminiKey)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
      }),
    });
    if (!res.ok) {
      last = `${model} ${res.status}`;
      continue;
    }
    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      const inline = part.inlineData ?? part.inline_data;
      if (inline?.data) {
        return {
          base64: inline.data,
          mimeType: inline.mimeType ?? inline.mime_type ?? "image/png",
          model,
        };
      }
    }
    last = `${model} empty`;
  }
  throw new Error(last);
}

async function main() {
  console.log("Consulting DeepSeek…");
  const ds = await askDeepSeek();
  console.log("DeepSeek OK:", Boolean(ds.concept || ds.imagePromptEnglish || ds.raw));

  console.log("Consulting Gemini refine…");
  const gm = await askGeminiRefine(ds);
  console.log("Gemini refine OK:", Boolean(gm.imagePrompt || gm.raw));

  const imagePrompt =
    gm.imagePrompt ||
    ds.imagePromptEnglish ||
    `App logo for cyber888.win crypto sportsbook. Minimal geometric mark combining stylized "C8" or infinity-888 in metallic gold (#d4af37) on deep purple (#3f1c66). Clean vector, flat, no photorealism, no bet365 copy, square, crisp edges, dark background, professional gambling brand, high contrast for small size.`;

  fs.mkdirSync(platformPublic, { recursive: true });
  fs.writeFileSync(
    path.join(platformPublic, "brief.json"),
    JSON.stringify({ deepseek: ds, gemini: gm, imagePrompt }, null, 2),
  );

  console.log("Generating logo with Gemini image…");
  const img = await geminiLogo(
    `${imagePrompt}\n\nOutput a single centered logo icon suitable as website favicon/header mark. No mockups, no extra text besides optional subtle cyber888 if space allows. Square composition.`,
  );
  const ext = img.mimeType.includes("jpeg") ? "jpg" : "png";
  const out = path.join(platformPublic, `logo.${ext}`);
  fs.writeFileSync(out, Buffer.from(img.base64, "base64"));
  console.log("Saved", out, "via", img.model);
}

main().catch((e) => {
  console.error("FAILED", e.message);
  process.exit(1);
});
