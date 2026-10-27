import type { Game } from './types';

/**
 * A department's settings: what shared screens read instead of knowing which game is active.
 * Filled in step by step as screens move over to it (see docs/implementatieplan.md, stap 2d).
 */
export interface GameConfig {
  game: Game;
  /** Languages cards are printed in, in the order they are shown; counts in the collection are kept per language. */
  languages: { code: string; label: string }[];
  /** The colour category cards are grouped and coloured by (Pokémon: type, Lorcana: ink): key → [label, oklch colour]. */
  types: Record<string, [string, string]>;
  /** Rarity as the source names it → [abbreviation, abbreviation in Asian editions, basic tier C/U/R/HR]. */
  rarities: Record<string, [string, string, string]>;
  /** Rarities that are plain tiers; the others are shown as a badge on the card. */
  basicRarities: string[];
  /**
   * Set lists grouped by edition, when a department's sets differ per language (Pokémon: international, Japanese,
   * Chinese): [set language, label, placeholder, card languages it holds]. Without it all sets are one list.
   */
  setGroups?: [string, string, string, string[]][];
  /** What a recipe lists one card of ("één per Pokémon", "één per personage"). */
  noun: { one: string; many: string };
  /**
   * Binder recipes, as tiles: [key, label, pixel icon, description, colour, text colour]. Keys shared code knows:
   * dex, type (by `types`), master, single (one species / character, all versions), illus, story, fullart, empty.
   */
  recipes: [string, string, string, string, string, string][];
  /** The questions each recipe asks, in order (region, ptype, set, species, illus, story, langs, per, pref, order, pages). */
  recipeSteps: Record<string, string[]>;
  /** Titles of questions that differ from the shared ones: step → [short label, question]. */
  stepTitles?: Record<string, [string, string]>;
  /** Which version a recipe picks when it lists one card each: [key, label, description, icon]. */
  prefs: [string, string, string, string][];
  /** Example for the "describe your binder" field of the recipe screen. */
  recipeExample?: string;
  /** Extra 8×8 pixel icons for the recipe tiles (rows of '#' and '.'). */
  icons?: Record<string, string[]>;
}
