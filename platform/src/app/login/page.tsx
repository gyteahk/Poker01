"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: fd.get("email"),
        password: fd.get("password"),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Login failed");
      return;
    }
    window.location.href = "/wallet";
  }

  return (
    <div className="app-body">
      <div className="card" style={{ maxWidth: 420, margin: "1.5rem auto" }}>
        <div className="panel-head" style={{ margin: "-0.9rem -1rem 0.85rem" }}>
          會員登入
        </div>
        <h1>登入</h1>
        <p className="muted">進入錢包、體育盤與遊戲大廳。</p>
        <form className="stack" onSubmit={onSubmit} style={{ marginTop: "0.85rem" }}>
          <label>
            Email
            <input name="email" type="email" required placeholder="you@email.com" />
          </label>
          <label>
            Password
            <input name="password" type="password" required minLength={8} />
          </label>
          {error ? <div className="alert error">{error}</div> : null}
          <button type="submit" disabled={loading}>
            {loading ? "…" : "登入"}
          </button>
        </form>
        <p className="muted" style={{ marginTop: "0.85rem" }}>
          未有帳號？ <Link href="/register">註冊</Link>
        </p>
      </div>
    </div>
  );
}
