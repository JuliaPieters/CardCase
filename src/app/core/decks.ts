import { CARDS, LANGS, tot } from './data';
import { norm } from './text';

/**
 * Decks to play with, in departments where people build them (Lorcana): which cards and how many. The rules, the
 * analysis and the generator are the department's (GameConfig.decks); this file has what every deck needs.
 */

/** A deck in the state: cards by catalog index → copies. */
export interface Deck {
  id: string;
  name: string;
  cards: Record<number, number>;
  created: number;
  /** How it was made: by hand, imported from a list, or generated (with the options). */
  origin?: string;
  /** The format it is built for, in departments with several (Magic: standard, commander…). */
  format?: string;
  /** The commander (catalog index), in a format that has one. */
  commander?: number | null;
  /** A second commander, when the two can team up (Magic: Partner, Background…). */
  partner?: number | null;
  /** Sideboard: cards by catalog index → copies (formats that have one). */
  side?: Record<number, number>;
}

export interface DeckLine {
  card: any;
  n: number;
}

export interface DeckAnalysis {
  /** "Aggro", "Midrange", … */
  playstyle: string;
  /** A sentence or two on why, and how the deck plays. */
  explanation: string;
  /** Short facts: inks, average cost, inkable share, … */
  facts: { label: string; value: string }[];
  /** Copies per cost 1…7+ (index 0 = cost 1). */
  curve: number[];
}

export interface GenerateOptions {
  /** Colour categories to build with (Lorcana: one or two inks). */
  types: string[];
  /** Only cards you have, at most as many copies as you have. */
  ownedOnly: boolean;
  /** Only cards allowed in the current (rotating) format. */
  currentFormat: boolean;
  /** The format to build for (departments with several). */
  format?: string;
  style: string;
  /** Copies you own of a card (any printing of it counts). */
  owned: (card: any) => number;
}

export interface DeckRules {
  /** Smallest legal deck. */
  size: number;
  maxCopies: number;
  /** Formats to choose from ([key, label]); without them the department has one set of rules. */
  formats?: [string, string][];
  /** Deck size in a format (Commander: 100). */
  sizeFor?(format?: string): number;
  /** The format has a commander. */
  hasCommander?(format?: string): boolean;
  /** Whether a card can lead the deck as its commander. */
  canCommand?(card: any): boolean;
  /** Whether a card can be the second commander next to `commander`. */
  canPartner?(commander: any, card: any): boolean;
  /** What the cost under the curve is called ("kosten in inkt", "mana value"). */
  curveLabel: string;
  /** Most sideboard cards in a format (0: none). */
  sideboardFor?(format?: string): number;
  /** The name copies are counted by (all printings of a card share it). */
  nameOf(card: any): string;
  /** What makes the deck not legal yet, as sentences; empty when it is. */
  problems(lines: DeckLine[], deck?: Deck): string[];
  analyze(lines: DeckLine[], deck?: Deck): DeckAnalysis;
  /** Play styles the generator can aim for: [key, label]. */
  styles: [string, string][];
  /** How many colour categories a deck can have (Lorcana: 2). */
  maxTypes: number;
  /** A deck for the options; with a commander when the format has one. */
  generate(opts: GenerateOptions): DeckLine[] & { commander?: any };
}

export const linesOf = (deck: Deck, side = false): DeckLine[] =>
  Object.entries((side ? deck.side : deck.cards) || {})
    .map(([id, n]) => ({ card: CARDS[+id], n }))
    .filter((l) => l.card && l.n > 0)
    .sort((a, b) => (a.card.cost ?? 0) - (b.card.cost ?? 0) || a.card.names.EN.localeCompare(b.card.names.EN));

export const deckSize = (deck: Deck) => Object.values(deck.cards).reduce((a, n) => a + n, 0);

/** Copies owned of every printing with this name (e.g. the regular and the Enchanted Elsa). */
export function ownedByName(nameOf: (c: any) => string, owned: Record<number, Record<string, number>>) {
  const byName = new Map<string, number>();
  CARDS.forEach((c, i) => {
    const n = tot(owned[i]);
    if (n) byName.set(nameOf(c), (byName.get(nameOf(c)) || 0) + n);
  });
  return (c: any) => byName.get(nameOf(c)) || 0;
}

/** What you have of a deck and what is still missing, with the cost of the missing copies at the cheapest printing. */
export function deckNeeds(lines: DeckLine[], nameOf: (c: any) => string, owned: Record<number, Record<string, number>>) {
  const have = ownedByName(nameOf, owned);
  const cheapest = new Map<string, number>();
  for (const c of CARDS) if (c.trend != null) cheapest.set(nameOf(c), Math.min(cheapest.get(nameOf(c)) ?? Infinity, c.trend));
  // Copies of one name in several lines (two printings) share what you own.
  const left = new Map<string, number>();
  const missing: (DeckLine & { price: number | null })[] = [];
  let haveN = 0;
  let cost = 0;
  for (const l of lines) {
    const name = nameOf(l.card);
    const avail = left.has(name) ? left.get(name)! : have(l.card);
    const got = Math.min(avail, l.n);
    left.set(name, avail - got);
    haveN += got;
    if (got < l.n) {
      const p = cheapest.get(name) ?? l.card.trend ?? null;
      missing.push({ card: l.card, n: l.n - got, price: p });
      cost += (p || 0) * (l.n - got);
    }
  }
  return { have: haveN, missing, cost };
}

/**
 * A pasted deck list ("4 Ariel - On Human Legs", "2x Be Prepared", one card per line, as Dreamborn, Inkdecks and the
 * like export it) as deck lines. Of several printings it takes one you own, else the regular one.
 */
export function parseDeckList(text: string, owned: Record<number, Record<string, number>>): { lines: DeckLine[]; unknown: string[] } {
  const byName = new Map<string, any[]>();
  for (const c of CARDS) {
    for (const l of LANGS) {
      if (!c.avail.includes(l)) continue;
      const k = norm(c.names[l]);
      const list = byName.get(k) || [];
      if (!list.includes(c)) byName.set(k, [...list, c]);
    }
  }
  const pick = (cs: any[]) =>
    cs.find((c) => tot(owned[c.id]) > 0) || cs.find((c) => c.variant === 'regular') || cs.slice().sort((a, b) => (a.trend ?? Infinity) - (b.trend ?? Infinity))[0];
  const lines = new Map<any, number>();
  const unknown: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || /^(\/\/|#)/.test(line)) continue;
    const m = /^(\d+)\s*x?\s+(.+)$/i.exec(line);
    const n = m ? +m[1] : 1;
    const name = norm((m ? m[2] : line).replace(/\s+[-–—]\s+/g, ' '));
    const cs = byName.get(name);
    if (!cs) {
      unknown.push(line);
      continue;
    }
    const c = pick(cs);
    lines.set(c, (lines.get(c) || 0) + n);
  }
  return { lines: [...lines].map(([card, n]) => ({ card, n })), unknown };
}

/** The deck as a list to paste elsewhere: "4 Ariel - On Human Legs". */
export const deckText = (lines: DeckLine[]) => lines.map((l) => `${l.n} ${l.card.names.EN.replace(' – ', ' - ')}`).join('\n');
