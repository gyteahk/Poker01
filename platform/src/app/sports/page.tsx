"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { CATEGORY_WIDE } from "@/lib/categories";

type EventRow = {
  id: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  startsAt: string;
  odds: { home: number; draw: number; away: number };
};

type Selection = "home" | "draw" | "away";

type SlipItem = {
  key: string;
  eventId: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  selection: Selection;
  selectionLabel: string;
  odds: number;
  stake: number;
};

const SPORTS = [
  { id: "football", labelKey: "sports.football" },
  { id: "basketball", labelKey: "sports.basketball", disabled: true },
  { id: "tennis", labelKey: "sports.tennis", disabled: true },
] as const;

function selectionLabel(ev: EventRow, sel: Selection, drawLabel: string) {
  if (sel === "home") return ev.homeTeam;
  if (sel === "away") return ev.awayTeam;
  return drawLabel;
}

function formatKickoff(iso: string, t: (k: string, v?: Record<string, string | number>) => string) {
  const ts = new Date(iso).getTime();
  const diff = ts - Date.now();
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60000);
  if (diff > 0 && mins < 60) return t("sports.minsLater", { n: mins });
  if (diff > 0 && mins < 48 * 60) return t("sports.hoursLater", { n: Math.round(mins / 60) });
  return new Date(iso).toLocaleString();
}

