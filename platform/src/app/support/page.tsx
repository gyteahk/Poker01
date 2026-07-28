"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";

type Msg = { role: "user" | "assistant"; content: string };

export default function SupportPage() {
  const { t, locale } = useI18n();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([{ role: "assistant", content: t("support.welcome") }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setErr("");
    setInput("");
    const nextHistory = [...messages, { role: "user" as const, content: text }];
    setMessages(nextHistory);
    setBusy(true);

    try {
      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          locale,
          history: nextHistory
            .filter((m) => m.role === "user" || m.role === "assistant")
            .slice(-10)
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || t("support.error"));
        setMessages((m) => [
          ...m,
          { role: "assistant", content: t("support.errorFallback") },
        ]);
      } else {
        setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      }
    } catch {
      setErr(t("support.error"));
      setMessages((m) => [...m, { role: "assistant", content: t("support.errorFallback") }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-body">
      <div className="stack support-page" style={{ gap: "0.75rem" }}>
        <section className="page-title-bar">
          <h1>{t("support.title")}</h1>
          <p className="muted">{t("support.lead")}</p>
          <span className="badge ok" style={{ marginTop: "0.45rem" }}>
            {t("support.badge")}
          </span>
        </section>

        <section className="support-chat card">
          <div className="support-thread">
            {messages.map((m, i) => (
              <div key={i} className={`support-bubble ${m.role}`}>
                <span className="support-who">
                  {m.role === "assistant" ? t("support.aiName") : t("support.you")}
                </span>
                <p>{m.content}</p>
              </div>
            ))}
            {busy ? <div className="support-typing muted">{t("support.typing")}</div> : null}
            <div ref={bottomRef} />
          </div>

          {err ? <div className="alert error">{err}</div> : null}

          <form className="support-composer" onSubmit={onSubmit}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("support.placeholder")}
              maxLength={1000}
              disabled={busy}
            />
            <button type="submit" disabled={busy || !input.trim()}>
              {t("support.send")}
            </button>
          </form>
          <p className="muted-dim support-hint">{t("support.hint")}</p>
        </section>
      </div>
    </div>
  );
}
