/**
 * One-off: generate POKER01 logo via Gemini native image models.
 * Usage: node scripts/generate-logo.mjs
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

async function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  const text = await fs.readFile(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

const LOGO_PROMPT = `Design a clean, stylish brand logo for "POKER01", an online poker information hub.

Style:
- Fun, colorful, modern — light and lively (not dark casino noir)
- Accent colors: cyan (#00c2d7), coral/orange (#ff8a3d), magenta/pink (#ff4d8d), soft violet (#7b6cff)
- Clean mark that works on a pure white or very light background
- Include the wordmark text "POKER01" in bold modern geometric lettering (Space Grotesk / futuristic sans vibe)
- Optional small playful poker cue: ace of spades, chip, or card corner — subtle, not cluttered
- Flat or soft vector logo look, high contrast, sharp edges
- NO purple neon glow, NO dark gradient void, NO photorealistic casino table, NO watermarks, NO QR codes
- Centered composition, generous padding, square canvas suitable for header / favicon crop
- Professional brand identity quality`;

const FAVICON_PROMPT = `Create a square favicon / app icon for the brand POKER01.
A bold circular poker-chip emblem with a cyan spade and coral "01" monogram, accents in cyan, magenta, and coral.
Flat vector, high contrast, clean white background.
IMPORTANT: Output ONLY the icon artwork. No captions, no size labels, no mockup frames, no instructional text, no watermarks, no purple neon glow.`;

async function callGeminiImage(prompt, apiKey) {
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
          console.error(lastError);
          continue;
        }

        const data = await res.json();
        const parts = data?.candidates?.[0]?.content?.parts ?? [];
        for (const part of parts) {
          const inline = part.inlineData ?? part.inline_data;
          if (inline?.data) {
            console.log(`OK: ${model}`);
            return {
              base64: inline.data,
              mimeType: inline.mimeType ?? inline.mime_type ?? "image/png",
              model,
            };
          }
        }
        lastError = `Gemini image empty (${model})`;
        console.error(lastError);
      } catch (e) {
        lastError = e instanceof Error ? e.message : "Gemini image failed";
        console.error(lastError);
      }
    }
  }

  throw new Error(lastError);
}

function extFor(mimeType) {
  if (mimeType.includes("jpeg")) return "jpg";
  if (mimeType.includes("webp")) return "webp";
  return "png";
}

async function saveImage(relName, image) {
  const ext = extFor(image.mimeType);
  const filename = relName.endsWith(`.${ext}`) ? relName : `${relName}.${ext}`;
  const filePath = path.join(root, "public", filename);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, Buffer.from(image.base64, "base64"));
  const stat = await fs.stat(filePath);
  console.log(`Saved public/${filename} (${stat.size} bytes)`);
  return filename;
}

async function main() {
  await loadEnvLocal();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY missing from .env.local");
    process.exit(1);
  }

  console.log("Generating logo-poker01…");
  const logo = await callGeminiImage(LOGO_PROMPT, apiKey);
  await saveImage("logo-poker01", logo);

  console.log("Generating favicon-poker01…");
  try {
    const fav = await callGeminiImage(FAVICON_PROMPT, apiKey);
    await saveImage("favicon-poker01", fav);
  } catch (e) {
    console.warn(
      "Favicon generation failed (logo still ok):",
      e instanceof Error ? e.message : e,
    );
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
