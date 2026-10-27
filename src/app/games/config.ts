import type { Game } from './types';

/**
 * A department's settings: what shared screens read instead of knowing which game is active.
 * Filled in step by step as screens move over to it (see docs/implementatieplan.md, stap 2d).
 */
export interface GameConfig {
  game: Game;
  /** Languages cards are printed in, in the order they are shown; counts in the collection are kept per language. */
  languages: { code: string; label: string }[];
}
