import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  message: z.string().trim().min(1).max(1000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(2000),
      }),
    )
    .max(12)
    .optional(),
  locale: z.enum(["zh-Hant", "zh-Hans", "en"]).optional(),
});

const SYSTEM = `你是 cyber888.vip 的客服助理，對外名稱為「Cyber888 客服」。品牌：USDT-TRC20 體育／撲克／遊戲／錢包平台。

你可以協助：
- 註冊／登入、錢包入金（USDT-TRC20、實際到帳入帳）、提現與風控說明
- 足球盤口、撲克（真人荷官方向）、遊戲大廳導覽
- 基本操作步驟、常見錯誤（轉錯鏈、金額太少等）

規則：
- 用使用者語言回覆（繁中／簡中／英文）
- 語氣清晰、禮貌、簡潔；自稱「Cyber888 客服」
- 回覆用純文字：不要用 Markdown（禁止 **粗體**、# 標題、- 清單符號、--- 分隔線、\`code\`、連結語法）
- 如需分點，用「1. 2. 3.」或「・」即可，不要用 markdown 語法
- 不要承諾保證贏錢；鼓勵負責任博彩
- 不要索取密碼、私鑰、完整助記詞
- 不要捏造牌照／法律狀態；條款由營運確認
- 涉及凍結帳號、爭議出款、大額異常：請用戶留下問題重點，並說明稍後可由專人跟進
- 不要提供攻擊系統、洗錢、規避監管的建議
`;

function stripMarkdown(text: string) {
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^[-*]\s+/gm, "・")
    .replace(/^---+$/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function POST(req: NextRequest) {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "AI support is not configured (missing DEEPSEEK_API_KEY)" },
      { status: 503 },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  const { message, history = [], locale } = parsed.data;
  const langHint =
    locale === "en"
      ? "Reply in English."
      : locale === "zh-Hans"
        ? "请用简体中文回复。"
        : "請用繁體中文回覆。";

  const messages = [
    { role: "system", content: `${SYSTEM}\n${langHint}` },
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: message },
  ];

  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        temperature: 0.4,
        max_tokens: 700,
        messages,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "AI request failed" },
        { status: 502 },
      );
    }
    const reply = stripMarkdown(data.choices?.[0]?.message?.content || "");
    if (!reply) {
      return NextResponse.json({ error: "Empty AI reply" }, { status: 502 });
    }
    return NextResponse.json({
      reply,
      note: "ai", // frontend can show "AI 客服" badge
    });
  } catch {
    return NextResponse.json({ error: "AI unavailable" }, { status: 502 });
  }
}
