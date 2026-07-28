import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnv = path.join(__dirname, "..", "..", ".env.local");

for (const line of fs.readFileSync(rootEnv, "utf8").split(/\r?\n/)) {
  if (!line || line.trim().startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  const k = line.slice(0, i).trim();
  let v = line.slice(i + 1).trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  if (!process.env[k]) process.env[k] = v;
}

const geminiKey = process.env.GEMINI_API_KEY;
if (!geminiKey) throw new Error("no GEMINI_API_KEY");

const prompt = `Create a clean horizontal website header logo for cyber888.vip.

Background: solid deep purple (#3F1C66).

LEFT: a polished metallic GOLD shield emblem ONLY — empty inside (solid dark purple or empty fill). NO numbers, NO 8, NO 888, NO text inside the shield. Just a elegant gold shield outline/shape like a premium sportsbook badge.

RIGHT of the shield (same as a top navigation brand): the wordmark "cyber888.vip" in bold italic/modern sans-serif:
- "cyber" in white
- "888" in metallic gold matching the shield
- ".vip" in light lavender or white

Composition like a website topbar logo: shield + site name side by side, crisp vector style, high contrast, no clutter, no extra icons.`;

const models = ["gemini-2.5-flash-image", "gemini-3.1-flash-image"];
let last = "fail";
for (const model of models) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(geminiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": geminiKey,
    },
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
      const out = path.join(__dirname, "..", "public", "brand", "logo.png");
      fs.writeFileSync(out, Buffer.from(inline.data, "base64"));
      console.log("saved", out, "via", model);
      process.exit(0);
    }
  }
  last = `${model} empty`;
}
throw new Error(last);
