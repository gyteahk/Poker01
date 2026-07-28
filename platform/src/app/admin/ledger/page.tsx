"use client";

import { useCallback, useEffect, useState } from "react";

type Entry = {
  id: string;
  type: string;
  amount: string;
  balanceAfter: string;
  lockedAfter: string;
  note: string | null;
  createdAt: string;
  user: { email: string; displayName: string };
};

const TYPES = [
  "ALL",
  "DEPOSIT",
  "WITHDRAW_LOCK",
  "WITHDRAW_RELEASE",
  "WITHDRAW_PAYOUT",
  "BET_LOCK",
  "BET_SETTLE_WIN",
  "BET_SETTLE_LOSS",
] as const;

export default function AdminLedgerPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [type, setType] = useState("ALL");
  const [err, setErr] = useState("");

  const refresh = useCallback(async () => {
    const qs = type === "ALL" ? "" : `?type=${type}`;
    const res = await fetch(`/api/admin/ledger${qs}`);
    if (res.status === 401 || res.status === 403) {
      setErr("需要管理員登入");
      return;
    }
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error || "載入失敗");
      return;
    }
    setEntries(data.entries || []);
  }, [type]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <>
      <div className="row" style={{ flexWrap: "wrap" }}>
        {TYPES.map((t) => (
          <button
            key={t}
            type="button"
            className={type === t ? undefined : "secondary"}
            onClick={() => setType(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {err ? <div className="alert error">{err}</div> : null}

      <section className="card">
        <table className="table">
          <thead>
            <tr>
              <th>時間</th>
              <th>用戶</th>
              <th>類型</th>
              <th>金額</th>
              <th>餘額後</th>
              <th>鎖定後</th>
              <th>備註</th>
            </tr>
          </thead>
          <tbody>
            {entries.length ? (
              entries.map((e) => (
                <tr key={e.id}>
                  <td>{new Date(e.createdAt).toLocaleString()}</td>
                  <td>
                    {e.user.displayName}
                    <div className="muted">{e.user.email}</div>
                  </td>
                  <td>{e.type}</td>
                  <td>{e.amount}</td>
                  <td>{e.balanceAfter}</td>
                  <td>{e.lockedAfter}</td>
                  <td className="muted">{e.note}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="muted">
                  沒有流水
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}
