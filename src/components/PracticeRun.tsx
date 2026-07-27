"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PlayingCard } from "@/components/PlayingCard";
import { useI18n } from "@/components/I18nProvider";
import { CONTACT } from "@/lib/i18n";
import {
  actualOutcome,
  buildPracticeHand,
  type DecisionAction,
} from "@/lib/decision";
import { parseCard } from "@/lib/poker";

export function PracticeRun() {
  const { t, locale } = useI18n();
  const [hand, setHand] = useState(() => buildPracticeHand());
  const [streetIndex, setStreetIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const step = hand.streets[streetIndex]!;
  const done = finished || streetIndex >= hand.streets.length;

  const outcome = useMemo(() => {
    if (!done) return null;
    return actualOutcome(
      {
        windowId: 0,
        expiresAt: 0,
        numPlayers: 2,
        street: "river",
        hero: hand.hero,
        board: hand.finalBoard,
        pot: step.pot,
        toCall: step.toCall,
        heroStack: 800,
        villainStack: 800,
        finalBoard: hand.finalBoard,
        opponents: [hand.villain],
      },
      locale,
    );
  }, [done, hand, locale, step.pot, step.toCall]);

  function act(action: DecisionAction) {
    const math = step.decision;
    const ok = action === math.action;
    const note = ok
      ? `${t.table.street[step.street]} ✓ ${action} (eq ${math.equity}% / need ${math.requiredEquity}%)`
      : `${t.table.street[step.street]} ✗ ${action} → ${math.action} (eq ${math.equity}% / need ${math.requiredEquity}%)`;
    setLog((prev) => [...prev, note]);

    if (action === "fold" || streetIndex >= hand.streets.length - 1) {
      setFinished(true);
      return;
    }
    setStreetIndex((i) => i + 1);
  }

  function reset() {
    setHand(buildPracticeHand());
    setStreetIndex(0);
    setFinished(false);
    setLog([]);
  }

  return (
    <div className="game-panel">
      <div className="game-top">
        <Link href="/play" className="text-link">
          ← {t.practice.back}
        </Link>
        <p className="score-pill">
          {done
            ? t.table.street.showdown
            : t.table.street[step.street]}
        </p>
      </div>
      <h1 className="page-title">{t.practice.title}</h1>
      <p className="lead">{t.practice.subtitle}</p>

      <div className="info-pills">
        <span>
          {t.table.pot}: ${step.pot}
        </span>
        <span>
          {t.daily.toCall}: ${step.toCall}
        </span>
      </div>

      <div className="felt">
        <div className="seat">
          <div className="card-row">
            <PlayingCard
              card={parseCard(hand.villain[0]!)}
              hidden={!done}
            />
            <PlayingCard
              card={parseCard(hand.villain[1]!)}
              hidden={!done}
            />
          </div>
        </div>
        <div className="board-area">
          <div className="card-row board-row">
            {(done ? hand.finalBoard : step.board).map((c, i) => (
              <PlayingCard key={i} card={parseCard(c)} />
            ))}
            {!done &&
              Array.from({ length: Math.max(0, 5 - step.board.length) }).map(
                (_, i) => <div key={i} className="playing-card ghost" />,
              )}
          </div>
        </div>
        <div className="seat">
          <div className="card-row">
            {hand.hero.map((c, i) => (
              <PlayingCard key={i} card={parseCard(c)} />
            ))}
          </div>
        </div>
      </div>

      {!done ? (
        <div className="decision-actions">
          <button type="button" className="btn btn-fold" onClick={() => act("fold")}>
            {t.daily.fold}
          </button>
          <button type="button" className="btn btn-call" onClick={() => act("call")}>
            {t.daily.call}
          </button>
          <button type="button" className="btn btn-raise" onClick={() => act("raise")}>
            {t.daily.raise}
          </button>
        </div>
      ) : (
        <div className="result-panel">
          {outcome && (
            <p className="result-msg ok">
              {outcome.result === "win"
                ? t.daily.outcomeWin
                : outcome.result === "lose"
                  ? t.daily.outcomeLose
                  : t.daily.outcomeTie}{" "}
              ({outcome.heroClass} vs {outcome.villainClass})
            </p>
          )}
          <p className="muted">{t.practice.note}</p>
          <ul className="log-list">
            {log.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <div className="trainer-actions">
            <button type="button" className="btn btn-ghost" onClick={reset}>
              {t.practice.again}
            </button>
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
    </div>
  );
}
