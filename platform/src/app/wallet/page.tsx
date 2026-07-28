"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type WalletData = {
  available: string;
  locked: string;
  entries: Array<{
    id: string;
    type: string;
    amount: string;
    balanceAfter: string;
    note: string | null;
    createdAt: string;
  }>;
};

type DepositInfo = {
  depositId: string;
  payAddress: string;
  amount: string;
  payAmount?: string;
  gatewayOrderId: string;
  expiresAt: string;
  provider?: string;
  canSimulate?: boolean;
  note?: string;
};

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [deposit, setDeposit] = useState<DepositInfo | null>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/wallet");
    if (res.status === 401) {
      window.location.href = "/login";
      return;
    }
    const data = await res.json();
    setWallet(data);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function createDeposit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    setMsg("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const raw = String(fd.get("amountUsdt") || "").trim();
    const payload: { amountUsdt?: number } = {};
    if (raw) {
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 15) {
        setLoading(false);
        setErr("若填金額，最少 15 USDT");
        return;
      }
      payload.amountUsdt = n;
    }
    const res = await fetch("/api/deposit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setErr(data.error || "Failed");
      return;
    }
    setDeposit(data);
    setCopied(false);
    setMsg(data.note || "已產生入金地址");
  }

  async function copyAddress() {
    if (!deposit?.payAddress) return;
    try {
      await navigator.clipboard.writeText(deposit.payAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setErr("複製失敗，請手動選取地址");
    }
  }

  async function simulateConfirm() {
    if (!deposit) return;
    setLoading(true);
    setErr("");
    const res = await fetch("/api/deposit/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-gateway-secret": "dev-gateway-webhook-secret",
      },
      body: JSON.stringify({
        gatewayOrderId: deposit.gatewayOrderId,
        txHash: `sim_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        amountUsdt: Number(deposit.amount),
        status: "confirmed",
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setErr(data.error || "Webhook failed");
      return;
    }
    setMsg(`入帳成功：+${data.credited} USDT`);
    setDeposit(null);
    await refresh();
  }

  async function createWithdraw(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    setMsg("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amountUsdt: Number(fd.get("amountUsdt")),
        toAddress: String(fd.get("toAddress")),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setErr(data.error || "Withdraw failed");
      return;
    }
    setMsg(data.note || `提現狀態：${data.status}`);
    await refresh();
  }

  return (
    <div className="app-body">
      <div className="stack" style={{ gap: "0.75rem" }}>
        <section className="page-title-bar">
          <h1>錢包</h1>
          <p className="muted">鏈：USDT-TRC20｜金額以帳本流水記帳</p>
          <div className="hero-balance" style={{ marginTop: "0.55rem" }}>
            {wallet ? `${wallet.available} USDT` : "…"}
          </div>
          <p className="muted" style={{ margin: "0.2rem 0 0" }}>
            鎖定中：{wallet?.locked ?? "0"} USDT
          </p>
        </section>

        <section className="grid grid-2">
          <form className="card stack" onSubmit={createDeposit}>
            <h2>USDT 入金</h2>
            <p className="muted" style={{ margin: 0 }}>
              唔使填金額都可以：產生地址後轉幾多就入幾多。
            </p>
            <label>
              預計金額（選填，最少 15 USDT-TRC20）
              <input name="amountUsdt" type="number" min={15} step={1} placeholder="可留空" />
            </label>
            <button type="submit" disabled={loading}>
              產生入金地址
            </button>
          {deposit ? (
            <div className="alert ok stack" style={{ alignItems: "flex-start" }}>
              <div>
                建議金額 <strong>{deposit.amount} USDT-TRC20</strong>
                {deposit.payAmount && deposit.payAmount !== deposit.amount ? (
                  <>
                    （報價 <strong>{deposit.payAmount}</strong>）
                  </>
                ) : null}
                。<strong>實際轉幾多，就入帳幾多</strong>。
              </div>
              <div className="deposit-qr">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=8&data=${encodeURIComponent(deposit.payAddress)}`}
                  alt="USDT TRC20 deposit QR"
                  width={180}
                  height={180}
                />
              </div>
              <div className="row" style={{ width: "100%", alignItems: "flex-start" }}>
                <div className="mono" style={{ flex: 1 }}>
                  {deposit.payAddress}
                </div>
                <button type="button" className="secondary" onClick={() => void copyAddress()}>
                  {copied ? "已複製" : "複製"}
                </button>
              </div>
              <p className="muted" style={{ margin: 0 }}>
                通道為純 USDT-TRC20（無兌換／非 fixed rate，目標手續費 0.5% 檔）。到帳按實際金額入帳。
              </p>
              {deposit.provider ? (
                <div className="muted">通道：{deposit.provider}</div>
              ) : null}
              {deposit.canSimulate ? (
                <button type="button" className="secondary" onClick={simulateConfirm} disabled={loading}>
                  模擬鏈上確認入帳（開發用）
                </button>
              ) : (
                <p className="muted">到帳後會經 NOWPayments IPN 自動入帳（需公開 HTTPS callback）</p>
              )}
            </div>
          ) : null}
          </form>

          <form className="card stack" onSubmit={createWithdraw}>
            <h2>提現（人手審核）</h2>
            <label>
              金額（USDT，最少 10）
              <input name="amountUsdt" type="number" min={10} step={1} defaultValue={50} required />
            </label>
            <label>
              TRC20 地址
              <input
                name="toAddress"
                className="mono"
                required
                placeholder="T..."
                defaultValue="TXYZabcdefghijklmnopqrstuvwxyz123456"
              />
            </label>
            <button type="submit" disabled={loading}>
              提交提現
            </button>
            <p className="muted">
            ≤1000 USDT 且過風控會自動出款；否則進後台人手審核（首提、新號、改地址、剛入金等）。
          </p>
          </form>
        </section>

        {err ? <div className="alert error">{err}</div> : null}
        {msg ? <div className="alert ok">{msg}</div> : null}

        <section className="card">
          <h2>最近流水</h2>
          <table className="table">
            <thead>
              <tr>
                <th>時間</th>
                <th>類型</th>
                <th>金額</th>
                <th>餘額後</th>
                <th>備註</th>
              </tr>
            </thead>
            <tbody>
              {wallet?.entries?.length ? (
                wallet.entries.map((e) => (
                  <tr key={e.id}>
                    <td>{new Date(e.createdAt).toLocaleString()}</td>
                    <td>{e.type}</td>
                    <td>{e.amount}</td>
                    <td>{e.balanceAfter}</td>
                    <td className="muted">{e.note}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="muted">
                    暫無流水
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
