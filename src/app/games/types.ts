/**
 * What every department (one trading card game) provides. Shared code only talks to a game through these: it never
 * asks which game is active.
 */

export type Game = 'pokemon' | 'lorcana' | 'magic' | 'one-piece';

/** A card's id across all games: "<game>:<set>-<number>", e.g. "pokemon:sv08-250". Opaque: never split it. */
export type CardKey = string;

/** Cardmarket-style price of one card: [fetchedAt, trend, low, avg1, avg7, avg30], in EUR. */
export type PriceEntry = [number, number | null, number | null, number | null, number | null, number | null];

/** A catalog as the app works with it (see setCatalog in core/data.ts). */
export interface LoadedCatalog {
  sets: any[];
  cards: any[];
  /** Changes with every new build of the catalog; the scanner's image index must match it. */
  version: string;
}

/** Where a game's cards and prices come from. */
export interface CardSource {
  readonly game: Game;
  /** The whole catalog: the app searches, filters and builds binders locally, and works offline. */
  loadCatalog(): Promise<LoadedCatalog>;
  /** Prices for these cards (from the loaded catalog), by card key; cards without a price are left out. */
  getPrices(cards: any[]): Promise<Record<CardKey, PriceEntry>>;
}

/** Static facts about a department: enough for the switcher, onboarding and overview, without loading the game. */
export interface GameInfo {
  game: Game;
  name: string;
  /** Shown in the switcher and onboarding: what the department feels like. */
  tagline: string;
  /** Ready to use; a department under construction stays out of onboarding and the switcher. */
  enabled: boolean;
  logos: { mascot: string; favicon: string; favicon32: string; appleTouch: string };
}
