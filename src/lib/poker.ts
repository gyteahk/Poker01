export type Suit = "s" | "h" | "d" | "c";
export type Rank =
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "T"
  | "J"
  | "Q"
  | "K"
  | "A";

export type Card = { rank: Rank; suit: Suit };

const RANKS: Rank[] = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "T",
  "J",
  "Q",
  "K",
  "A",
];
const SUITS: Suit[] = ["s", "h", "d", "c"];

export const RANK_VALUE: Record<Rank, number> = {
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  T: 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

export const SUIT_SYMBOL: Record<Suit, string> = {
  s: "♠",
  h: "♥",
  d: "♦",
  c: "♣",
};

export const RANK_LABEL: Record<Rank, string> = {
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
  "8": "8",
  "9": "9",
  T: "10",
  J: "J",
  Q: "Q",
  K: "K",
  A: "A",
};

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function deal(count: number): Card[] {
  return shuffle(createDeck()).slice(0, count);
}

/** Rank category 8=straight flush … 0=high card, plus tiebreakers */
export type HandScore = number[];

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  const withFirst = combinations(rest, k - 1).map((c) => [first, ...c]);
  const without = combinations(rest, k);
  return [...withFirst, ...without];
}

function evaluateFive(cards: Card[]): HandScore {
  const values = cards.map((c) => RANK_VALUE[c.rank]).sort((a, b) => b - a);
  const suits = cards.map((c) => c.suit);
  const flush = suits.every((s) => s === suits[0]);

  const unique = [...new Set(values)];
  let straightHigh = 0;
  if (unique.length === 5) {
    if (unique[0] - unique[4] === 4) straightHigh = unique[0];
    // wheel A-5
    if (unique.join(",") === "14,5,4,3,2") straightHigh = 5;
  }

  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  const byCount = [...counts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return b[0] - a[0];
  });

  if (flush && straightHigh) return [8, straightHigh];
  if (byCount[0][1] === 4) return [7, byCount[0][0], byCount[1][0]];
  if (byCount[0][1] === 3 && byCount[1][1] === 2)
    return [6, byCount[0][0], byCount[1][0]];
  if (flush) return [5, ...values];
  if (straightHigh) return [4, straightHigh];
  if (byCount[0][1] === 3)
    return [3, byCount[0][0], ...byCount.slice(1).map((x) => x[0])];
  if (byCount[0][1] === 2 && byCount[1][1] === 2)
    return [
      2,
      Math.max(byCount[0][0], byCount[1][0]),
      Math.min(byCount[0][0], byCount[1][0]),
      byCount[2][0],
    ];
  if (byCount[0][1] === 2)
    return [1, byCount[0][0], ...byCount.slice(1).map((x) => x[0])];
  return [0, ...values];
}

export function bestHand(cards: Card[]): HandScore {
  if (cards.length < 5) {
    const padded = [...cards];
    while (padded.length < 5) padded.push({ rank: "2", suit: "c" });
    return evaluateFive(padded.slice(0, 5));
  }
  if (cards.length === 5) return evaluateFive(cards);
  let best: HandScore = [0];
  for (const five of combinations(cards, 5)) {
    const score = evaluateFive(five);
    if (compareScores(score, best) > 0) best = score;
  }
  return best;
}

export function compareScores(a: HandScore, b: HandScore): number {
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i += 1) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    if (av !== bv) return av > bv ? 1 : -1;
  }
  return 0;
}

export const CATEGORY_NAME = {
  zh: [
    "高牌",
    "一對",
    "兩對",
    "三條",
    "順子",
    "同花",
    "葫蘆",
    "四條",
    "同花順",
  ],
  en: [
    "High Card",
    "One Pair",
    "Two Pair",
    "Three of a Kind",
    "Straight",
    "Flush",
    "Full House",
    "Four of a Kind",
    "Straight Flush",
  ],
} as const;

export function categoryLabel(score: HandScore, locale: "zh" | "en"): string {
  return CATEGORY_NAME[locale][score[0] ?? 0];
}

export function cardCode(card: Card): string {
  return `${card.rank}${card.suit}`;
}

export function parseCard(code: string): Card {
  const rank = code.slice(0, -1) as Rank;
  const suit = code.slice(-1) as Suit;
  return { rank, suit };
}

export function cardKey(card: Card): string {
  return cardCode(card);
}
