"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Toast } from "@/components/Toast";
import { useI18n } from "@/lib/i18n/I18nProvider";

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

const ADDR_KEY = "cyber888_withdraw_addrs";

function ledgerBadge(type: string) {
  const t = type.toUpperCase();
  if (t.includes("DEPOSIT") || t.includes("CREDIT") || t.includes("WIN")) {
    return { label: type, className: "badge ok" };
  }
  if (t.includes("WITHDRAW") || t.includes("LOCK") || t.includes("PENDING")) {
    return { label: type, className: "badge warn" };
  }
  if (t.includes("REJECT") || t.includes("FAIL") || t.includes("DEBIT") || t.includes("BET")) {
    return { label: type, className: "badge" };
  }
  return { label: type, className: "badge" };
}

function loadAddrs(): string[] {
  try {
    const raw = localStorage.getItem(ADDR_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as string[];
    return Array.isArray(list) ? list.filter((x) => typeof x === "string").slice(0, 3) : [];
  } catch {
    return [];
  }
}

function saveAddr(addr: string) {
  const next = [addr, ...loadAddrs().filter((a) => a !== addr)].slice(0, 3);
  localStorage.setItem(ADDR_KEY, JSON.stringify(next));
  return next;
}

export default function WalletPage() {
  const { t } = useI18n();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [deposit, setDeposit] = useState<DepositInfo | null>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [savedAddrs, setSavedAddrs] = useState<string[]>([]);
  const [toAddress, setToAddress] = useState("");
  const [booting, setBooting] = useState(true);

  const flash = useCallback((text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/wallet");
    if (res.status === 401) {
      window.location.href = "/login";
      return;
    }
    const data = await res.json();
    setWallet(data);
    setBooting(false);
  }, []);

  useEffect(() => {
    setSavedAddrs(loadAddrs());
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
    setMsg(data.note || "已產生入金地址");
    flash("入金地址已就緒");
  }

  async function copyAddress() {
    if (!deposit?.payAddress) return;
    try {
      await navigator.clipboard.writeText(deposit.payAddress);
      flash("地址已複製");
    } catch {
      setErr("複製失敗，請手動選取地址");
    }
  }

  async function pasteAddress() {
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (!text) return;
      setToAddress(text);
      flash("已貼上地址");
    } catch {
      setErr("無法讀取剪貼簿，請手動貼上");
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
    flash("入帳成功");
    await refresh();
  }

  async function createWithdraw(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    setMsg("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const amountUsdt = Number(fd.get("amountUsdt"));
    const addr = String(fd.get("toAddress") || toAddress).trim();
    const res = await fetch("/api/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountUsdt, toAddress: addr }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setErr(data.error || "Withdraw failed");
      return;
    }
    setSavedAddrs(saveAddr(addr));
    setMsg(data.note || `提現狀態：${data.status}`);
    flash("提現已提交");
    await refresh();
  }

  return (
    <div className="app-body">
      <Toast message={toast} />
      <div className="stack" style={{ gap: "0.75rem" }}>
        <section className="page-title-bar">
          <h1>{t("wallet.title")}</h1>
          <p className="muted">
            {t("wallet.lead")}｜
            <Link href="/help/usdt">{t("wallet.whyUsdt")}</Link>
          </p>
          {booting ? (
            <div className="skeleton skeleton-balance" style={{ marginTop: "0.55rem" }} />
          ) : (
            <>
              <div className="hero-balance" style={{ marginTop: "0.55rem" }}>
                {wallet ? `${wallet.available} USDT` : "…"}
              </div>
              <p className="muted" style={{ margin: "0.2rem 0 0" }}>
                {t("wallet.available")}{" "}
                <strong style={{ color: "var(--accent)" }}>{wallet?.available ?? "0"}</strong>
                {" · "}
                {t("wallet.locked")} <strong>{wallet?.locked ?? "0"}</strong> USDT
              </p>
            </>
          )}
        </section>

        <div className="wallet-fee-bar">
          <span>{t("wallet.feeDeposit")}</span>
          <span>{t("wallet.feeWithdraw")}</span>
        </div>

        <section className="grid grid-2">
          <form className="card stack" onSubmit={createDeposit}>
            <h2>{t("wallet.deposit")}</h2>
            <ol className="wallet-steps muted">
              <li>產生地址（金額可留空）</li>
              <li>用錢包掃 QR 或貼上地址，只轉 USDT-TRC20</li>
              <li>到帳後自動入帳（需正式 HTTPS IPN）</li>
            </ol>
            <label>
              預計金額（選填，最少 15 USDT-TRC20）
              <input name="amountUsdt" type="number" min={15} step={1} placeholder="可留空" />
            </label>
            <button type="submit" disabled={loading}>
              產生入金地址
            </button>
            {deposit ? (
              <div className="alert ok stack" style={{ alignItems: "flex-start" }}>
                <div className="row" style={{ width: "100%", justifyContent: "space-between" }}>
                  <span className="badge ok">等待轉帳</span>
                  <span className="muted-dim">建議 {deposit.amount} USDT</span>
                </div>
                <div>
                  <strong>實際轉幾多，就入帳幾多</strong>
                  {deposit.payAmount && deposit.payAmount !== deposit.amount ? (
                    <>（報價 {deposit.payAmount}）</>
                  ) : null}
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
                    複製
                  </button>
                </div>
                <p className="muted" style={{ margin: 0 }}>
                  純 USDT-TRC20（無兌換／非 fixed rate）。唔好轉錯鏈。
                </p>
                {deposit.provider ? <div className="muted">通道：{deposit.provider}</div> : null}
                {deposit.canSimulate ? (
                  <button type="button" className="secondary" onClick={simulateConfirm} disabled={loading}>
                    模擬鏈上確認入帳（開發用）
                  </button>
                ) : (
                  <p className="muted">到帳後經 NOWPayments IPN 自動入帳（需公開 HTTPS callback）</p>
                )}
              </div>
            ) : null}
          </form>

          <form className="card stack" onSubmit={createWithdraw}>
            <h2>{t("wallet.withdraw")}</h2>
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
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
              />
            </label>
            <div className="row">
              <button type="button" className="secondary" onClick={() => void pasteAddress()}>
                貼上地址
              </button>
              <button type="submit" disabled={loading}>
                提交提現
              </button>
            </div>
            {savedAddrs.length ? (
              <div className="stack" style={{ gap: "0.35rem" }}>
                <span className="muted">最近地址</span>
                {savedAddrs.map((a) => (
                  <button
                    key={a}
                    type="button"
                    className="secondary addr-chip"
                    onClick={() => {
                      setToAddress(a);
                      flash("已選取地址");
                    }}
                  >
                    <span className="mono">{a.slice(0, 8)}…{a.slice(-6)}</span>
                  </button>
                ))}
              </div>
            ) : null}
            <p className="muted" style={{ margin: 0 }}>
              ≤1000 USDT 且過風控會自動出款；否則進後台人手審核（首提、新號、改地址、剛入金等）。
            </p>
          </form>
        </section>

        {err ? <div className="alert error">{err}</div> : null}
        {msg ? <div className="alert ok">{msg}</div> : null}

        <section className="card">
          <h2>{t("wallet.ledger")}</h2>
          {booting ? (
            <div className="stack">
              <div className="skeleton skeleton-row" />
              <div className="skeleton skeleton-row" />
              <div className="skeleton skeleton-row" />
            </div>
          ) : (
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
                  wallet.entries.map((e) => {
                    const b = ledgerBadge(e.type);
                    return (
                      <tr key={e.id}>
                        <td>{new Date(e.createdAt).toLocaleString()}</td>
                        <td>
                          <span className={b.className}>{b.label}</span>
                        </td>
                        <td>{e.amount}</td>
                        <td>{e.balanceAfter}</td>
                        <td className="muted">{e.note}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="muted">
                      {t("wallet.noLedger")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
