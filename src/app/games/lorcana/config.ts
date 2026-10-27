import { CARDS } from '../../core/data';
import type { GameConfig } from '../config';
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
  recipeExample: 'alles uit De kleine zeemeermin, één per personage, liefst Enchanted',
  exampleName: 'Ariel of Stitch',
  screenName: 'VERHALENBOEK',
  noun: { one: 'personage', many: 'personages' },
  recipes: [
    MASTER,
    ['type', 'Per inkkleur', 'drop', 'Alles van één inkkleur, bijvoorbeeld Amethyst.', '#233A7A', '#F6F1E4'],
    ['story', 'Per verhaal', 'book', 'Alle kaarten uit één verhaal, zoals De kleine zeemeermin.', '#E2B53A', '#172757'],
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
  stepTitles: { ptype: ['Inkkleur', 'Welke inkkleur?'], species: ['Personage', 'Welk personage?'] },
  prefs: [
    PREF_OWNED,
    ['fullart', 'Enchanted / Epic / Iconic', 'De mooiste versie; zonder full art de gewone kaart.', 'palette'],
    PREF_OLDEST,
    prefValue('personage'),
    PREF_SET,
  ],
  filters: [
    { key: 'ink', label: 'Alle inkkleuren', options: () => Object.entries(config.types).map(([k, v]) => [k, v[0]]), match: (c, v) => c.inks.includes(v) },
    { key: 'cardType', label: 'Alle kaartsoorten', options: () => Object.entries(CARD_TYPES), match: (c, v) => c.cardType === v },
    { key: 'cost', label: 'Alle kosten', options: () => [...new Set(CARDS.map((c) => c.cost).filter((x) => x != null))].sort((a, b) => a - b).map((n) => [String(n), n + ' inkt']), match: (c, v) => String(c.cost) === v },
    { key: 'inkwell', label: 'Inkwell: alle', options: () => [['1', 'Inkwell: ja'], ['0', 'Inkwell: nee']], match: (c, v) => (c.inkwell ? '1' : '0') === v },
    { key: 'story', label: 'Alle verhalen', options: () => [...new Set(CARDS.map((c) => c.story).filter(Boolean))].sort().map((x) => [x, x]), match: (c, v) => c.story === v },
    { key: 'variant', label: 'Alle varianten', options: () => [['regular', 'Gewoon'], ['fullart', 'Enchanted / Epic / Iconic'], ['promo', 'Promo'], ['foil', 'Heeft foil']], match: (c, v) => (v === 'foil' ? c.foilTypes.some((f: string) => f !== 'None') : c.variant === v) },
  ],
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
    if (c.story) out.push({ label: 'Verhaal', value: c.story });
    if (c.illus) out.push({ label: 'Illustrator', value: c.illus });
    out.push({ label: 'Foil', value: c.foilOnly ? 'Alleen foil' : c.foilTypes?.some((f: string) => f !== 'None') ? 'Gewoon en foil' : 'Alleen gewoon' });
    return out;
  },
  cardText: (c, lang) => c.text?.[lang] || c.text?.EN || '',
  icons: {
    drop: ['...#....', '...#....', '..###...', '.#####..', '.##.##..', '#######.', '.#####..', '..###...'],
    book: ['.##..##.', '#..##..#', '#..##..#', '#..##..#', '#..##..#', '#..##..#', '.##..##.', '........'],
    crown: ['........', '#..#..#.', '##.#.##.', '#######.', '#######.', '.#####..', '.#####..', '........'],
  },
};

/** Card types, as players name them (a song is an action with the subtype Song). */
export const CARD_TYPES: Record<string, string> = { Character: 'Personage', Action: 'Actie', Song: 'Lied', Item: 'Item', Location: 'Locatie' };
