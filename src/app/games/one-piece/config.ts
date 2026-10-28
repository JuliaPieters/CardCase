import { CARDS } from '../../core/data';
import type { GameConfig } from '../config';
import { rules as deckRules } from './decks';
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
  decks: deckRules,
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
  deco: {
    // Fills are background images shown with `cover`: no tiling sizes, patterns are small SVGs.
    backgrounds: [
      { id: 'parchment', name: 'Perkament', fill: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'300\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'.8\' numOctaves=\'3\'/%3E%3CfeColorMatrix values=\'0 0 0 0 .23 0 0 0 0 .15 0 0 0 0 .09 0 0 0 .14 0\'/%3E%3C/filter%3E%3Crect width=\'300\' height=\'300\' filter=\'url(%23n)\'/%3E%3C/svg%3E"),radial-gradient(120% 90% at 50% 50%,#F7EFD9 55%,#E4D4AD)' },
      { id: 'chart', name: 'Zeekaart', fill: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\' preserveAspectRatio=\'xMidYMid slice\'%3E%3Cg fill=\'none\' stroke=\'%231F3A5F\' stroke-opacity=\'.35\' stroke-width=\'.3\'%3E%3Cpath d=\'M0 25H100M0 50H100M0 75H100M25 0V100M50 0V100M75 0V100\'/%3E%3Ccircle cx=\'72\' cy=\'28\' r=\'12\'/%3E%3Cpath d=\'M72 12V44M56 28H88M61 17L83 39M83 17L61 39\'/%3E%3C/g%3E%3Cpath d=\'M10 80C25 70 35 88 52 74S80 70 92 58\' fill=\'none\' stroke=\'%23B8322A\' stroke-width=\'.8\' stroke-dasharray=\'2 2\'/%3E%3Cpath d=\'M89 55L94 60M94 55L89 60\' stroke=\'%23B8322A\' stroke-width=\'1\'/%3E%3C/svg%3E"),linear-gradient(#F3E7C9,#F3E7C9)' },
      { id: 'sea', name: 'Open zee', fill: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\' preserveAspectRatio=\'none\'%3E%3Cg fill=\'none\' stroke=\'%23F7EFD9\' stroke-opacity=\'.25\' stroke-width=\'.6\'%3E%3Cpath d=\'M0 20Q6 16 12 20T24 20T36 20T48 20T60 20T72 20T84 20T96 20T108 20\'/%3E%3Cpath d=\'M-6 45Q0 41 6 45T18 45T30 45T42 45T54 45T66 45T78 45T90 45T102 45\'/%3E%3Cpath d=\'M0 70Q6 66 12 70T24 70T36 70T48 70T60 70T72 70T84 70T96 70T108 70\'/%3E%3Cpath d=\'M-6 92Q0 88 6 92T18 92T30 92T42 92T54 92T66 92T78 92T90 92T102 92\'/%3E%3C/g%3E%3C/svg%3E"),linear-gradient(180deg,#2A5A8A,#142A47)' },
      { id: 'wanted', name: 'Wanted-poster', fill: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\' preserveAspectRatio=\'none\'%3E%3Crect x=\'3\' y=\'3\' width=\'94\' height=\'94\' fill=\'none\' stroke=\'%233A2618\' stroke-width=\'3\' vector-effect=\'non-scaling-stroke\'/%3E%3Crect x=\'6\' y=\'6\' width=\'88\' height=\'88\' fill=\'none\' stroke=\'%233A2618\' stroke-width=\'1\' vector-effect=\'non-scaling-stroke\'/%3E%3C/svg%3E"),radial-gradient(130% 100% at 50% 40%,#EFDDB0 50%,#C9A66B)' },
      { id: 'deck', name: 'Scheepsdek', fill: 'repeating-linear-gradient(90deg,rgba(58,38,24,.35) 0 2px,transparent 2px 44px),repeating-linear-gradient(0deg,rgba(58,38,24,.12) 0 1px,transparent 1px 9px),linear-gradient(#9A6B3F,#7E5530)' },
      { id: 'navy', name: 'Marineblauw', fill: 'linear-gradient(160deg,#1F3A5F,#142A47)' },
    ],
    stickers: [['skull', '#3A2618'], ['anchor', '#1F3A5F'], ['hat', '#D4A63A'], ['coin', '#D4A63A'], ['compass', '#B8322A'], ['star', '#D4A63A']],
    texts: [
      ['WANTED', '#EFDDB0', '#3A2618'],
      ['DEAD OR ALIVE', '#3A2618', '#EFDDB0'],
      ['PARALLEL ✦', 'linear-gradient(115deg,#ffb3d9,#ffe9a3,#b8f5d0,#a9dcff)', '#1F3A5F'],
      ['NIEUW!', '#D4A63A', '#3A2618'],
      ['฿ 3.000.000.000', '#F7EFD9', '#B8322A'],
      ['LEIDER', '#1F3A5F', '#F7EFD9'],
    ],
  },
  icons: {
    drop: ['...#....', '...#....', '..###...', '.#####..', '.##.##..', '#######.', '.#####..', '..###...'],
    crown: ['........', '#..#..#.', '##.#.##.', '#######.', '#######.', '.#####..', '.#####..', '........'],
    skull: ['.#####..', '#######.', '#..#..#.', '#######.', '.##.##..', '..###...', '#.#.#.#.', '.#...#..'],
    anchor: ['...#....', '..#.#...', '...#....', '#######.', '...#....', '#..#..#.', '.#.#.#..', '..###...'],
    hat: ['........', '..####..', '.######.', '.######.', '.#....#.', '########', '########', '........'],
    coin: ['..###...', '.#####..', '##.#.##.', '##.#.##.', '##.#.##.', '##.#.##.', '.#####..', '..###...'],
    compass: ['...#....', '...#....', '..###...', '#######.', '..###...', '...#....', '...#....', '........'],
  },
};

/** Card types, in Dutch. */
export const CARD_TYPES: Record<string, string> = { Leader: 'Leider', Character: 'Personage', Event: 'Event', Stage: 'Stage' };

/** Rarities as Punk Records spells them → as printed in the rarity list. */
export const RARITY_NAMES: Record<string, string> = { SuperRare: 'Super Rare', SecretRare: 'Secret Rare', TreasureRare: 'Treasure Rare' };
