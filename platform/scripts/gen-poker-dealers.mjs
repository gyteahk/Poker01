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
        console.log("ok", model, aspectRatio);
        return Buffer.from(inline.data, "base64");
      }
    }
  }
  throw new Error("gen fail");
}

const base = `Photorealistic live poker casino promo. Native correct aspect ratio, full bleed.
ONLY ONE beautiful Japanese female dealer (adult ~26), long dark hair, VERY sexy white open dress shirt, busty cleavage, sultry smile.
MEDIUM shot: dealer upper body + clearly visible green felt TABLE with FULL chip stacks and playing cards in the bottom area.
CRITICAL: all face-up playing cards must be UNIQUE ranks/suits — NO duplicated same card appearing twice (e.g. do not show two Ace of Spades). Realistic single deck layout.
Luxury purple-gold neon casino. One person only. Clothed. No text/logos.`;

const candidateWide = path.join(outDir, "poker-wide-candidate.png");
const candidateSq = path.join(outDir, "poker-candidate.png");

const wideBuf = await gen(`${base}\nExactly 16:9 landscape.`, "16:9");
fs.writeFileSync(candidateWide, wideBuf);
const wm = await sharp(wideBuf).metadata();
console.log(`candidate wide ${wm.width}x${wm.height}`);

const sqBuf = await gen(`${base}\nExactly 1:1 square.`, "1:1");
fs.writeFileSync(candidateSq, sqBuf);
console.log("candidates written — review then promote or discard");
