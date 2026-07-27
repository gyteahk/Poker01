import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

async function loadEnvLocal() {
  const text = await fs.readFile(path.join(root, ".env.local"), "utf8");
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

const prompt = `Create a square favicon / app icon for the brand POKER01.
A bold circular poker-chip emblem with a cyan spade and coral "01" monogram, accents in cyan, magenta, and coral.
Flat vector, high contrast, clean white background.
IMPORTANT: Output ONLY the icon artwork. No captions, no size labels, no mockup frames, no instructional text, no watermarks, no purple neon glow.`;

await loadEnvLocal();
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY missing");
  process.exit(1);
}

const model = "gemini-3.1-flash-image";
const res = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
    }),
  },
);

if (!res.ok) {
  console.error("error", res.status);
  process.exit(1);
}

const data = await res.json();
const parts = data?.candidates?.[0]?.content?.parts ?? [];
for (const part of parts) {
  const inline = part.inlineData ?? part.inline_data;
  if (inline?.data) {
    const mime = inline.mimeType ?? inline.mime_type ?? "image/png";
    const ext = mime.includes("jpeg")
      ? "jpg"
      : mime.includes("webp")
        ? "webp"
        : "png";
    const out = path.join(root, "public", `favicon-poker01.${ext}`);
    await fs.writeFile(out, Buffer.from(inline.data, "base64"));
    console.log(`Saved favicon-poker01.${ext}`);
    process.exit(0);
  }
}

console.error("empty response");
process.exit(1);
