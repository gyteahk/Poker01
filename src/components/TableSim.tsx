"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { PlayingCard } from "@/components/PlayingCard";
import { useI18n } from "@/components/I18nProvider";
import {
  bestHand,
  categoryLabel,
  compareScores,
  createDeck,
  RANK_VALUE,
  shuffle,
  type Card,
} from "@/lib/poker";

type Street = "preflop" | "flop" | "turn" | "river" | "showdown";
type Outcome = "win" | "lose" | "split" | "foldedYou" | "foldedRival" | null;

type HandState = {
  deck: Card[];
  hero: Card[];
  rival: Card[];
  board: Card[];
  street: Street;
  pot: number;
  heroStack: number;
  rivalStack: number;
  toCall: number;
  outcome: Outcome;
  revealRival: boolean;
};

const SB = 5;
const BB = 10;
const RAISE = 20;

function startHand(heroStack = 500, rivalStack = 500): HandState {
  const deck = shuffle(createDeck());
  const hero = [deck.pop()!, deck.pop()!];
  const rival = [deck.pop()!, deck.pop()!];
  return {
    deck,
    hero,
    rival,
    board: [],
    street: "preflop",
    pot: SB + BB,
    heroStack: heroStack - BB,
    rivalStack: rivalStack - SB,
    toCall: 0,
    outcome: null,
    revealRival: false,
  };
}

function dealStreet(state: HandState): HandState {
  const deck = [...state.deck];
  const board = [...state.board];
  if (state.street === "preflop") {
    board.push(deck.pop()!, deck.pop()!, deck.pop()!);
    return { ...state, deck, board, street: "flop", toCall: 0 };
  }
  if (state.street === "flop") {
    board.push(deck.pop()!);
    return { ...state, deck, board, street: "turn", toCall: 0 };
  }
  if (state.street === "turn") {
    board.push(deck.pop()!);
    return { ...state, deck, board, street: "river", toCall: 0 };
  }
  return finishShowdown({ ...state, deck, board, street: "showdown" });
}

function finishShowdown(state: HandState): HandState {
  const heroScore = bestHand([...state.hero, ...state.board]);
  const rivalScore = bestHand([...state.rival, ...state.board]);
  const cmp = compareScores(heroScore, rivalScore);
  let heroStack = state.heroStack;
  let rivalStack = state.rivalStack;
  let outcome: Outcome = "split";
  if (cmp > 0) {
    heroStack += state.pot;
    outcome = "win";
  } else if (cmp < 0) {
    rivalStack += state.pot;
    outcome = "lose";
  } else {
    heroStack += Math.floor(state.pot / 2);
    rivalStack += Math.ceil(state.pot / 2);
    outcome = "split";
  }
  return {
    ...state,
    street: "showdown",
    heroStack,
    rivalStack,
    outcome,
    revealRival: true,
    toCall: 0,
  };
}

function holeStrength(cards: Card[]): number {
  const [a, b] = cards;
  const high = Math.max(RANK_VALUE[a.rank], RANK_VALUE[b.rank]);
  const low = Math.min(RANK_VALUE[a.rank], RANK_VALUE[b.rank]);
  const pair = a.rank === b.rank ? 3.2 : 0;
  const suited = a.suit === b.suit ? 0.45 : 0;
  return pair + high / 5 + low / 18 + suited;
}

function rivalStrength(state: HandState): number {
  if (state.board.length >= 3) {
    const score = bestHand([...state.rival, ...state.board]);
    return score[0] + (score[1] ?? 0) / 20;
  }
  return holeStrength(state.rival);
}

function rivalAct(state: HandState): HandState {
  if (state.outcome) return state;
  const strength = rivalStrength(state);
  const roll = Math.random();

  // Facing a bet
  if (state.toCall > 0) {
    if (strength < 1.2 && roll < 0.55) {
      return {
        ...state,
        outcome: "foldedRival",
        revealRival: true,
        heroStack: state.heroStack + state.pot,
        toCall: 0,
      };
    }
    const call = Math.min(state.toCall, state.rivalStack);
    let next: HandState = {
      ...state,
      pot: state.pot + call,
      rivalStack: state.rivalStack - call,
      toCall: 0,
    };
    if (strength > 3.5 && roll > 0.7 && next.rivalStack >= RAISE) {
      next = {
        ...next,
        pot: next.pot + RAISE,
        rivalStack: next.rivalStack - RAISE,
        toCall: RAISE,
      };
      return next;
    }
    return dealStreet(next);
  }

  // No bet — check or bet
  if (strength > 2.8 && roll > 0.45 && state.rivalStack >= RAISE) {
    return {
      ...state,
      pot: state.pot + RAISE,
      rivalStack: state.rivalStack - RAISE,
      toCall: RAISE,
    };
  }
  return dealStreet(state);
}

