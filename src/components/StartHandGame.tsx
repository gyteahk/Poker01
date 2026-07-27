"use client";

import { useState } from "react";
import Link from "next/link";
import { PlayingCard } from "@/components/PlayingCard";
import { useI18n } from "@/components/I18nProvider";
import { deal, RANK_VALUE, type Card } from "@/lib/poker";

function shouldPlay(cards: Card[]): boolean {
  const [a, b] = cards;
  const hi = Math.max(RANK_VALUE[a.rank], RANK_VALUE[b.rank]);
  const lo = Math.min(RANK_VALUE[a.rank], RANK_VALUE[b.rank]);
  const paired = a.rank === b.rank;
  const suited = a.suit === b.suit;
  if (paired) return true;
  if (hi === 14 && lo >= 10) return true;
  if (hi >= 13 && lo >= 12) return true;
  if (suited && hi === 14 && lo >= 9) return true;
  if (suited && hi >= 12 && lo >= 10) return true;
  if (suited && hi - lo <= 2 && hi >= 10) return true;
  return false;
}

export function StartHandGame() {
  const { t } = useI18n();
  const [cards, setCards] = useState<Card[]>(() => deal(2));
  const [picked, setPicked] = useState<"play" | "fold" | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const answer = shouldPlay(cards) ? "play" : "fold";

  function choose(choice: "play" | "fold") {
    if (picked) return;
    setPicked(choice);
    setScore((s) => ({
      correct: s.correct + (choice === answer ? 1 : 0),
      total: s.total + 1,
    }));
  }

  function next() {
    setCards(deal(2));
    setPicked(null);
  }

  return (
    <div className="game-panel">
      <div className="game-top">
        <Link href="/play" className="text-link">
          ← {t.startHand.back}
        </Link>
        <p className="score-pill">
          {t.startHand.score}: {score.correct}/{score.total}
        </p>
      </div>
      <h1 className="page-title">{t.startHand.title}</h1>
      <p className="lead">{t.startHand.prompt}</p>

      <div className="card-row" style={{ margin: "1.25rem 0" }}>
        <PlayingCard card={cards[0]} />
        <PlayingCard card={cards[1]} />
      </div>

      <div className="action-bar">
        <button
          type="button"
          className="btn btn-gold"
          onClick={() => choose("play")}
          disabled={!!picked}
        >
          {t.startHand.play}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => choose("fold")}
          disabled={!!picked}
        >
          {t.startHand.fold}
        </button>
      </div>

      {picked && (
        <div className="trainer-actions" style={{ marginTop: "1.25rem" }}>
          <p className={`result-msg ${picked === answer ? "ok" : "bad"}`}>
            {answer === "play" ? t.startHand.tipPlay : t.startHand.tipFold}
          </p>
          <button type="button" className="btn btn-gold" onClick={next}>
            {t.startHand.next}
          </button>
        </div>
      )}
    </div>
  );
}
