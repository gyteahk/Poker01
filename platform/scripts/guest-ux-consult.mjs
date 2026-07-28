import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnv = path.join(__dirname, "..", "..", ".env.local");
const outPath = path.join(__dirname, "..", "docs", "guest-ux-consult.json");

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
You are advising cyber888.vip — a crypto (USDT-TRC20) sportsbook + casino lobby for guests.
Brand: purple + gold, sportsbook feel, logo already set. MVP exists: auth, wallet, deposit QR, withdraw, admin, stub sports 1X2, stub game lobby with Gemini covers.

User constraint NOW:
- Real sports odds API and real game aggregator API need business talks first (weeks).
- Meanwhile they want: beautiful, perfect, comfortable, easy-for-guests website experience.
- Also want: where to FIND sports APIs and game aggregators (B2B), what else to do in parallel, and a clear Go-Ahead phased plan.

Reply JSON only:
{
  "guestExperiencePillars": [{"name":"","why":"","doNow":""}],
  "uxImprovementsNow": [{"area":"","change":"","effort":"S|M|L","impact":"H|M|L"}],
  "sportsApiSources": [{"name":"","type":"odds|sportsbook-b2b|feeds","howToFind":"","notes":""}],
  "gameApiSources": [{"name":"","type":"aggregator|studio-direct","howToFind":"","notes":""}],
  "parallelWorkWhileWaitingApis": string[],
  "phasedGoAhead": [{"phase":1,"title":"","doneWhen":"","tasks":string[]}],
  "antiPatterns": string[],
  "oneLiner": ""
}
`;

function parseJson(text) {
  const cleaned = (text || "").replace(/^```json\s*|\s*```$/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < 0) return { raw: text };
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return { raw: text };
  }
}

async function deepseek() {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return { error: "no DEEPSEEK_API_KEY" };
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "deepseek-chat",
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content:
            "Senior product + UX advisor for crypto casino/sportsbook. Practical, guest-first, Asia-friendly. JSON only.",
        },
        { role: "user", content: context },
      ],
    }),
  });
  const data = await res.json();
  if (!res.ok) return { error: data?.error || res.status, raw: data };
  return parseJson(data.choices?.[0]?.message?.content || "");
}

async function gemini(ds) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { error: "no GEMINI_API_KEY" };
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
                  text: `You are a senior guest-experience designer for cyber888.vip (crypto sportsbook + casino).
Review DeepSeek JSON. Agree, improve, fill gaps (especially: comfortable first-visit flow, trust, mobile thumb-zone, wallet clarity, lobby comfort while APIs are stubs).
Keep same schema; add "geminiNotes": string[] and "cursorShouldPrioritize": string[].

DeepSeek:
${JSON.stringify(ds)}

Original ask:
${context}

Reply JSON only.`,
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
    const parsed = parseJson(text);
    if (!parsed.raw) return { model, ...parsed };
  }
  return { error: "gemini failed all models" };
}

const ds = await deepseek();
const gm = await gemini(ds);
const result = { deepseek: ds, gemini: gm, at: new Date().toISOString() };
fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
console.log(JSON.stringify({ ok: true, out: outPath, dsOk: !ds.error && !ds.raw, gmOk: !gm.error && !gm.raw }, null, 2));