export default function SportsPage() {
  const { t } = useI18n();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [sport, setSport] = useState("football");
  const [leagueFilter, setLeagueFilter] = useState<string>("all");
  const [slip, setSlip] = useState<SlipItem[]>([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/sports");
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      const data = await res.json();
      setEvents(data.events || []);
    })();
  }, []);

  const leagues = useMemo(() => {
    const set = new Set(events.map((e) => e.league));
    return [...set];
  }, [events]);

  const filtered = useMemo(() => {
    if (leagueFilter === "all") return events;
    return events.filter((e) => e.league === leagueFilter);
  }, [events, leagueFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, EventRow[]>();
    for (const ev of filtered) {
      const list = map.get(ev.league) || [];
      list.push(ev);
      map.set(ev.league, list);
    }
    return [...map.entries()];
  }, [filtered]);

  function toggleOdds(ev: EventRow, selection: Selection) {
    const key = `${ev.id}:${selection}`;
    setErr("");
    setMsg("");
    setSlip((prev) => {
      const exists = prev.find((s) => s.key === key);
      if (exists) return prev.filter((s) => s.key !== key);
      const withoutSameEvent = prev.filter((s) => s.eventId !== ev.id);
      return [
        ...withoutSameEvent,
        {
          key,
          eventId: ev.id,
          league: ev.league,
          homeTeam: ev.homeTeam,
          awayTeam: ev.awayTeam,
          selection,
          selectionLabel: selectionLabel(ev, selection, t("sports.draw")),
          odds: ev.odds[selection],
          stake: 10,
        },
      ];
    });
  }

  function updateStake(key: string, stake: number) {
    setSlip((prev) => prev.map((s) => (s.key === key ? { ...s, stake } : s)));
  }

  function removeItem(key: string) {
    setSlip((prev) => prev.filter((s) => s.key !== key));
  }

  function clearSlip() {
    setSlip([]);
  }

  const totalStake = slip.reduce((sum, s) => sum + (Number.isFinite(s.stake) ? s.stake : 0), 0);
  const totalReturn = slip.reduce(
    (sum, s) => sum + (Number.isFinite(s.stake) ? s.stake * s.odds : 0),
    0
  );

  async function placeBets() {
    if (!slip.length) return;
    setErr("");
    setMsg("");
    setLoading(true);
    const results: string[] = [];
    for (const item of slip) {
      if (!item.stake || item.stake < 1) {
        setLoading(false);
        setErr("每注注碼最少 1 USDT");
        return;
      }
      const res = await fetch("/api/sports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: item.eventId,
          selection: item.selection,
          stakeUsdt: item.stake,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoading(false);
        setErr(data.error || "下注失敗");
        return;
      }
      results.push(
        `${data.selection} @ ${data.odds}｜注碼 ${data.stake}｜潛在派彩 ${data.potentialWin}`
      );
    }
    setLoading(false);
    setMsg(`已提交 ${results.length} 注：${results.join("；")}`);
    setSlip([]);
  }

  const selectedKeys = new Set(slip.map((s) => s.key));

  return (
    <div className="sb-layout">
      <aside className="sb-left">
        <div className="sports-cat-banner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={CATEGORY_WIDE.football} alt="" />
        </div>
        <div className="panel-head">{t("nav.sports")}</div>
        <ul className="sb-nav-list">
          {SPORTS.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className={sport === s.id ? "active" : undefined}
                disabled={"disabled" in s && s.disabled}
                onClick={() => setSport(s.id)}
              >
                {t(s.labelKey)}
                {"disabled" in s && s.disabled ? `（${t("sports.soon")}）` : ""}
              </button>
            </li>
          ))}
        </ul>
        <div className="panel-head" style={{ marginTop: "0.25rem" }}>
          聯賽
        </div>
        <ul className="sb-nav-list">
          <li>
            <button
              type="button"
              className={leagueFilter === "all" ? "active" : undefined}
              onClick={() => setLeagueFilter("all")}
            >
              全部聯賽
            </button>
          </li>
          {leagues.map((lg) => (
            <li key={lg}>
              <button
                type="button"
                className={leagueFilter === lg ? "active" : undefined}
                onClick={() => setLeagueFilter(lg)}
              >
                {lg}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="sb-center">
        <div className="panel-head">
          <span>足球 · 全場 1X2</span>
          <button
            type="button"
            className="secondary"
            style={{ padding: "0.15rem 0.5rem", fontSize: "0.72rem" }}
            onClick={() => {
              void (async () => {
                const res = await fetch("/api/sports");
                const data = await res.json();
                setEvents(data.events || []);
              })();
            }}
          >
            刷新
          </button>
        </div>

        {err ? (
          <div className="alert error" style={{ margin: "0.5rem" }}>
            {err}
          </div>
        ) : null}
        {msg ? (
          <div className="alert ok" style={{ margin: "0.5rem" }}>
            {msg}
          </div>
        ) : null}

        <div className="sb-market-head">
          <div>賽事</div>
          <div className="col">主</div>
          <div className="col">和</div>
          <div className="col">客</div>
        </div>

        {!events.length ? (
          <div className="sb-slip-empty">載入盤口中…</div>
        ) : !grouped.length ? (
          <div className="sb-slip-empty">此聯賽暫無賽事</div>
        ) : (
          grouped.map(([league, rows]) => (
            <div key={league}>
              <div className="sb-league-label">{league}</div>
              {rows.map((ev) => (
                <div key={ev.id} className="sb-event-row">
                  <div className="sb-event-meta">
                    <div className="teams">
                      {ev.homeTeam} vs {ev.awayTeam}
                    </div>
                    <div className="meta">{formatKickoff(ev.startsAt, t)}</div>
                  </div>
                  {(["home", "draw", "away"] as const).map((sel) => {
                    const key = `${ev.id}:${sel}`;
                    return (
                      <button
                        key={sel}
                        type="button"
                        className={`odds-btn${selectedKeys.has(key) ? " selected" : ""}`}
                        onClick={() => toggleOdds(ev, sel)}
                      >
                        <span className="odds-label">
                          {sel === "home" ? "1" : sel === "draw" ? "X" : "2"}
                        </span>
                        <span className="odds-value">{ev.odds[sel].toFixed(2)}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          ))
        )}
      </section>

      <aside className="sb-right">
        <div className="panel-head">
          <span>注單</span>
          {slip.length ? (
            <button
              type="button"
              className="secondary"
              style={{ padding: "0.15rem 0.45rem", fontSize: "0.7rem" }}
              onClick={clearSlip}
            >
              清空
            </button>
          ) : null}
        </div>
        <div className="sb-slip-body">
          {!slip.length ? (
            <div className="sb-slip-empty">點擊盤口賠率加入注單</div>
          ) : (
            slip.map((item) => (
              <div key={item.key} className="slip-item">
                <div className="slip-top">
                  <div>
                    <div className="slip-sel">{item.selectionLabel}</div>
                    <div className="slip-event">
                      {item.homeTeam} vs {item.awayTeam}
                    </div>
                    <div className="slip-event">{item.league}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="slip-odds">{item.odds.toFixed(2)}</div>
                    <button
                      type="button"
                      className="slip-remove"
                      onClick={() => removeItem(item.key)}
                      aria-label="移除"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <label style={{ marginTop: "0.45rem" }}>
                  注碼 USDT
                  <input
                    type="number"
                    min={1}
                    max={5000}
                    value={item.stake}
                    onChange={(e) => updateStake(item.key, Number(e.target.value))}
                  />
                </label>
                <div className="row" style={{ marginTop: "0.35rem", gap: "0.3rem" }}>
                  {[10, 50, 100].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className="secondary"
                      style={{ padding: "0.2rem 0.45rem", fontSize: "0.72rem" }}
                      onClick={() => updateStake(item.key, n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="muted-dim" style={{ fontSize: "0.72rem", marginTop: "0.25rem" }}>
                  潛在派彩 {(item.stake * item.odds || 0).toFixed(2)} USDT
                </div>
              </div>
            ))
          )}
        </div>
        <div className="slip-footer">
          <div className="totals">
            <span>總注碼</span>
            <strong>{totalStake.toFixed(2)} USDT</strong>
          </div>
          <div className="totals">
            <span>潛在派彩</span>
            <strong>{totalReturn.toFixed(2)} USDT</strong>
          </div>
          <button type="button" disabled={loading || !slip.length} onClick={() => void placeBets()}>
            {loading ? "提交中…" : `確認下注（${slip.length}）`}
          </button>
        </div>
      </aside>
    </div>
  );
}
