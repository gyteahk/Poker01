import type { Card } from "@/lib/poker";
import { RANK_LABEL, SUIT_SYMBOL } from "@/lib/poker";

export function PlayingCard({
  card,
  hidden = false,
  compact = false,
}: {
  card?: Card;
  hidden?: boolean;
  compact?: boolean;
}) {
  if (hidden || !card) {
    return (
      <div
        className={`playing-card back ${compact ? "compact" : ""}`}
        aria-label="Hidden card"
      />
    );
  }

  const red = card.suit === "h" || card.suit === "d";
  return (
    <div
      className={`playing-card ${red ? "red" : "black"} ${compact ? "compact" : ""}`}
      aria-label={`${RANK_LABEL[card.rank]}${SUIT_SYMBOL[card.suit]}`}
    >
      <span className="corner top">
        <b>{RANK_LABEL[card.rank]}</b>
        <i>{SUIT_SYMBOL[card.suit]}</i>
      </span>
      <span className="pip">{SUIT_SYMBOL[card.suit]}</span>
      <span className="corner bottom">
        <b>{RANK_LABEL[card.rank]}</b>
        <i>{SUIT_SYMBOL[card.suit]}</i>
      </span>
    </div>
  );
}
