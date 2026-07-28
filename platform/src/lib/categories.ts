/** Bump when regenerating images so browsers fetch fresh files */
const V = "16";

export const CATEGORY_IMAGES = {
  sports: `/categories/sports.png?v=${V}`,
  football: `/categories/football.png?v=${V}`,
  games: `/categories/games.png?v=${V}`,
  slots: `/categories/slots.png?v=${V}`,
  live: `/categories/live.png?v=${V}`,
  fishing: `/categories/fishing.png?v=${V}`,
  cards: `/categories/cards.png?v=${V}`,
  poker: `/categories/poker.png?v=${V}`,
  wallet: `/categories/wallet.png?v=${V}`,
} as const;

export const CATEGORY_WIDE = {
  football: `/categories/football-wide.png?v=${V}`,
  poker: `/categories/poker-wide.png?v=${V}`,
  games: `/categories/games-wide.png?v=${V}`,
  wallet: `/categories/wallet-wide.png?v=${V}`,
  sports: `/categories/sports-wide.png?v=${V}`,
} as const;

export function gameCategoryImage(cat: string) {
  if (cat in CATEGORY_IMAGES) {
    return CATEGORY_IMAGES[cat as keyof typeof CATEGORY_IMAGES];
  }
  return CATEGORY_IMAGES.games;
}
