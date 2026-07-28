import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnv = path.join(__dirname, "..", "..", ".env.local");
const brandDir = path.join(__dirname, "..", "public", "brand");
const catDir = path.join(__dirname, "..", "public", "categories");

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
        console.log("gen", model, aspectRatio);
        return Buffer.from(inline.data, "base64");
      }
    }
  }
  throw new Error("gen fail");
}

/** Make near-black / dark-gray pixels transparent */
async function knockOutDarkBg(inputBuf, outPath) {
  const { data, info } = await sharp(inputBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    // dark charcoal background (not gold/purple glow)
    if (max < 48 && max - min < 18) {
      data[i + 3] = 0;
    } else if (max < 70 && max - min < 22) {
      data[i + 3] = Math.round(data[i + 3] * 0.35);
    }
  }
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toFile(outPath);
}

// ——— 1) Horizontal merged logo (mark + wordmark) then knock out bg ———
const logoPrompt = `Create ONE horizontal website header logo for cyber888.vip as a single image.
Aspect ratio 4:1 (wide).
LEFT: the explosive gold shield + infinity emblem (metallic gold shield outline, infinity inside, gold/purple explosion sparks) — sexy high-impact logo mark.
RIGHT: wordmark text exactly "cyber888.vip" — "cyber" white, "888" metallic gold, ".vip" soft lavender. Bold italic modern sans-serif.
Compose as one seamless brand lockup on a PURE FLAT BLACK (#000000) background (for easy background removal).
No extra UI, no mockup browser, no watermark. High contrast, readable at small size.`;

const logoBuf = await gen(logoPrompt, "4:1");
const logoRaw = path.join(brandDir, "logo-merged-raw.png");
fs.writeFileSync(logoRaw, logoBuf);
await knockOutDarkBg(logoBuf, path.join(brandDir, "logo.png"));
await sharp(path.join(brandDir, "logo.png")).resize({ height: 80, fit: "inside" }).png().toFile(path.join(brandDir, "logo-header.png"));
console.log("logo merged + bg removed -> logo.png / logo-header.png");

// also square mark from concept A with bg removed
const markSrc = path.join(brandDir, "logo-concepts", "logo-base-a.png");
await knockOutDarkBg(fs.readFileSync(markSrc), path.join(brandDir, "logo-mark.png"));
console.log("logo-mark.png bg removed");

// ——— 2) Football: native 16:9, NO zoom crop, proper composition ———
const footballPrompt = `Premium stylish 3D cartoon key art for football betting category.
Aspect ratio EXACTLY 16:9 landscape — native wide composition, NOT a square stretched or cropped.
FULL BLEED: art reaches all four edges. NO outer picture frame, NO card border, NO letterboxing, NO black bars, NO empty margins.
Hero: large metallic purple-and-gold soccer ball with neon pink/cyan energy rings, glamorous explosion sparks.
Fill the wide frame with stadium atmosphere left and right — balanced cinematic sportsbook look.
NO currency symbols (no euro, dollar, bitcoin). NO text. NO watermark.
Beautiful proportions: ball slightly left-of-center or center, wings/energy filling width elegantly.`;

const fbBuf = await gen(footballPrompt, "16:9");
fs.writeFileSync(path.join(catDir, "football-wide.png"), fbBuf);
const meta = await sharp(fbBuf).metadata();
console.log(`football-wide native ${meta.width}x${meta.height}`);
console.log("done");
