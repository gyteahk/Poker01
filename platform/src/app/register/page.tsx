"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: fd.get("email"),
        password: fd.get("password"),
        displayName: fd.get("displayName"),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Register failed");
      return;
    }
    window.location.href = "/wallet";
  }

  return (
    <div className="app-body">
      <div className="card" style={{ maxWidth: 420, margin: "1.5rem auto" }}>
        <div className="panel-head" style={{ margin: "-0.9rem -1rem 0.85rem" }}>
          開戶
        </div>
        <h1>註冊</h1>
        <p className="muted">建立會員，自動開設 USDT 錢包帳本。</p>
        <form className="stack" onSubmit={onSubmit} style={{ marginTop: "0.85rem" }}>
          <label>
            顯示名稱
            <input name="displayName" required minLength={2} maxLength={40} />
          </label>
          <label>
            Email
            <input name="email" type="email" required />
          </label>
          <label>
            Password（最少 8 位）
            <input name="password" type="password" required minLength={8} />
          </label>
          {error ? <div className="alert error">{error}</div> : null}
          <button type="submit" disabled={loading}>
            {loading ? "…" : "建立帳號"}
          </button>
        </form>
        <p className="muted" style={{ marginTop: "0.85rem" }}>
          已有帳號？ <Link href="/login">登入</Link>
        </p>
      </div>
    </div>
  );
}
