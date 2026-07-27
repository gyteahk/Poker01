"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PlayingCard } from "@/components/PlayingCard";
import { useI18n } from "@/components/I18nProvider";
import {
  bestHand,
  CATEGORY_NAME,
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

function makeRound(locale: "zh" | "en") {
  const cards = deal(5);
  const answer = bestHand(cards)[0];
  const labels = CATEGORY_NAME[locale];
  const options = new Set<number>([answer]);
  while (options.size < 4) {
    options.add(Math.floor(Math.random() * 9));
  }
  return {
    cards,
    answer,
    options: [...options].sort(() => Math.random() - 0.5).map((i) => ({
      id: i,
      label: labels[i],
    })),
  };
}

export function RankQuiz() {
  const { t, locale } = useI18n();
  const [round, setRound] = useState(() => makeRound(locale));
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [highScore, setHs] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBest] = useState(0);

  useEffect(() => {
    setHs(getHighScore("quiz"));
    setStreak(getStreak("quiz"));
    setBest(getBestStreak("quiz"));
  }, []);

  const answerLabel = useMemo(
    () => CATEGORY_NAME[locale][round.answer],
    [locale, round.answer],
  );

  function choose(id: number) {
    if (picked !== null) return;
    setPicked(id);
    const ok = id === round.answer;
    setScore((s) => {
      const correct = s.correct + (ok ? 1 : 0);
      const total = s.total + 1;
      setHs(setHighScore("quiz", correct));
      return { correct, total };
    });
    const nextStreak = recordStreak("quiz", ok);
    setStreak(nextStreak);
    setBest(getBestStreak("quiz"));
  }

  function next() {
    setRound(makeRound(locale));
    setPicked(null);
  }

  return (
    <div className="game-panel">
      <div className="game-top">
        <Link href="/play" className="text-link">
          ← {t.quiz.back}
        </Link>
        <p className="score-pill">
          {t.quiz.score}: {score.correct}/{score.total}
          {highScore > 0 && (
            <> · {t.quiz.highScore}: {highScore}</>
          )}
          {streak > 0 && (
            <> · {t.quiz.streak}: {streak}</>
          )}
          {bestStreak > streak && bestStreak > 0 && (
            <> ({bestStreak})</>
          )}
        </p>
      </div>
      <h1 className="page-title">{t.quiz.title}</h1>
      <p className="lead">{t.quiz.prompt}</p>

      <div className="card-row" style={{ marginTop: "1.25rem" }}>
        {round.cards.map((card: Card, i) => (
          <PlayingCard key={i} card={card} />
        ))}
      </div>

      <div className="quiz-options">
        {round.options.map((opt) => {
          let cls = "quiz-option";
          if (picked !== null) {
            if (opt.id === round.answer) cls += " correct";
            else if (opt.id === picked) cls += " wrong";
          }
          return (
            <button
              key={opt.id}
              type="button"
              className={cls}
              onClick={() => choose(opt.id)}
              disabled={picked !== null}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <div className="trainer-actions" style={{ marginTop: "1.25rem" }}>
          <p className={`result-msg ${picked === round.answer ? "ok" : "bad"}`}>
            {picked === round.answer
              ? t.quiz.correct
              : `${t.quiz.wrong} ${answerLabel}`}
          </p>
          <button type="button" className="btn btn-gold" onClick={next}>
            {t.quiz.next}
          </button>
        </div>
      )}
    </div>
  );
}
