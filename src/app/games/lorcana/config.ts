import { CARDS } from '../../core/data';
import type { GameConfig } from '../config';
import { matchLorcana } from './scan';
import { rules as deckRules } from './decks';
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
  decks: deckRules,
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
    // Fills are background images shown with `cover`: no tiling sizes, patterns are small SVGs.
    backgrounds: [
      { id: 'paper', name: 'Papier', fill: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'300\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'.85\' numOctaves=\'3\'/%3E%3CfeColorMatrix values=\'0 0 0 0 .09 0 0 0 0 .15 0 0 0 0 .34 0 0 0 .11 0\'/%3E%3C/filter%3E%3Crect width=\'300\' height=\'300\' filter=\'url(%23n)\'/%3E%3C/svg%3E"),linear-gradient(#F6F1E4,#F6F1E4)' },
      { id: 'ink', name: 'Inktspetters', fill: 'radial-gradient(14% 18% at 18% 22%,rgba(35,58,122,.45),transparent 70%),radial-gradient(6% 8% at 30% 34%,rgba(35,58,122,.35),transparent 70%),radial-gradient(16% 20% at 78% 70%,rgba(58,91,217,.35),transparent 70%),radial-gradient(4% 5% at 66% 58%,rgba(226,181,58,.9),transparent 70%),linear-gradient(#F6F1E4,#F6F1E4)' },
      { id: 'stars', name: 'Sterrenhemel', fill: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\' preserveAspectRatio=\'xMidYMid slice\'%3E%3Ccircle cx=\'43\' cy=\'21\' r=\'0.5\' fill=\'%23F6F1E4\'/%3E%3Ccircle cx=\'8\' cy=\'11\' r=\'0.7\' fill=\'%23E2B53A\'/%3E%3Ccircle cx=\'48\' cy=\'76\' r=\'0.35\' fill=\'%23F6F1E4\'/%3E%3Ccircle cx=\'29\' cy=\'6\' r=\'0.35\' fill=\'%23E2B53A\'/%3E%3Ccircle cx=\'55\' cy=\'10\' r=\'0.35\' fill=\'%23E2B53A\'/%3E%3Ccircle cx=\'72\' cy=\'56\' r=\'0.35\' fill=\'%23F6F1E4\'/%3E%3Ccircle cx=\'17\' cy=\'30\' r=\'0.7\' fill=\'%23F6F1E4\'/%3E%3Ccircle cx=\'76\' cy=\'9\' r=\'0.7\' fill=\'%23F6F1E4\'/%3E%3Ccircle cx=\'52\' cy=\'8\' r=\'0.35\' fill=\'%23E2B53A\'/%3E%3Ccircle cx=\'73\' cy=\'19\' r=\'0.5\' fill=\'%23E2B53A\'/%3E%3Ccircle cx=\'20\' cy=\'71\' r=\'0.35\' fill=\'%23F6F1E4\'/%3E%3Ccircle cx=\'41\' cy=\'73\' r=\'0.7\' fill=\'%23E2B53A\'/%3E%3Ccircle cx=\'15\' cy=\'76\' r=\'0.7\' fill=\'%23F6F1E4\'/%3E%3Ccircle cx=\'26\' cy=\'49\' r=\'0.35\' fill=\'%23F6F1E4\'/%3E%3Ccircle cx=\'93\' cy=\'10\' r=\'0.7\' fill=\'%23E2B53A\'/%3E%3Ccircle cx=\'81\' cy=\'28\' r=\'0.5\' fill=\'%23F6F1E4\'/%3E%3Ccircle cx=\'70\' cy=\'56\' r=\'0.5\' fill=\'%23E2B53A\'/%3E%3Ccircle cx=\'76\' cy=\'60\' r=\'0.5\' fill=\'%23E2B53A\'/%3E%3Ccircle cx=\'33\' cy=\'25\' r=\'0.7\' fill=\'%23E2B53A\'/%3E%3Ccircle cx=\'12\' cy=\'75\' r=\'0.5\' fill=\'%23F6F1E4\'/%3E%3Ccircle cx=\'65\' cy=\'45\' r=\'0.7\' fill=\'%23E2B53A\'/%3E%3Ccircle cx=\'38\' cy=\'79\' r=\'0.35\' fill=\'%23E2B53A\'/%3E%3Ccircle cx=\'67\' cy=\'55\' r=\'0.35\' fill=\'%23E2B53A\'/%3E%3Ccircle cx=\'21\' cy=\'64\' r=\'0.5\' fill=\'%23E2B53A\'/%3E%3Ccircle cx=\'87\' cy=\'11\' r=\'0.7\' fill=\'%23F6F1E4\'/%3E%3Ccircle cx=\'42\' cy=\'45\' r=\'0.7\' fill=\'%23E2B53A\'/%3E%3Ccircle cx=\'78\' cy=\'65\' r=\'0.7\' fill=\'%23E2B53A\'/%3E%3Ccircle cx=\'10\' cy=\'13\' r=\'0.5\' fill=\'%23E2B53A\'/%3E%3Ccircle cx=\'91\' cy=\'87\' r=\'0.35\' fill=\'%23E2B53A\'/%3E%3Ccircle cx=\'95\' cy=\'91\' r=\'0.5\' fill=\'%23F6F1E4\'/%3E%3Ccircle cx=\'75\' cy=\'89\' r=\'0.5\' fill=\'%23E2B53A\'/%3E%3Ccircle cx=\'93\' cy=\'51\' r=\'0.7\' fill=\'%23E2B53A\'/%3E%3Ccircle cx=\'4\' cy=\'61\' r=\'0.5\' fill=\'%23E2B53A\'/%3E%3Ccircle cx=\'80\' cy=\'16\' r=\'0.5\' fill=\'%23E2B53A\'/%3E%3Ccircle cx=\'29\' cy=\'38\' r=\'0.35\' fill=\'%23F6F1E4\'/%3E%3Ccircle cx=\'33\' cy=\'52\' r=\'0.5\' fill=\'%23E2B53A\'/%3E%3Ccircle cx=\'12\' cy=\'23\' r=\'0.5\' fill=\'%23E2B53A\'/%3E%3Ccircle cx=\'72\' cy=\'37\' r=\'0.35\' fill=\'%23E2B53A\'/%3E%3Ccircle cx=\'72\' cy=\'37\' r=\'0.7\' fill=\'%23E2B53A\'/%3E%3Ccircle cx=\'47\' cy=\'89\' r=\'0.5\' fill=\'%23E2B53A\'/%3E%3Ccircle cx=\'21\' cy=\'12\' r=\'0.35\' fill=\'%23E2B53A\'/%3E%3Ccircle cx=\'31\' cy=\'86\' r=\'0.35\' fill=\'%23E2B53A\'/%3E%3Ccircle cx=\'64\' cy=\'77\' r=\'0.35\' fill=\'%23E2B53A\'/%3E%3Ccircle cx=\'38\' cy=\'2\' r=\'0.35\' fill=\'%23E2B53A\'/%3E%3Ccircle cx=\'70\' cy=\'49\' r=\'0.7\' fill=\'%23F6F1E4\'/%3E%3Ccircle cx=\'42\' cy=\'18\' r=\'0.7\' fill=\'%23F6F1E4\'/%3E%3Ccircle cx=\'81\' cy=\'85\' r=\'0.7\' fill=\'%23F6F1E4\'/%3E%3Ccircle cx=\'8\' cy=\'60\' r=\'0.7\' fill=\'%23F6F1E4\'/%3E%3Ccircle cx=\'52\' cy=\'52\' r=\'0.5\' fill=\'%23E2B53A\'/%3E%3Ccircle cx=\'15\' cy=\'63\' r=\'0.7\' fill=\'%23E2B53A\'/%3E%3Ccircle cx=\'9\' cy=\'26\' r=\'0.35\' fill=\'%23E2B53A\'/%3E%3Ccircle cx=\'58\' cy=\'22\' r=\'0.35\' fill=\'%23E2B53A\'/%3E%3Ccircle cx=\'78\' cy=\'8\' r=\'0.35\' fill=\'%23E2B53A\'/%3E%3Ccircle cx=\'74\' cy=\'21\' r=\'0.7\' fill=\'%23E2B53A\'/%3E%3Ccircle cx=\'48\' cy=\'80\' r=\'0.35\' fill=\'%23E2B53A\'/%3E%3C/svg%3E"),linear-gradient(160deg,#172757,#0E1838)' },
      { id: 'gold', name: 'Gouden kader', fill: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\' preserveAspectRatio=\'none\'%3E%3Crect x=\'2.5\' y=\'2\' width=\'95\' height=\'96\' fill=\'none\' stroke=\'%23E2B53A\' stroke-width=\'5\' vector-effect=\'non-scaling-stroke\'/%3E%3Crect x=\'6\' y=\'5\' width=\'88\' height=\'90\' fill=\'none\' stroke=\'%23E2B53A\' stroke-width=\'2\' vector-effect=\'non-scaling-stroke\'/%3E%3C/svg%3E"),linear-gradient(#FFFDF7,#FFFDF7)' },
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
