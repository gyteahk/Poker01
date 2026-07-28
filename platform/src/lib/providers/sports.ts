/**
 * Sportsbook adapter — football first (MVP stub).
 * Real provider would sync events/odds and settle via callback.
 */

export type FootballOdds = {
  home: number;
  draw: number;
  away: number;
};

export function parseOdds(oddsJson: string): FootballOdds {
  const o = JSON.parse(oddsJson) as FootballOdds;
  if (!o.home || !o.draw || !o.away) throw new Error("Invalid odds");
  return o;
}

export function selectionOdds(odds: FootballOdds, selection: "home" | "draw" | "away"): number {
  return odds[selection];
}
