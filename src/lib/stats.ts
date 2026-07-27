/** Client-only localStorage helpers for game streaks / high scores. */

function readNumber(key: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(key);
    const n = raw ? Number.parseInt(raw, 10) : 0;
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

function writeNumber(key: string, value: number) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, String(Math.max(0, Math.floor(value))));
  } catch {
    /* ignore quota / private mode */
  }
}

export function getHighScore(game: string): number {
  return readNumber(`poker01-hs-${game}`);
}

/** Returns the new high score (may equal previous). */
export function setHighScore(game: string, score: number): number {
  const prev = getHighScore(game);
  const next = Math.max(prev, score);
  if (next > prev) writeNumber(`poker01-hs-${game}`, next);
  return next;
}

export function getStreak(game: string): number {
  return readNumber(`poker01-streak-${game}`);
}

/** Update streak after a correct/incorrect answer. Returns new streak. */
export function recordStreak(game: string, correct: boolean): number {
  const next = correct ? getStreak(game) + 1 : 0;
  writeNumber(`poker01-streak-${game}`, next);
  if (correct) {
    const best = readNumber(`poker01-best-streak-${game}`);
    if (next > best) writeNumber(`poker01-best-streak-${game}`, next);
  }
  return next;
}

export function getBestStreak(game: string): number {
  return readNumber(`poker01-best-streak-${game}`);
}

/** Daily decision: consecutive days with a vote (UTC date keys). */
export function recordDailyPlay(): { streak: number; best: number } {
  if (typeof window === "undefined") return { streak: 0, best: 0 };
  const today = new Date().toISOString().slice(0, 10);
  const last = window.localStorage.getItem("poker01-daily-last") || "";
  let streak = getStreak("daily");
  if (last === today) {
    return { streak, best: getBestStreak("daily") };
  }
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  streak = last === yesterday ? streak + 1 : 1;
  writeNumber(`poker01-streak-daily`, streak);
  const best = Math.max(getBestStreak("daily"), streak);
  writeNumber(`poker01-best-streak-daily`, best);
  try {
    window.localStorage.setItem("poker01-daily-last", today);
  } catch {
    /* ignore */
  }
  return { streak, best };
}
