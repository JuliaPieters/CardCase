import { CARDS } from '../../core/data';
import type { GameConfig } from '../config';
import { matchOnePiece } from './scan';
import { EMPTY, MASTER, PREF_OLDEST, PREF_OWNED, PREF_SET, SHARED_STEPS, prefValue } from '../recipes';

export const config: GameConfig = {
  game: 'one-piece',
  languages: [
    { code: 'EN', label: 'Engels' },
    { code: 'JA', label: 'Japans' },
  ],
  /** The six card colours, with their names as printed on English cards. */
  types: {
    red: ['Red', 'oklch(0.72 0.15 25)'],
    green: ['Green', 'oklch(0.78 0.13 150)'],
    blue: ['Blue', 'oklch(0.74 0.11 240)'],
    purple: ['Purple', 'oklch(0.70 0.13 310)'],
    black: ['Black', 'oklch(0.55 0.02 260)'],
    yellow: ['Yellow', 'oklch(0.88 0.14 95)'],
    none: ['Zonder kleur', 'oklch(0.90 0.02 90)'],
  },
  rarities: {
    Common: ['C', 'C', 'C'],
    Uncommon: ['UC', 'UC', 'U'],
    Rare: ['R', 'R', 'R'],
    'Super Rare': ['SR', 'SR', 'R'],
    'Secret Rare': ['SEC', 'SEC', 'HR'],
    Leader: ['L', 'L', 'R'],
    Special: ['SP', 'SP', 'HR'],
    'Treasure Rare': ['TR', 'TR', 'HR'],
    Promo: ['P', 'P', 'U'],
  },
  basicRarities: ['Common', 'Uncommon', 'Rare', 'Super Rare', 'Leader'],
  mainSet: (s) => s.kind === 'booster' || s.kind === 'extra' || s.kind === 'starter',
  recipeExample: 'alle Straw Hat Crew in rood, één per personage, liefst een parallel',
  exampleName: 'Luffy of Zoro',
  searchPlaceholder: 'Naam, kaartnummer of type, bv. Luffy of OP01-120',
  scan: {
    // The card id bottom right says which card; English and Japanese names are read with their own models.
    langs: [
      { key: 'EN', label: 'EN', ocr: ['eng'] },
      { key: 'JA', label: 'JA', ocr: ['jpn'] },
    ],
    strips: { name: [0.8, 0.1], number: [0.9, 0.08] },
    match: matchOnePiece,
  },
  noun: { one: 'personage', many: 'personages' },
  recipes: [
    MASTER,
    ['type', 'Per kleur', 'drop', 'Alles van één kleur, bijvoorbeeld rood of paars.', '#1F3A5F', '#F7EFD9'],
    ['single', 'Eén personage, alle versies', 'crown', 'Elke kaart en parallel van je favoriet naast elkaar.', '#D4A63A', '#3A2618'],
    ['fullart', 'Alleen parallels', 'star', 'Alle alternate-art-versies: de parallels en manga-kaarten.', '#3A2618', '#D4A63A'],
    EMPTY,
  ],
  recipeSteps: {
    ...SHARED_STEPS,
    type: ['ptype', 'langs', 'per', 'pref'],
    single: ['species', 'langs', 'order'],
    fullart: ['langs', 'order'],
  },
  stepTitles: { ptype: ['Kleur', 'Welke kleur?'], species: ['Personage', 'Welk personage?'] },
  prefs: [
    PREF_OWNED,
    ['fullart', 'Parallel', 'De alternate art; zonder parallel de gewone kaart.', 'palette'],
    PREF_OLDEST,
    prefValue('personage'),
    PREF_SET,
  ],
  filters: [
    { key: 'colour', label: 'Alle kleuren', first: true, options: () => Object.entries(config.types).filter(([k]) => k !== 'none').map(([k, v]) => [k, v[0]]), match: (c, v) => c.colours.includes(v) },
    { key: 'cardType', label: 'Alle kaartsoorten', first: true, options: () => Object.entries(CARD_TYPES), match: (c, v) => c.cardType === v },
    { key: 'cost', label: 'Alle kosten', options: () => Array.from({ length: 11 }, (_, i) => [String(i), 'Kosten ' + i] as [string, string]), match: (c, v) => c.cost === +v },
    { key: 'kind', label: 'Alle types', options: () => [...new Set(CARDS.flatMap((c) => c.subtypes || []))].sort().map((x) => [x, x]), match: (c, v) => (c.subtypes || []).includes(v) },
    { key: 'print', label: 'Alle prints', options: () => [['regular', 'Gewone print'], ['parallel', 'Parallel'], ['reprint', 'Herdruk']], match: (c, v) => (v === 'parallel' ? !!c.parallel : v === 'reprint' ? !!c.reprint : !c.parallel && !c.reprint) },
  ],
  cardNumber: (c) => c.numStr,
  cardFacts: (c) => {
    const colour = c.colours.map((i: string) => config.types[i]?.[0] || i).join(' / ');
    const out: { label: string; value: string; color?: string }[] = [
      { label: 'Kleur', value: colour, color: config.types[c.type]?.[1] },
      { label: 'Kaartsoort', value: c.typeName },
    ];
    if (c.life != null) out.push({ label: 'Leven', value: String(c.life) });
    if (c.cost != null) out.push({ label: 'Kosten', value: String(c.cost) });
    if (c.power != null) out.push({ label: 'Kracht', value: String(c.power) });
    if (c.counter != null) out.push({ label: 'Counter', value: '+' + c.counter });
    if (c.attributes?.length) out.push({ label: 'Attribuut', value: c.attributes.join(' / ') });
    if (c.subtypes?.length) out.push({ label: 'Type', value: c.subtypes.join(' · ') });
    if (c.parallel) out.push({ label: 'Print', value: 'Parallel (alternate art)' });
    else if (c.reprint) out.push({ label: 'Print', value: 'Herdruk' });
    if (c.block != null) out.push({ label: 'Blok', value: String(c.block) });
    return out;
  },
  cardText: (c, lang) => c.text?.[lang] || c.text?.EN || '',
  icons: {
    drop: ['...#....', '...#....', '..###...', '.#####..', '.##.##..', '#######.', '.#####..', '..###...'],
    crown: ['........', '#..#..#.', '##.#.##.', '#######.', '#######.', '.#####..', '.#####..', '........'],
  },
};

/** Card types, in Dutch. */
export const CARD_TYPES: Record<string, string> = { Leader: 'Leider', Character: 'Personage', Event: 'Event', Stage: 'Stage' };

/** Rarities as Punk Records spells them → as printed in the rarity list. */
export const RARITY_NAMES: Record<string, string> = { SuperRare: 'Super Rare', SecretRare: 'Secret Rare', TreasureRare: 'Treasure Rare' };
