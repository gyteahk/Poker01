"use client";

import { useCallback, useEffect, useState } from "react";

type Deposit = {
  id: string;
  amount: string;
  status: string;
  payAddress: string;
  txHash: string | null;
  createdAt: string;
  confirmedAt: string | null;
  user: { email: string; displayName: string };
};

export default function AdminDepositsPage() {
  const [rows, setRows] = useState<Deposit[]>([]);
  const [status, setStatus] = useState("ALL");
  const [err, setErr] = useState("");

  const refresh = useCallback(async () => {
    const qs = status === "ALL" ? "" : `?status=${status}`;
    const res = await fetch(`/api/admin/deposits${qs}`);
    if (res.status === 401 || res.status === 403) {
      setErr("需要管理員登入");
      return;
    }
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error || "載入失敗");
      return;
    }
    setRows(data.deposits || []);
  }, [status]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <>
      <div className="row">
        {(["ALL", "PENDING", "CONFIRMED", "EXPIRED"] as const).map((s) => (
          <button
            key={s}
            type="button"
            className={status === s ? undefined : "secondary"}
            onClick={() => setStatus(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {err ? <div className="alert error">{err}</div> : null}

      <section className="card">
        <table className="table">
          <thead>
            <tr>
              <th>用戶</th>
              <th>金額</th>
              <th>狀態</th>
              <th>地址</th>
              <th>Tx</th>
              <th>時間</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((d) => (
                <tr key={d.id}>
                  <td>
                    {d.user.displayName}
                    <div className="muted">{d.user.email}</div>
                  </td>
                  <td>{d.amount}</td>
                  <td>{d.status}</td>
                  <td className="mono">{d.payAddress}</td>
                  <td className="mono">{d.txHash || "—"}</td>
                  <td>{new Date(d.createdAt).toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="muted">
                  沒有充值紀錄
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}
