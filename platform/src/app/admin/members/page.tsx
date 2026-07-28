"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Member = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  createdAt: string;
  available: string;
  locked: string;
  deposits: number;
  withdrawals: number;
  bets: number;
};

export default function AdminMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");

  const refresh = useCallback(async (query = "") => {
    const res = await fetch(`/api/admin/members?q=${encodeURIComponent(query)}`);
    if (res.status === 401 || res.status === 403) {
      setErr("需要管理員登入");
      return;
    }
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error || "載入失敗");
      return;
    }
    setMembers(data.members || []);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    void refresh(q);
  }

  return (
    <>
      <form className="row" onSubmit={onSearch}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜尋 email／顯示名"
          style={{ minWidth: 220 }}
        />
        <button type="submit">搜尋</button>
        <button type="button" className="secondary" onClick={() => { setQ(""); void refresh(""); }}>
          清除
        </button>
      </form>

      {err ? <div className="alert error">{err}</div> : null}

      <section className="card">
        <table className="table">
          <thead>
            <tr>
              <th>會員</th>
              <th>角色</th>
              <th>可用</th>
              <th>鎖定</th>
              <th>充／提／注</th>
              <th>註冊時間</th>
            </tr>
          </thead>
          <tbody>
            {members.length ? (
              members.map((m) => (
                <tr key={m.id}>
                  <td>
                    {m.displayName}
                    <div className="muted">{m.email}</div>
                  </td>
                  <td>{m.role}</td>
                  <td>{m.available}</td>
                  <td>{m.locked}</td>
                  <td>
                    {m.deposits}/{m.withdrawals}/{m.bets}
                  </td>
                  <td>{new Date(m.createdAt).toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="muted">
                  沒有會員
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}
