"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PlayingCard } from "@/components/PlayingCard";
import { useI18n } from "@/components/I18nProvider";
import { CONTACT } from "@/lib/i18n";
import { parseCard } from "@/lib/poker";
import type { DecisionAction, ScenarioPublic } from "@/lib/decision";
import { recordDailyPlay } from "@/lib/stats";

type VoteInfo = {
  total: number;
  fold: number;
  call: number;
  raise: number;
};

type Reveal = {
  yourAction: DecisionAction;
  correct: boolean;
  math: {
    equity: number;
    requiredEquity: number;
    margin: number;
    action: DecisionAction;
  };
  outcome: {
    result: "win" | "lose" | "tie";
    heroClass: string;
    villainClass: string;
    finalBoard: string[];
    opponents: string[][];
  };
  votes: VoteInfo;
};

export function DailyDecision() {
  const { t, locale } = useI18n();
  const [scenario, setScenario] = useState<ScenarioPublic | null>(null);
  const [votes, setVotes] = useState<VoteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [error, setError] = useState(false);
  const [dayStreak, setDayStreak] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/daily");
      const data = await res.json();
      setScenario(data.scenario);
      setVotes(data.votes);
      setReveal(null);
      setNow(Date.now());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const remainMs = useMemo(() => {
    if (!scenario) return 0;
    return Math.max(0, scenario.expiresAt - now);
  }, [scenario, now]);

  useEffect(() => {
    if (!scenario || remainMs > 0) return;
    void load();
  }, [remainMs, scenario, load]);

  const countdownLabel = useMemo(() => {
    const totalSec = Math.floor(remainMs / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [remainMs]);

  async function decide(action: DecisionAction) {
    if (!scenario || submitting || reveal) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, locale }),
      });
      const data = await res.json();
      setReveal(data);
      setVotes(data.votes);
      setDayStreak(recordDailyPlay().streak);
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  }

  const actionLabel = (a: DecisionAction) => {
    if (a === "fold") return t.daily.fold;
    if (a === "call") return t.daily.call;
    return t.daily.raise;
  };

  return (
    <div className="game-panel">
      <div className="game-top">
        <Link href="/play" className="text-link">
          ← {t.daily.back}
        </Link>
        <p className="score-pill live-pill">
          <span className="live-dot" />
          {t.daily.live}
          {dayStreak > 0 && (
            <> · {t.daily.streak}: {dayStreak}</>
          )}
        </p>
      </div>

      <h1 className="page-title">{t.daily.title}</h1>
      <p className="lead">{t.daily.subtitle}</p>

      {scenario && !loading && (
        <div className="countdown-banner" aria-live="polite">
          <span className="countdown-label">{t.daily.countdown}</span>
          <span className="countdown-digits">{countdownLabel}</span>
        </div>
      )}

      {loading && <p className="muted">{t.daily.loading}</p>}
      {error && <p className="result-msg bad">{t.daily.error}</p>}

      {scenario && !loading && (
        <>
          <div className="info-pills">
            <span>
              {t.daily.street}: {t.table.street[scenario.street]}
            </span>
            <span>
              {t.daily.players}: {scenario.numPlayers}
            </span>
            <span>
              {t.table.pot}: ${scenario.pot}
            </span>
            <span>
              {t.daily.toCall}: ${scenario.toCall}
            </span>
          </div>

          <div className="felt">
            <div className="seat rival-seat">
              <div className="seat-meta">
                <span>{t.daily.villains}</span>
              </div>
              <div className="card-row">
                {Array.from({ length: Math.min(2, scenario.numPlayers - 1) }).map(
                  (_, i) => (
                    <PlayingCard
                      key={i}
                      hidden={!reveal}
                      card={
                        reveal
                          ? parseCard(reveal.outcome.opponents[0]?.[i] ?? "As")
                          : undefined
                      }
                    />
                  ),
                )}
              </div>
            </div>

            <div className="board-area">
              <p className="pot-label">
                {t.table.pot} ${scenario.pot} · {t.daily.toCall} $
                {scenario.toCall}
              </p>
              <div className="card-row board-row">
                {(reveal ? reveal.outcome.finalBoard : scenario.board).map(
                  (code, i) => (
                    <PlayingCard key={i} card={parseCard(code)} />
                  ),
                )}
                {!reveal &&
                  Array.from({
                    length: Math.max(0, 5 - scenario.board.length),
                  }).map((_, i) => (
                    <div key={`g-${i}`} className="playing-card ghost" />
                  ))}
              </div>
            </div>

            <div className="seat hero-seat">
              <div className="card-row">
                {scenario.hero.map((code, i) => (
                  <PlayingCard key={i} card={parseCard(code)} />
                ))}
              </div>
              <div className="seat-meta">
                <span>{t.table.you}</span>
                <span>${scenario.heroStack}</span>
              </div>
            </div>
          </div>

          {!reveal ? (
            <div className="decision-actions">
              <button
                type="button"
                className="btn btn-fold"
                disabled={submitting}
                onClick={() => void decide("fold")}
              >
                {t.daily.fold}
              </button>
              <button
                type="button"
                className="btn btn-call"
                disabled={submitting}
                onClick={() => void decide("call")}
              >
                {t.daily.call}
              </button>
              <button
                type="button"
                className="btn btn-raise"
                disabled={submitting}
                onClick={() => void decide("raise")}
              >
                {t.daily.raise}
              </button>
            </div>
          ) : (
            <div className="result-panel">
              <p
                className={`result-msg ${reveal.correct ? "ok" : "bad"}`}
              >
                {reveal.correct ? t.daily.mathOk : t.daily.mathBad}{" "}
                ({actionLabel(reveal.math.action)})
              </p>
              <p className="muted">
                {t.daily.equity}: {reveal.math.equity}% · {t.daily.required}:{" "}
                {reveal.math.requiredEquity}% · {t.daily.margin}:{" "}
                {reveal.math.margin}%
              </p>
              <p className="muted">
                {t.daily.variance}:{" "}
                {reveal.outcome.result === "win"
                  ? t.daily.outcomeWin
                  : reveal.outcome.result === "lose"
                    ? t.daily.outcomeLose
                    : t.daily.outcomeTie}{" "}
                ({reveal.outcome.heroClass} vs {reveal.outcome.villainClass})
              </p>
              <p className="muted">{t.daily.varianceTip}</p>

              {votes && (
                <div className="crowd-bar">
                  <p className="crowd-title">
                    {t.daily.crowd} ({votes.total})
                  </p>
                  <div className="crowd-meters">
                    <div>
                      <span>{t.daily.fold}</span>
                      <b>{votes.fold}%</b>
                    </div>
                    <div>
                      <span>{t.daily.call}</span>
                      <b>{votes.call}%</b>
                    </div>
                    <div>
                      <span>{t.daily.raise}</span>
                      <b>{votes.raise}%</b>
                    </div>
                  </div>
                </div>
              )}

              <div className="trainer-actions" style={{ marginTop: "1rem" }}>
                <Link href="/wiki" className="btn btn-ghost">
                  {t.daily.learnOdds}
                </Link>
                <a
                  className="btn btn-gold"
                  href={CONTACT.clubJoinLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t.daily.ctaReal}
                </a>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
