"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Stats = {
  memberCount: number;
  pendingWithdrawals: number;
  pendingDeposits: number;
  confirmedDepositCount: number;
  confirmedDepositTotal: string;
  betCount: number;
};

export default function AdminHomePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/stats");
      if (res.status === 401 || res.status === 403) {
        setErr("需要管理員登入");
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "載入失敗");
        return;
      }
      setStats(data);
    })();
  }, []);

  return (
    <>
      {err ? <div className="alert error">{err}</div> : null}
      <section className="grid grid-2">
        <div className="card">
          <h2>待處理</h2>
          <p className="hero-balance" style={{ fontSize: "1.6rem" }}>
            {stats ? stats.pendingWithdrawals : "…"}
          </p>
          <p className="muted">待審提現</p>
          <Link className="btn" href="/admin/withdrawals" style={{ marginTop: "0.75rem", display: "inline-flex" }}>
            去審核
          </Link>
        </div>
        <div className="card">
          <h2>概況</h2>
          <table className="table">
            <tbody>
              <tr>
                <td className="muted">會員數</td>
                <td>{stats?.memberCount ?? "…"}</td>
              </tr>
              <tr>
                <td className="muted">待確認入金</td>
                <td>{stats?.pendingDeposits ?? "…"}</td>
              </tr>
              <tr>
                <td className="muted">已確認入金</td>
                <td>
                  {stats
                    ? `${stats.confirmedDepositCount} 筆／${stats.confirmedDepositTotal} USDT`
                    : "…"}
                </td>
              </tr>
              <tr>
                <td className="muted">注單數</td>
                <td>{stats?.betCount ?? "…"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
