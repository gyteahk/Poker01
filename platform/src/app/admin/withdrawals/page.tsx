"use client";

import { useCallback, useEffect, useState } from "react";

type Pending = {
  id: string;
  amount: string;
  toAddress: string;
  createdAt: string;
  status: string;
  user: { email: string; displayName: string };
};

export default function AdminWithdrawalsPage() {
  const [pending, setPending] = useState<Pending[]>([]);
  const [all, setAll] = useState<Pending[]>([]);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [tab, setTab] = useState<"pending" | "all">("pending");

  const refresh = useCallback(async () => {
    const res = await fetch(
      tab === "pending" ? "/api/admin/withdrawals?status=PENDING" : "/api/admin/withdrawals?status=ALL"
    );
    if (res.status === 401 || res.status === 403) {
      setErr("需要管理員登入");
      return;
    }
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error || "載入失敗");
      return;
    }
    setPending(data.pending || []);
    setAll(data.withdrawals || []);
  }, [tab]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function act(withdrawalId: string, action: "approve" | "reject") {
    setErr("");
    setMsg("");
    const res = await fetch("/api/admin/withdrawals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ withdrawalId, action }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error || "Action failed");
      return;
    }
    setMsg(`${action} → ${data.status} (${data.amount} USDT)`);
    await refresh();
  }

  const rows = tab === "pending" ? pending : all;

  return (
    <>
      <div className="row" style={{ gap: "0.5rem" }}>
        <button
          type="button"
          className={tab === "pending" ? undefined : "secondary"}
          onClick={() => setTab("pending")}
        >
          待審 ({pending.length || "…"})
        </button>
        <button
          type="button"
          className={tab === "all" ? undefined : "secondary"}
          onClick={() => setTab("all")}
        >
          全部紀錄
        </button>
      </div>

      {err ? <div className="alert error">{err}</div> : null}
      {msg ? <div className="alert ok">{msg}</div> : null}

      <section className="card">
        <table className="table">
          <thead>
            <tr>
              <th>用戶</th>
              <th>金額</th>
              <th>狀態</th>
              <th>地址</th>
              <th>時間</th>
              {tab === "pending" ? <th>操作</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((w) => (
                <tr key={w.id}>
                  <td>
                    {w.user.displayName}
                    <div className="muted">{w.user.email}</div>
                  </td>
                  <td>{w.amount}</td>
                  <td>{w.status}</td>
                  <td className="mono">{w.toAddress}</td>
                  <td>{new Date(w.createdAt).toLocaleString()}</td>
                  {tab === "pending" ? (
                    <td>
                      <div className="row">
                        <button type="button" onClick={() => act(w.id, "approve")}>
                          批准出款
                        </button>
                        <button type="button" className="danger" onClick={() => act(w.id, "reject")}>
                          拒絕
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={tab === "pending" ? 6 : 5} className="muted">
                  沒有資料
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}
