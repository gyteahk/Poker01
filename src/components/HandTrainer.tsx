"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PlayingCard } from "@/components/PlayingCard";
import { useI18n } from "@/components/I18nProvider";
import {
  bestHand,
  categoryLabel,
  compareScores,
  deal,
  type Card,
} from "@/lib/poker";
import {
  getBestStreak,
  getHighScore,
  getStreak,
  recordStreak,
  setHighScore,
} from "@/lib/stats";

type Round = {
  left: Card[];
  right: Card[];
  winner: "left" | "right" | "tie";
};

function makeRound(): Round {
  const cards = deal(10);
  const left = cards.slice(0, 5);
  const right = cards.slice(5, 10);
  const cmp = compareScores(bestHand(left), bestHand(right));
  return {
    left,
    right,
    winner: cmp > 0 ? "left" : cmp < 0 ? "right" : "tie",
  };
}

export function HandTrainer() {
  const { t, locale } = useI18n();
  const [round, setRound] = useState<Round>(() => makeRound());
  const [picked, setPicked] = useState<"left" | "right" | "tie" | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [highScore, setHs] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBest] = useState(0);

  useEffect(() => {
    setHs(getHighScore("trainer"));
    setStreak(getStreak("trainer"));
    setBest(getBestStreak("trainer"));
  }, []);

  const leftLabel = useMemo(
    () => categoryLabel(bestHand(round.left), locale),
    [round.left, locale],
  );
  const rightLabel = useMemo(
    () => categoryLabel(bestHand(round.right), locale),
    [round.right, locale],
  );

  function choose(choice: "left" | "right" | "tie") {
    if (picked) return;
    setPicked(choice);
    const ok = choice === round.winner;
    setScore((s) => {
      const correct = s.correct + (ok ? 1 : 0);
      const total = s.total + 1;
      setHs(setHighScore("trainer", correct));
      return { correct, total };
    });
    const nextStreak = recordStreak("trainer", ok);
    setStreak(nextStreak);
    setBest(getBestStreak("trainer"));
  }

  function next() {
    setRound(makeRound());
    setPicked(null);
  }

  return (
    <div className="game-panel">
      <div className="game-top">
        <Link href="/play" className="text-link">
          ← {t.trainer.back}
        </Link>
        <p className="score-pill">
          {t.trainer.score}: {score.correct}/{score.total}
          {highScore > 0 && (
            <> · {t.trainer.highScore}: {highScore}</>
          )}
          {streak > 0 && (
            <> · {t.trainer.streak}: {streak}</>
          )}
          {bestStreak > streak && bestStreak > 0 && (
            <> ({bestStreak})</>
          )}
        </p>
      </div>
      <h1 className="page-title">{t.trainer.title}</h1>
      <p className="lead">{t.trainer.prompt}</p>

      <div className="trainer-boards">
        <button
          type="button"
          className={`board-choice ${picked === "left" ? "picked" : ""} ${
            picked && round.winner === "left" ? "winner" : ""
          }`}
          onClick={() => choose("left")}
          disabled={!!picked}
        >
          <span className="board-label">{t.trainer.left}</span>
          <div className="card-row">
            {round.left.map((c, i) => (
              <PlayingCard key={`l-${i}`} card={c} compact />
            ))}
          </div>
          {picked && <span className="hand-tag">{leftLabel}</span>}
        </button>

        <button
          type="button"
          className={`board-choice ${picked === "right" ? "picked" : ""} ${
            picked && round.winner === "right" ? "winner" : ""
          }`}
          onClick={() => choose("right")}
          disabled={!!picked}
        >
          <span className="board-label">{t.trainer.right}</span>
          <div className="card-row">
            {round.right.map((c, i) => (
              <PlayingCard key={`r-${i}`} card={c} compact />
            ))}
          </div>
          {picked && <span className="hand-tag">{rightLabel}</span>}
        </button>
      </div>

      <div className="trainer-actions">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => choose("tie")}
          disabled={!!picked}
        >
          {t.trainer.tie}
        </button>
        {picked && (
          <>
            <p
              className={`result-msg ${
                picked === round.winner ? "ok" : "bad"
              }`}
            >
              {picked === round.winner ? t.trainer.correct : t.trainer.wrong}
            </p>
            <button type="button" className="btn btn-gold" onClick={next}>
              {t.trainer.next}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
