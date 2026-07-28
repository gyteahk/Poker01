import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnv = path.join(__dirname, "..", "..", ".env.local");
const outDir = path.join(__dirname, "..", "public", "categories");

for (const line of fs.readFileSync(rootEnv, "utf8").split(/\r?\n/)) {
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

const geminiKey = process.env.GEMINI_API_KEY;
if (!geminiKey) throw new Error("no GEMINI_API_KEY");

// 1) Zoom football to fill frame (crop outer margin / card padding)
const fb = path.join(outDir, "football-wide.png");
const meta = await sharp(fb).metadata();
const w = meta.width || 1344;
const h = meta.height || 768;
const zoom = 1.42;
const zw = Math.round(w / zoom);
const zh = Math.round(h / zoom);
const left = Math.round((w - zw) / 2);
const top = Math.round((h - zh) / 2);
await sharp(fb)
  .extract({ left, top, width: zw, height: zh })
  .resize(1344, 768, { fit: "fill" })
  .png()
  .toFile(fb + ".tmp");
fs.renameSync(fb + ".tmp", fb);
console.log(`football zoomed ${w}x${h} -> center ${zw}x${zh} @1.42x`);

async function gen(prompt, aspectRatio) {
  const models = ["gemini-2.5-flash-image", "gemini-3.1-flash-image"];
  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(geminiKey)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: { aspectRatio },
        },
      }),
    });
    if (!res.ok) continue;
    const data = await res.json();
    for (const part of data?.candidates?.[0]?.content?.parts ?? []) {
      const inline = part.inlineData || part.inline_data;
      if (inline?.data) {
        console.log("gen via", model);
        return Buffer.from(inline.data, "base64");
      }
    }
  }
  throw new Error("gen fail");
}

const walletWide = `Premium stylish 3D cartoon 16:9 crypto wallet key art, full bleed edge-to-edge.
NO outer picture frame, NO card border, NO letterboxing, fill entire canvas.
Hero: large shiny gold coin with the letters "USDT" clearly engraved on the coin face (must be readable USDT).
Optional green-teal Tether-style T mark is OK. Must NOT show euro, dollar $, bitcoin B, or random letters.
Beside the coin: sleek purple-gold wallet.
Refined violet, gold, teal lighting. No watermarks.`;

const walletSq = `Premium stylish 3D cartoon 1:1. Large gold coin with clear "USDT" letters, plus sleek wallet.
Full bleed, corners filled. No euro/dollar/bitcoin symbols. No frame border.`;

fs.writeFileSync(path.join(outDir, "wallet-wide.png"), await gen(walletWide, "16:9"));
console.log("wallet-wide OK");
fs.writeFileSync(path.join(outDir, "wallet.png"), await gen(walletSq, "1:1"));
console.log("wallet.png OK");
