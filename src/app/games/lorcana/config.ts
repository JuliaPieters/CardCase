import { CARDS } from '../../core/data';
import type { GameConfig } from '../config';
import { matchLorcana } from './scan';
import { EMPTY, ILLUSTRATOR, MASTER, PREF_OLDEST, PREF_OWNED, PREF_SET, SHARED_STEPS, prefValue } from '../recipes';

export const config: GameConfig = {
  game: 'lorcana',
  languages: [
    { code: 'EN', label: 'Engels' },
    { code: 'FR', label: 'Frans' },
    { code: 'DE', label: 'Duits' },
    { code: 'IT', label: 'Italiaans' },
  ],
  /** The six inks, with their names as printed on English cards. */
  types: {
    amber: ['Amber', 'oklch(0.86 0.12 80)'],
    amethyst: ['Amethyst', 'oklch(0.74 0.12 310)'],
    emerald: ['Emerald', 'oklch(0.80 0.12 155)'],
    ruby: ['Ruby', 'oklch(0.72 0.14 22)'],
    sapphire: ['Sapphire', 'oklch(0.77 0.10 240)'],
    steel: ['Steel', 'oklch(0.80 0.02 250)'],
    none: ['Zonder inkt', 'oklch(0.90 0.02 90)'],
  },
  rarities: {
    Common: ['C', 'C', 'C'],
    Uncommon: ['U', 'U', 'U'],
    Rare: ['R', 'R', 'R'],
    'Super Rare': ['SR', 'SR', 'R'],
    Legendary: ['L', 'L', 'HR'],
    Epic: ['EP', 'EP', 'HR'],
    Enchanted: ['EN', 'EN', 'HR'],
    Iconic: ['IC', 'IC', 'HR'],
    Special: ['SP', 'SP', 'R'],
  },
  basicRarities: ['Common', 'Uncommon', 'Rare', 'Super Rare', 'Legendary'],
  recipeExample: 'alles uit The Little Mermaid, één per personage, liefst Enchanted',
  exampleName: 'Ariel of Stitch',
  searchPlaceholder: 'Naam, nummer of film/serie, bv. Ariel of Frozen',
  scan: {
    // English, French, German and Italian are all Latin script: one model reads them, the printed code says which.
    langs: [{ key: 'EN', label: 'EN·FR·DE·IT', ocr: ['eng'] }],
    strips: { name: [0.54, 0.16], number: [0.92, 0.08] },
    match: matchLorcana,
  },
  noun: { one: 'personage', many: 'personages' },
  recipes: [
    MASTER,
    ['type', 'Per inkkleur', 'drop', 'Alles van één inkkleur, bijvoorbeeld Amethyst.', '#233A7A', '#F6F1E4'],
    ['story', 'Per film of serie', 'book', 'Alle kaarten uit één film of serie, zoals The Little Mermaid.', '#E2B53A', '#172757'],
    ['single', 'Eén personage, alle versies', 'crown', 'Elke versie van je favoriet naast elkaar.', '#3A5BD9', '#FFFDF7'],
    ['fullart', 'Alleen full art', 'star', 'Alle Enchanted-, Epic- en Iconic-kaarten.', '#172757', '#E2B53A'],
    ILLUSTRATOR,
    EMPTY,
  ],
  recipeSteps: {
    ...SHARED_STEPS,
    type: ['ptype', 'langs', 'per', 'pref'],
    story: ['story', 'langs', 'per', 'pref'],
    single: ['species', 'langs', 'order'],
    fullart: ['langs', 'order'],
  },
  stepTitles: { ptype: ['Inkkleur', 'Welke inkkleur?'], species: ['Personage', 'Welk personage?'], story: ['Film of serie', 'Uit welke film of serie?'] },
  prefs: [
    PREF_OWNED,
    ['fullart', 'Enchanted / Epic / Iconic', 'De mooiste versie; zonder full art de gewone kaart.', 'palette'],
    PREF_OLDEST,
    prefValue('personage'),
    PREF_SET,
  ],
  filters: [
    { key: 'ink', label: 'Alle inkkleuren', first: true, options: () => Object.entries(config.types).map(([k, v]) => [k, v[0]]), match: (c, v) => c.inks.includes(v) },
    { key: 'cardType', label: 'Alle kaartsoorten', first: true, options: () => Object.entries(CARD_TYPES), match: (c, v) => c.cardType === v },
    { key: 'story', label: 'Alle films en series', options: () => [...new Set(CARDS.map((c) => c.story).filter(Boolean))].sort().map((x) => [x, x]), match: (c, v) => c.story === v },
    { key: 'inkwell', label: 'Inkwell: alle', options: () => [['1', 'Inkwell: ja'], ['0', 'Inkwell: nee']], match: (c, v) => (c.inkwell ? '1' : '0') === v },
  ],
  hasFoil: (c) => !c.foilOnly && c.foilTypes.some((f: string) => f !== 'None'),
  cardNumber: (c) => c.numStr + ' · ' + c.set,
  cardFacts: (c) => {
    const ink = c.inks.map((i: string) => config.types[i]?.[0] || i).join(' / ');
    const out: { label: string; value: string; color?: string }[] = [
      { label: 'Inkkleur', value: ink, color: config.types[c.type]?.[1] },
      { label: 'Kaartsoort', value: c.typeName + (c.subtypes?.length ? ' · ' + c.subtypes.join(' · ') : '') },
      { label: 'Kosten', value: String(c.cost ?? '–') },
      { label: 'Inkwell', value: c.inkwell ? 'Ja' : 'Nee' },
    ];
    if (c.lore != null) out.push({ label: 'Lore', value: String(c.lore) });
    if (c.strength != null) out.push({ label: 'Sterkte', value: String(c.strength) });
    if (c.willpower != null) out.push({ label: 'Wilskracht', value: String(c.willpower) });
    if (c.moveCost != null) out.push({ label: 'Verplaatskosten', value: String(c.moveCost) });
    if (c.story) out.push({ label: 'Film of serie', value: c.story });
    if (c.illus) out.push({ label: 'Illustrator', value: c.illus });
    out.push({ label: 'Foil', value: c.foilOnly ? 'Alleen foil' : c.foilTypes?.some((f: string) => f !== 'None') ? 'Gewoon en foil' : 'Alleen gewoon' });
    return out;
  },
  cardText: (c, lang) => c.text?.[lang] || c.text?.EN || '',
  deco: {
    backgrounds: [
      { id: 'paper', name: 'Papier', fill: 'radial-gradient(rgba(23,39,87,.08) .7px,transparent 1.2px) 0 0/7px 9px,radial-gradient(rgba(226,181,58,.18) 1px,transparent 1.5px) 0 0/31px 37px,linear-gradient(#F6F1E4,#F6F1E4)' },
      { id: 'ink', name: 'Inktspetters', fill: 'radial-gradient(14% 18% at 18% 22%,rgba(35,58,122,.45),transparent 70%),radial-gradient(6% 8% at 30% 34%,rgba(35,58,122,.35),transparent 70%),radial-gradient(16% 20% at 78% 70%,rgba(58,91,217,.35),transparent 70%),radial-gradient(4% 5% at 66% 58%,rgba(226,181,58,.9),transparent 70%),linear-gradient(#F6F1E4,#F6F1E4)' },
      { id: 'stars', name: 'Sterrenhemel', fill: 'radial-gradient(rgba(226,181,58,.95) 1.2px,transparent 1.8px) 0 0/23px 29px,radial-gradient(rgba(246,241,228,.7) .8px,transparent 1.3px) 11px 7px/17px 19px,linear-gradient(160deg,#172757,#0E1838)' },
      { id: 'gold', name: 'Gouden kader', fill: 'linear-gradient(#E2B53A,#E2B53A) top/100% 7px no-repeat,linear-gradient(#E2B53A,#E2B53A) bottom/100% 7px no-repeat,linear-gradient(#E2B53A,#E2B53A) left/7px 100% no-repeat,linear-gradient(#E2B53A,#E2B53A) right/7px 100% no-repeat,linear-gradient(#FFFDF7,#FFFDF7)' },
      { id: 'page', name: 'Boekpagina', fill: 'linear-gradient(90deg,rgba(23,39,87,.18),transparent 12%),repeating-linear-gradient(0deg,rgba(23,39,87,.1) 0 1px,transparent 1px 18px),linear-gradient(#FBF7EC,#FBF7EC)' },
      { id: 'night', name: 'Inktblauw', fill: 'linear-gradient(160deg,#233A7A,#172757)' },
    ],
    stickers: [['star', '#E2B53A'], ['crown', '#E2B53A'], ['pen', '#233A7A'], ['ribbon', '#3A5BD9'], ['sparkle', '#C9B6FF'], ['drop', '#233A7A']],
    texts: [
      ['ENCHANTED ✦', '#172757', '#E2B53A'],
      ['NIEUW!', '#E2B53A', '#172757'],
      ['FAVORIET', '#FFFDF7', '#172757'],
      ['FOIL ✦', 'linear-gradient(115deg,#ffb3d9,#ffe9a3,#b8f5d0,#a9dcff)', '#172757'],
      ['PROMO', '#3A5BD9', '#FFFDF7'],
    ],
  },
  icons: {
    pen: ['......##', '.....###', '....###.', '...###..', '..###...', '.###....', '.##.....', '#.......'],
    ribbon: ['.######.', '.######.', '.######.', '.######.', '.##..##.', '.#....#.', '........', '........'],
    drop: ['...#....', '...#....', '..###...', '.#####..', '.##.##..', '#######.', '.#####..', '..###...'],
    book: ['.##..##.', '#..##..#', '#..##..#', '#..##..#', '#..##..#', '#..##..#', '.##..##.', '........'],
    crown: ['........', '#..#..#.', '##.#.##.', '#######.', '#######.', '.#####..', '.#####..', '........'],
  },
};

/** Card types, as players name them (a song is an action with the subtype Song). */
export const CARD_TYPES: Record<string, string> = { Character: 'Personage', Action: 'Actie', Song: 'Lied', Item: 'Item', Location: 'Locatie' };
