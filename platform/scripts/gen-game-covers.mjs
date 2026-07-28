import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnv = path.join(__dirname, "..", "..", ".env.local");
const outDir = path.join(__dirname, "..", "public", "games", "covers");

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

const games = [
  {
    id: "slot-fortune",
    prompt:
      "Square casino game cover art for slot game Fortune Spin. Purple and gold cyber888 sportsbook style. Glowing fortune wheel and golden coins, bold title Fortune Spin at bottom. No trademarks, flat vibrant poster, 1:1.",
  },
  {
    id: "slot-neon",
    prompt:
      "Square casino game cover for Neon Reels slot. Neon purple pink cyan reels on dark purple, gold accents, title Neon Reels. Modern cyber casino poster, 1:1, no real brand logos.",
  },
  {
    id: "live-baccarat",
    prompt:
      "Square live casino cover for Live Baccarat. Elegant baccarat table chips cards, purple velvet and gold, title Live Baccarat. Premium live dealer vibe, 1:1, no real casino brands.",
  },
  {
    id: "live-roulette",
    prompt:
      "Square live casino cover for Live Roulette. Roulette wheel close-up gold and purple lighting, title Live Roulette. Luxurious, 1:1, no trademarks.",
  },
  {
    id: "fish-ocean",
    prompt:
      "Square fishing arcade game cover Ocean King. Giant golden dragon fish underwater, neon cannons, purple teal gold, title Ocean King. Asian fish-hunter style, 1:1, no trademarks.",
  },
  {
    id: "cards-blackjack",
    prompt:
      "Square card game cover Blackjack. Ace and king cards gold edges on purple felt, title Blackjack. Clean casino poster, 1:1, no brand logos.",
  },
  {
    id: "poker-hold",
    prompt:
      "Square poker game cover Casino Holdem. Community cards and chips purple gold theme, title Casino Holdem. Premium poker poster, 1:1, no trademarks.",
  },
];

async function genOne(prompt) {
  const models = ["gemini-2.5-flash-image", "gemini-3.1-flash-image"];
  let last = "fail";
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
    for (const part of data?.candidates?.[0]?.content?.parts ?? []) {
      const inline = part.inlineData ?? part.inline_data;
      if (inline?.data) {
        return { base64: inline.data, model };
      }
    }
    last = `${model} empty`;
  }
  throw new Error(last);
}

fs.mkdirSync(outDir, { recursive: true });

for (const g of games) {
  const dest = path.join(outDir, `${g.id}.png`);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 10000) {
    console.log("skip existing", g.id);
    continue;
  }
  console.log("generating", g.id, "…");
  const img = await genOne(g.prompt);
  fs.writeFileSync(dest, Buffer.from(img.base64, "base64"));
  console.log("saved", g.id, "via", img.model, Buffer.from(img.base64, "base64").length);
}

console.log("done");