export function TableSim() {
  const { t, locale } = useI18n();
  const [state, setState] = useState<HandState>(() => startHand());

  const heroCat = useMemo(() => {
    if (state.board.length < 3) return null;
    return categoryLabel(bestHand([...state.hero, ...state.board]), locale);
  }, [state.hero, state.board, locale]);

  const rivalCat = useMemo(() => {
    if (!state.revealRival || state.board.length < 3) return null;
    return categoryLabel(bestHand([...state.rival, ...state.board]), locale);
  }, [state.rival, state.board, state.revealRival, locale]);

  const outcomeText = useMemo(() => {
    if (!state.outcome) return null;
    return t.table[state.outcome];
  }, [state.outcome, t.table]);

  const onFold = useCallback(() => {
    setState((s) => {
      if (s.outcome) return s;
      return {
        ...s,
        outcome: "foldedYou",
        revealRival: true,
        rivalStack: s.rivalStack + s.pot,
        toCall: 0,
      };
    });
  }, []);

  const onCallOrCheck = useCallback(() => {
    setState((s) => {
      if (s.outcome) return s;
      if (s.toCall > 0) {
        const call = Math.min(s.toCall, s.heroStack);
        const paid: HandState = {
          ...s,
          pot: s.pot + call,
          heroStack: s.heroStack - call,
          toCall: 0,
        };
        return rivalAct(paid);
      }
      return rivalAct(s);
    });
  }, []);

  const onRaise = useCallback(() => {
    setState((s) => {
      if (s.outcome || s.heroStack < RAISE) return s;
      const amount = RAISE + s.toCall;
      const paid = Math.min(amount, s.heroStack);
      const next: HandState = {
        ...s,
        pot: s.pot + paid,
        heroStack: s.heroStack - paid,
        toCall: 0,
      };
      // Rival faces raise
      const strength = rivalStrength(next);
      if (strength < 1.5 && Math.random() < 0.5) {
        return {
          ...next,
          outcome: "foldedRival",
          revealRival: true,
          heroStack: next.heroStack + next.pot,
        };
      }
      const callBack = Math.min(paid, next.rivalStack);
      const afterCall: HandState = {
        ...next,
        pot: next.pot + callBack,
        rivalStack: next.rivalStack - callBack,
        toCall: 0,
      };
      return dealStreet(afterCall);
    });
  }, []);

  const newHand = useCallback(() => {
    setState((s) =>
      startHand(
        Math.max(50, s.heroStack),
        Math.max(50, s.rivalStack),
      ),
    );
  }, []);

  return (
    <div className="game-panel">
      <div className="game-top">
        <Link href="/play" className="text-link">
          ← {t.table.back}
        </Link>
        <p className="score-pill">{t.table.street[state.street]}</p>
      </div>
      <h1 className="page-title">{t.table.title}</h1>

      <div className="felt">
        <div className="seat rival-seat">
          <div className="seat-meta">
            <span>{t.table.rival}</span>
            <span>${state.rivalStack}</span>
          </div>
          <div className="card-row">
            <PlayingCard card={state.rival[0]} hidden={!state.revealRival} />
            <PlayingCard card={state.rival[1]} hidden={!state.revealRival} />
          </div>
          {rivalCat && <span className="hand-tag">{rivalCat}</span>}
        </div>

        <div className="board-area">
          <p className="pot-label">
            {t.table.pot}: ${state.pot}
          </p>
          <div className="card-row board-row">
            {state.board.map((c, i) => (
              <PlayingCard key={`b-${i}`} card={c} />
            ))}
            {Array.from({ length: Math.max(0, 5 - state.board.length) }).map(
              (_, i) => (
                <div key={`e-${i}`} className="playing-card ghost" />
              ),
            )}
          </div>
        </div>

        <div className="seat hero-seat">
          <div className="card-row">
            <PlayingCard card={state.hero[0]} />
            <PlayingCard card={state.hero[1]} />
          </div>
          {heroCat && <span className="hand-tag">{heroCat}</span>}
          <div className="seat-meta">
            <span>{t.table.you}</span>
            <span>${state.heroStack}</span>
          </div>
        </div>
      </div>

      {outcomeText ? (
        <div className="trainer-actions">
          <p className="result-msg ok">{outcomeText}</p>
          <button type="button" className="btn btn-gold" onClick={newHand}>
            {t.table.newHand}
          </button>
        </div>
      ) : (
        <div className="action-bar">
          <button type="button" className="btn btn-ghost" onClick={onFold}>
            {t.table.fold}
          </button>
          <button type="button" className="btn btn-light" onClick={onCallOrCheck}>
            {state.toCall > 0 ? `${t.table.call} $${state.toCall}` : t.table.check}
          </button>
          <button
            type="button"
            className="btn btn-gold"
            onClick={onRaise}
            disabled={state.heroStack < RAISE}
          >
            {t.table.raise} ${RAISE}
          </button>
        </div>
      )}
    </div>
  );
}
