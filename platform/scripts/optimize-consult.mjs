import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnv = path.join(__dirname, "..", "..", ".env.local");
const briefPath = path.join(__dirname, "..", "docs", "optimize-consult.json");

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

const context = `
Product: cyber888.vip — purple/gold crypto sportsbook + casino lobby.
Done: Next.js MVP, member/wallet ledger, NOWPayments USDT-TRC20 deposits (credit actual paid), withdraw risk auto ≤1000, admin panels, sports 1X2 stub, game lobby stubs, brand logo SVG.
Not done: production deploy + IPN HTTPS, real game aggregator API, real sports API, NOWPayments payouts, OTP.
User wants: game tiles with Gemini-generated cover images (click to enter).
Please propose: (1) UI/UX optimizations for lobby & sports now, (2) next 5 product priorities ranked, (3) risks to watch.
Reply JSON only: { "uiOptimizations": string[], "priorities": [{"rank":1,"item":"","why":""}], "risks": string[], "oneLiner": "" }
`;

async function deepseek() {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return { error: "no key" };
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "deepseek-chat",
      temperature: 0.5,
      messages: [
        { role: "system", content: "Product + UX advisor for crypto casino. JSON only." },
        { role: "user", content: context },
      ],
    }),
  });
  const text = (await res.json()).choices?.[0]?.message?.content || "";
  try {
    return JSON.parse(text.replace(/^```json\s*|\s*```$/g, "").trim());
  } catch {
    return { raw: text };
  }
}

async function gemini(ds) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { error: "no key" };
  const models = ["gemini-2.5-flash", "gemini-2.0-flash-001", "gemini-flash-latest"];
  for (const model of models) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Review this DeepSeek advice for cyber888.vip and improve/agree. Add anything missing about NOWPayments IPN deploy and game covers UX. DeepSeek JSON:\n${JSON.stringify(ds)}\n\nReply JSON only with same schema plus "geminiNotes": string[].`,
                },
              ],
            },
          ],
        }),
      },
    );
    if (!res.ok) continue;
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
    try {
      return { model, ...JSON.parse(text.replace(/^```json\s*|\s*```$/g, "").trim()) };
    } catch {
      return { model, raw: text };
    }
  }
  return { error: "gemini failed" };
}

const ds = await deepseek();
const gm = await gemini(ds);
fs.mkdirSync(path.dirname(briefPath), { recursive: true });
fs.writeFileSync(briefPath, JSON.stringify({ deepseek: ds, gemini: gm, cursorSynthesis: null }, null, 2));
console.log("wrote", briefPath);
console.log("deepseek ok", Boolean(ds.priorities || ds.oneLiner));
console.log("gemini ok", Boolean(gm.priorities || gm.oneLiner || gm.geminiNotes));
