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
  /** Placeholder of the search field. */
  searchPlaceholder?: string;
  /** A card name to show as an example in search fields. */
  exampleName?: string;
  /** Example for the "describe your binder" field of the recipe screen. */
  recipeExample?: string;
  /**
   * Extra search filters, each a select: its options as [value, label] (from the loaded catalog), and whether a card
   * matches a chosen value.
   */
  filters?: { key: string; label: string; /** Before rarity and set (the department's main ones). */ first?: boolean; options: () => [string, string][]; match: (card: any, value: string) => boolean }[];
  /**
   * The card scanner: the language choices (one hides the picker) with the OCR models for the name, where name and
   * number are printed, and how the text read becomes cards.
   */
  scan: {
    langs: { key: string; label: string; ocr: string[] }[];
    strips: import('../core/scanner').CardStrips;
    match: (text: string, opts: { numText?: string; lang?: string; limit?: number; prefer?: Set<number>; expect?: number | null }) => import('../core/text').CardMatch[];
  };
  /** Decks to play with (departments where people build them): the rules, analysis and generator. */
  decks?: import('../core/decks').DeckRules;
  /** The card also exists as a foil with its own price, so the collection asks regular or foil. */
  hasFoil?: (card: any) => boolean;
  /** The number as shown on a card tile (default: set and number). */
  cardNumber?: (card: any) => string;
  /** Game facts shown on the card page (cost, lore…), in the card's language. */
  cardFacts?: (card: any, lang: string) => { label: string; value: string; color?: string }[];
  /** Rules text of the card, in its language. */
  cardText?: (card: any, lang: string) => string;
  /**
   * Decoration material of its own: backgrounds ({ id, name, fill: CSS background }), pixel stickers ([icon, colour]) and
   * text stickers ([text, background, colour]). Without it the shared Cardcase set is used.
   */
  deco?: { backgrounds: { id: string; name: string; fill: string }[]; stickers: [string, string][]; texts: [string, string, string][] };
  /** Extra 8×8 pixel icons for the recipe tiles (rows of '#' and '.'). */
  icons?: Record<string, string[]>;
}
