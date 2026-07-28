import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnv = path.join(__dirname, "..", "..", ".env.local");
const outDir = path.join(__dirname, "..", "public", "brand", "logo-concepts");

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

const jobs = [
  {
    id: "logo-base-a",
    prompt: `Design a SINGLE logo mark icon for cyber888.vip crypto sportsbook (NOT a full website mockup).
Square 1:1, centered emblem only, transparent-feeling dark void background OK.
Concept A — "sexy explosive gold": a glamorous explosive burst of champagne-gold energy around a sleek shield / infinity-888 motif.
Premium luxury gambling brand, bold, hot, high-impact, cinematic lighting.
3D glossy but logo-usable silhouette. Purple + gold + magenta sparks.
NO text, NO letters, NO words, NO website UI, NO watermark.
Keep shape readable when shrunk to 40px height.`,
  },
  {
    id: "logo-base-b",
    prompt: `Design a SINGLE logo mark icon for cyber888.vip crypto sportsbook (NOT a full website mockup).
Square 1:1, centered emblem only.
Concept B — "sexy neon detonation": a stylish explosive neon ring blast with a sharp winged / crown-shield core in electric magenta, cyan and molten gold.
Hot, aggressive, nightclub-premium sportsbook energy. Explosive sparks and energy streaks.
3D cartoon-premium key art that can become a logo base.
NO text, NO letters, NO words, NO website UI, NO watermark.
Readable as a small app icon.`,
  },
];

async function gen(prompt) {
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
          imageConfig: { aspectRatio: "1:1" },
        },
      }),
    });
    if (!res.ok) continue;
    const data = await res.json();
    for (const part of data?.candidates?.[0]?.content?.parts ?? []) {
      const inline = part.inlineData || part.inline_data;
      if (inline?.data) return { model, b64: inline.data };
    }
  }
  throw new Error("gen fail");
}

fs.mkdirSync(outDir, { recursive: true });

for (const job of jobs) {
  process.stdout.write(`${job.id} ... `);
  try {
    const { model, b64 } = await gen(job.prompt);
    const file = path.join(outDir, `${job.id}.png`);
    fs.writeFileSync(file, Buffer.from(b64, "base64"));
    console.log(`ok ${model} -> ${file}`);
  } catch (e) {
    console.log(`FAIL ${e.message || e}`);
  }
}
console.log("done");
