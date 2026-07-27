import {
  bestHand,
  categoryLabel,
  compareScores,
  createDeck,
  parseCard,
  cardCode,
  type Card,
} from "@/lib/poker";

export type Street = "preflop" | "flop" | "turn" | "river";
export type DecisionAction = "fold" | "call" | "raise";

export type ScenarioPublic = {
  windowId: number;
  expiresAt: number;
  numPlayers: number;
  street: Street;
  hero: string[];
  board: string[];
  pot: number;
  toCall: number;
  heroStack: number;
  villainStack: number;
};

export type ScenarioSecret = ScenarioPublic & {
  finalBoard: string[];
  opponents: string[][];
};

const STREET_BOARD: Record<Street, number> = {
  preflop: 0,
  flop: 3,
  turn: 4,
  river: 5,
};

const WINDOW_MS = 60 * 60 * 1000; // 1 hour per shared round

export function decisionWindowMs(): number {
  return WINDOW_MS;
}

export function currentWindowId(now = Date.now()): number {
  return Math.floor(now / WINDOW_MS);
}

export function windowExpiresAt(windowId: number): number {
  return (windowId + 1) * WINDOW_MS;
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, items: T[]): T {
  return items[Math.floor(rng() * items.length)]!;
}

function shuffleDeck(rng: () => number): Card[] {
  const deck = createDeck();
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function draw(deck: Card[], n: number): Card[] {
  return deck.splice(0, n);
}

export function buildSeededScenario(windowId: number): ScenarioSecret {
  const rng = mulberry32(windowId * 9973 + 42);
  const numPlayers = 2 + Math.floor(rng() * 3); // 2-4
  const street = pick(rng, [
    "preflop",
    "preflop",
    "flop",
    "flop",
    "turn",
    "river",
  ] as Street[]);

  const deck = shuffleDeck(rng);
  const hero = draw(deck, 2);
  const opponents = Array.from({ length: numPlayers - 1 }, () => draw(deck, 2));
  const finalBoard = draw(deck, 5);
  const board = finalBoard.slice(0, STREET_BOARD[street]);

  const pot = pick(rng, [40, 60, 100, 150, 220, 300, 500]);
  const toCall = Math.round(
    pot * pick(rng, [0.33, 0.5, 0.75, 1.0, 1.25]),
  );
  const heroStack = pick(rng, [300, 500, 800, 1200]);
  const villainStack = pick(rng, [300, 500, 800, 1200]);

  return {
    windowId,
    expiresAt: windowExpiresAt(windowId),
    numPlayers,
    street,
    hero: hero.map(cardCode),
    board: board.map(cardCode),
    pot,
    toCall,
    heroStack,
    villainStack,
    finalBoard: finalBoard.map(cardCode),
    opponents: opponents.map((hand) => hand.map(cardCode)),
  };
}

export function toPublic(scenario: ScenarioSecret): ScenarioPublic {
  const {
    windowId,
    expiresAt,
    numPlayers,
    street,
    hero,
    board,
    pot,
    toCall,
    heroStack,
    villainStack,
  } = scenario;
  return {
    windowId,
    expiresAt,
    numPlayers,
    street,
    hero,
    board,
    pot,
    toCall,
    heroStack,
    villainStack,
  };
}

function remainingCards(known: Card[]): Card[] {
  const keys = new Set(known.map(cardCode));
  return createDeck().filter((c) => !keys.has(cardCode(c)));
}

/** Monte Carlo equity vs random remaining opponent hands + runouts */
export function estimateEquity(
  scenario: ScenarioSecret,
  trials = 900,
): number {
  const hero = scenario.hero.map(parseCard);
  const board = scenario.board.map(parseCard);
  const nOpp = scenario.numPlayers - 1;
  const needBoard = 5 - board.length;
  let wins = 0;

  for (let t = 0; t < trials; t += 1) {
    const pool = remainingCards([...hero, ...board]);
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const oppHands: Card[][] = [];
    let cursor = 0;
    for (let o = 0; o < nOpp; o += 1) {
      oppHands.push([pool[cursor], pool[cursor + 1]]);
      cursor += 2;
    }
    const fullBoard = [...board, ...pool.slice(cursor, cursor + needBoard)];

    const heroScore = bestHand([...hero, ...fullBoard]);
    const oppScores = oppHands.map((oh) => bestHand([...oh, ...fullBoard]));
    let best = oppScores[0]!;
    for (const s of oppScores.slice(1)) {
      if (compareScores(s, best) > 0) best = s;
    }
    const cmp = compareScores(heroScore, best);
    if (cmp > 0) wins += 1;
    else if (cmp === 0) {
      const ties = oppScores.filter((s) => compareScores(s, heroScore) === 0)
        .length;
      wins += 1 / (1 + ties);
    }
  }

  return wins / trials;
}

export function requiredEquity(pot: number, toCall: number): number {
  return toCall / (pot + toCall);
}

export function correctDecision(scenario: ScenarioSecret, trials = 900) {
  const eq = estimateEquity(scenario, trials);
  const req = requiredEquity(scenario.pot, scenario.toCall);
  const margin = eq - req;

  let action: DecisionAction = "call";
  if (margin < -0.03) action = "fold";
  else if (margin > 0.15) action = "raise";

  return {
    equity: Math.round(eq * 1000) / 10,
    requiredEquity: Math.round(req * 1000) / 10,
    margin: Math.round(margin * 1000) / 10,
    action,
  };
}

export function actualOutcome(scenario: ScenarioSecret, locale: "zh" | "en") {
  const hero = scenario.hero.map(parseCard);
  const board = scenario.finalBoard.map(parseCard);
  const heroScore = bestHand([...hero, ...board]);
  const oppScores = scenario.opponents.map((oh) =>
    bestHand([...oh.map(parseCard), ...board]),
  );

  let best = oppScores[0]!;
  for (const s of oppScores.slice(1)) {
    if (compareScores(s, best) > 0) best = s;
  }
  const cmp = compareScores(heroScore, best);
  const result = cmp > 0 ? "win" : cmp < 0 ? "lose" : "tie";

  return {
    result: result as "win" | "lose" | "tie",
    heroClass: categoryLabel(heroScore, locale),
    villainClass: categoryLabel(best, locale),
    finalBoard: scenario.finalBoard,
    opponents: scenario.opponents,
  };
}

export function buildPracticeHand() {
  const rng = mulberry32(Date.now() ^ (Math.random() * 1e9));
  const deck = shuffleDeck(rng);
  const hero = draw(deck, 2);
  const villain = draw(deck, 2);
  const finalBoard = draw(deck, 5);
  let pot = pick(rng, [20, 30, 40, 60]);
  let toCall = Math.round(pot * pick(rng, [0.33, 0.5, 0.75, 1]));

  return {
    hero: hero.map(cardCode),
    villain: villain.map(cardCode),
    finalBoard: finalBoard.map(cardCode),
    streets: (["preflop", "flop", "turn", "river"] as Street[]).map(
      (street) => {
        const board = finalBoard.slice(0, STREET_BOARD[street]).map(cardCode);
        const snap: ScenarioSecret = {
          windowId: 0,
          expiresAt: 0,
          numPlayers: 2,
          street,
          hero: hero.map(cardCode),
          board,
          pot,
          toCall,
          heroStack: 800,
          villainStack: 800,
          finalBoard: finalBoard.map(cardCode),
          opponents: [villain.map(cardCode)],
        };
        const decision = correctDecision(snap, 500);
        const step = { street, board, pot, toCall, decision };
        pot += 2 * toCall;
        toCall = Math.round(pot * pick(rng, [0.33, 0.5, 0.75, 1]));
        return step;
      },
    ),
  };
}
