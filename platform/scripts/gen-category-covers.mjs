import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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

const STYLE = `Premium stylish 3D cartoon illustration for a luxury crypto sportsbook UI (cyber888.vip).
Look: elegant mobile-game key art — polished, fashionable, adult-casual — NOT childish toy clutter, NOT kawaii overkill.
Lighting: cinematic rim light + soft studio glow. Colors: rich violet, champagne gold, magenta, teal — vivid but refined.
Composition: full-bleed edge-to-edge, corners filled with intentional design elements (not empty voids).
NO text, NO letters, NO logos, NO watermarks, NO letterboxing.`;

const jobs = [
  {
    id: "football-wide",
    ratio: "16:9",
    prompt: `${STYLE}
16:9 stylish football key art: sleek 3D soccer ball, premium stadium glow, gold accents, fashion-forward sports betting mood.`,
  },
  {
    id: "poker-wide",
    ratio: "16:9",
    prompt: `${STYLE}
16:9 stylish poker key art: elegant 3D chips and cards, velvet purple and gold, nightclub-premium poker lobby vibe.`,
  },
  {
    id: "games-wide",
    ratio: "16:9",
    prompt: `${STYLE}
16:9 stylish casino games hall key art: refined 3D slot + chips, neon-luxury arcade, glamorous not childish.`,
  },
  {
    id: "wallet-wide",
    ratio: "16:9",
    prompt: `${STYLE}
16:9 stylish crypto wallet key art: premium 3D gold coin and sleek wallet, fintech luxury, bright clean glow.`,
  },
  {
    id: "slots",
    ratio: "1:1",
    prompt: `${STYLE}
1:1 stylish slot category icon: premium 3D reels, neon gold frame, corners filled elegantly.`,
  },
  {
    id: "live",
    ratio: "1:1",
    prompt: `${STYLE}
1:1 stylish live dealer category: premium 3D table and chips, nightclub purple-gold.`,
  },
  {
    id: "fishing",
    ratio: "1:1",
    prompt: `${STYLE}
1:1 stylish fish-hunter category: premium 3D fish and cannon, teal-gold luxury arcade.`,
  },
  {
    id: "cards",
    ratio: "1:1",
    prompt: `${STYLE}
1:1 stylish cards category: premium 3D ace cards fan, gold edges.`,
  },
  {
    id: "poker",
    ratio: "1:1",
    prompt: `${STYLE}
1:1 stylish poker category: premium 3D chips stack and cards.`,
  },
  {
    id: "games",
    ratio: "1:1",
    prompt: `${STYLE}
1:1 stylish games hub icon: premium 3D mix of chips and reels.`,
  },
];

async function genOne(prompt, aspectRatio) {
  const models = ["gemini-2.5-flash-image", "gemini-3.1-flash-image"];
  let last = "fail";
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
    if (!res.ok) {
      last = `${model} ${res.status}`;
      continue;
    }
    const data = await res.json();
    for (const part of data?.candidates?.[0]?.content?.parts ?? []) {
      const inline = part.inlineData || part.inline_data;
      if (inline?.data) return { model, b64: inline.data };
    }
    last = `${model} no image`;
  }
  throw new Error(last);
}

fs.mkdirSync(outDir, { recursive: true });

for (const c of jobs) {
  process.stdout.write(`generating ${c.id} ... `);
  try {
    const { model, b64 } = await genOne(c.prompt, c.ratio);
    fs.writeFileSync(path.join(outDir, `${c.id}.png`), Buffer.from(b64, "base64"));
    console.log(`ok ${model}`);
  } catch (e) {
    console.log(`FAIL ${e.message || e}`);
  }
}
console.log("done");
