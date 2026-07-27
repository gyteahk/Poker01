"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";
import { deal, RANK_LABEL, SUIT_SYMBOL, type Card } from "@/lib/poker";

type Tile = {
  id: number;
  card: Card;
  flipped: boolean;
  matched: boolean;
};

function buildTiles(): Tile[] {
  const cards = deal(8);
  const pairs = cards.flatMap((card, i) => [
    { id: i * 2, card, flipped: false, matched: false },
    { id: i * 2 + 1, card, flipped: false, matched: false },
  ]);
  for (let i = pairs.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  return pairs;
}

export function MemoryGame() {
  const { t } = useI18n();
  const [tiles, setTiles] = useState<Tile[]>(() => buildTiles());
  const [open, setOpen] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [lock, setLock] = useState(false);

  const pairs = tiles.filter((x) => x.matched).length / 2;
  const won = pairs === 8;

  function flip(index: number) {
    if (lock || tiles[index].flipped || tiles[index].matched || open.length >= 2) {
      return;
    }

    const nextTiles = tiles.map((tile, i) =>
      i === index ? { ...tile, flipped: true } : tile,
    );
    const nextOpen = [...open, index];
    setTiles(nextTiles);
    setOpen(nextOpen);

    if (nextOpen.length < 2) return;

    setMoves((m) => m + 1);
    setLock(true);
    const [a, b] = nextOpen;
    const matched = nextTiles[a].card.rank === nextTiles[b].card.rank;

    window.setTimeout(() => {
      setTiles((prev) =>
        prev.map((tile, i) => {
          if (i !== a && i !== b) return tile;
          if (matched) return { ...tile, matched: true, flipped: true };
          return { ...tile, flipped: false };
        }),
      );
      setOpen([]);
      setLock(false);
    }, 550);
  }

  function reset() {
    setTiles(buildTiles());
    setOpen([]);
    setMoves(0);
    setLock(false);
  }

  return (
    <div className="game-panel">
      <div className="game-top">
        <Link href="/play" className="text-link">
          ← {t.memory.back}
        </Link>
        <p className="score-pill">
          {t.memory.moves}: {moves} · {t.memory.pairs}: {pairs}/8
        </p>
      </div>
      <h1 className="page-title">{t.memory.title}</h1>

      <div className="memory-grid">
        {tiles.map((tile, index) => {
          const show = tile.flipped || tile.matched;
          const red = tile.card.suit === "h" || tile.card.suit === "d";
          return (
            <button
              key={`${tile.id}-${index}`}
              type="button"
              className={`memory-tile ${show ? "flipped" : ""} ${
                tile.matched ? "matched" : ""
              } ${show && red ? "red" : ""}`}
              onClick={() => flip(index)}
              disabled={lock || tile.matched}
            >
              {show
                ? `${RANK_LABEL[tile.card.rank]}${SUIT_SYMBOL[tile.card.suit]}`
                : "✦"}
            </button>
          );
        })}
      </div>

      {(won || moves > 0) && (
        <div className="trainer-actions">
          {won && <p className="result-msg ok">{t.memory.win}</p>}
          <button type="button" className="btn btn-gold" onClick={reset}>
            {t.memory.reset}
          </button>
        </div>
      )}
    </div>
  );
}
