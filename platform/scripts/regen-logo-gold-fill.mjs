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

const prompt = `Create a horizontal website logo for cyber888.vip as a PNG with TRUE TRANSPARENT BACKGROUND (alpha), no purple plate, no colored backdrop, no square canvas fill.

LEFT: a shield shape FULLY FILLED with polished metallic gold (solid gold fill end-to-end, not hollow, not empty center). No numbers or text inside the shield.

RIGHT: wordmark "cyber888.vip" — "cyber" white, "888" metallic gold matching the shield, ".vip" light lavender. Bold modern sans-serif, slight italic OK.

Isolated logo graphic only on transparent background. Crisp vector-like, high contrast, suitable for overlay on a purple website header. No drop shadow plate, no background color.`;

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
      console.log("saved", out, "via", model, "bytes", Buffer.from(inline.data, "base64").length);
      process.exit(0);
    }
  }
  last = `${model} empty`;
}
throw new Error(last);
