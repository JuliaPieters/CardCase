import { CARDS } from '../../core/data';
import type { GameConfig } from '../config';
import { EMPTY, ILLUSTRATOR, MASTER, PREF_OLDEST, PREF_OWNED, PREF_SET, SHARED_STEPS, prefValue } from '../recipes';
import { matchMagic } from './scan';
import { rules as deckRules } from './decks';

/** Main card types, as players name them. */
export const CARD_TYPES: Record<string, string> = {
  Creature: 'Wezen',
  Instant: 'Instant',
  Sorcery: 'Sorcery',
  Enchantment: 'Enchantment',
  Artifact: 'Artefact',
  Planeswalker: 'Planeswalker',
  Battle: 'Battle',
  Land: 'Land',
};
const FORMAT_NAMES: Record<string, string> = { standard: 'Standard', pioneer: 'Pioneer', modern: 'Modern', legacy: 'Legacy', vintage: 'Vintage', pauper: 'Pauper', commander: 'Commander' };

export const config: GameConfig = {
  game: 'magic',
  languages: [
    { code: 'EN', label: 'Engels' },
    { code: 'DE', label: 'Duits' },
    { code: 'FR', label: 'Frans' },
    { code: 'IT', label: 'Italiaans' },
    { code: 'ES', label: 'Spaans' },
    { code: 'JA', label: 'Japans' },
  ],
  /** The five colours, multicoloured and colourless. */
  types: {
    white: ['Wit', 'oklch(0.94 0.04 95)'],
    blue: ['Blauw', 'oklch(0.76 0.10 240)'],
    black: ['Zwart', 'oklch(0.58 0.03 300)'],
    red: ['Rood', 'oklch(0.72 0.15 28)'],
    green: ['Groen', 'oklch(0.74 0.12 150)'],
    multi: ['Meerkleurig', 'oklch(0.86 0.10 85)'],
    colorless: ['Kleurloos', 'oklch(0.86 0.01 250)'],
  },
  rarities: {
    Common: ['C', 'C', 'C'],
    Uncommon: ['U', 'U', 'U'],
    Rare: ['R', 'R', 'R'],
    Mythic: ['M', 'M', 'HR'],
    Special: ['S', 'S', 'HR'],
    Bonus: ['B', 'B', 'HR'],
  },
  basicRarities: ['Common', 'Uncommon', 'Rare'],
  scan: {
    langs: [{ key: 'EN', label: 'EN·DE·FR·IT·ES', ocr: ['eng'] }],
    strips: { name: [0.03, 0.09], number: [0.9, 0.08] },
    match: matchMagic,
  },
  exampleName: 'Lightning Bolt',
  searchPlaceholder: 'Naam of nummer, bv. Lightning Bolt',
  recipeExample: 'alle versies van Lightning Bolt',
  noun: { one: 'kaart', many: 'kaarten' },
  recipes: [
    MASTER,
    ['type', 'Per kleur', 'drop', 'Alles van één kleur, bijvoorbeeld blauw of meerkleurig.', '#4B2A7B', '#F2EEFF'],
    ['single', 'Eén kaart, alle versies', 'crown', 'Elke print van je favoriete kaart naast elkaar.', '#C9B6FF', '#321A57'],
    ['fullart', 'Alleen speciale versies', 'star', 'Borderless, showcase en extended art.', '#141634', '#C9B6FF'],
    ILLUSTRATOR,
    EMPTY,
  ],
  recipeSteps: { ...SHARED_STEPS, type: ['ptype', 'per', 'pref'], single: ['species', 'order'], fullart: ['order'], illus: ['illus', 'per', 'pref'] },
  stepTitles: { ptype: ['Kleur', 'Welke kleur?'], species: ['Kaart', 'Welke kaart?'] },
  prefs: [PREF_OWNED, ['fullart', 'Speciale versie', 'Borderless, showcase of extended art; anders de gewone.', 'palette'], PREF_OLDEST, prefValue('kaart'), PREF_SET],
  filters: [
    { key: 'colour', label: 'Alle kleuren', first: true, options: () => Object.entries(config.types).map(([k, v]) => [k, v[0]]), match: (c, v) => (v === 'multi' ? c.colours.length > 1 : v === 'colorless' ? !c.colours.length : c.colours.includes(v)) },
    { key: 'cardType', label: 'Alle kaartsoorten', first: true, options: () => Object.entries(CARD_TYPES), match: (c, v) => c.cardType === v },
    { key: 'format', label: 'Alle formaten', options: () => Object.entries(FORMAT_NAMES).map(([k, v]) => [k, 'Legaal in ' + v]), match: (c, v) => !!c.legal[v] },
    { key: 'cmc', label: 'Alle manawaardes', options: () => [...new Set(CARDS.map((c) => Math.min(8, Math.floor(c.cmc))))].sort((a, b) => a - b).map((n) => [String(n), n === 8 ? 'Mana value 8+' : 'Mana value ' + n]), match: (c, v) => String(Math.min(8, Math.floor(c.cmc))) === v },
  ],
  decks: deckRules,
  hasFoil: (c) => !c.foilOnly && c.foilTypes.length > 1,
  cardNumber: (c) => c.set.toUpperCase() + ' ' + c.numStr,
  cardFacts: (c) => [
    { label: 'Manakosten', value: c.manaCost || '–' },
    { label: 'Mana value', value: String(c.cmc) },
    { label: 'Type', value: c.typeLine },
    { label: 'Kleuridentiteit', value: c.identity.map((i: string) => config.types[i][0]).join(' / ') || 'Kleurloos', color: config.types[c.type]?.[1] },
    { label: 'Legaal in', value: Object.entries(FORMAT_NAMES).filter(([k]) => c.legal[k]).map(([, v]) => v).join(', ') || '–' },
    ...(c.keywords.length ? [{ label: 'Keywords', value: c.keywords.join(', ') }] : []),
    { label: 'Illustrator', value: c.illus || '–' },
    { label: 'Afwerking', value: c.foilOnly ? 'Alleen foil' : c.foilTypes.length > 1 ? 'Gewoon en foil' : 'Alleen gewoon' },
  ],
  deco: {
    backgrounds: [
      { id: 'night', name: 'Nachtlucht', fill: 'radial-gradient(60% 50% at 30% 20%,rgba(201,182,255,.25),transparent 70%),linear-gradient(160deg,#1C1F4A,#141634)' },
      { id: 'nebula', name: 'Paarse nevel', fill: 'radial-gradient(40% 40% at 25% 30%,rgba(159,227,255,.35),transparent 70%),radial-gradient(45% 45% at 75% 70%,rgba(201,182,255,.45),transparent 70%),linear-gradient(160deg,#4B2A7B,#321A57)' },
      { id: 'silver', name: 'Zilver', fill: 'linear-gradient(135deg,#D9DCE8,#F4F5FA 45%,#B9BDCF)' },
      { id: 'lavender', name: 'Lavendel', fill: 'linear-gradient(160deg,#F2EEFF,#C9B6FF)' },
    ],
    stickers: [['sparkle', '#C9B6FF'], ['star', '#D9DCE8'], ['bolt', '#9FE3FF'], ['crown', '#C9B6FF'], ['drop', '#9FE3FF'], ['heart', '#C9B6FF']],
    texts: [
      ['MYTHIC ✦', '#321A57', '#C9B6FF'],
      ['NIEUW!', '#C9B6FF', '#321A57'],
      ['FAVORIET', '#F4F5FA', '#141634'],
      ['FOIL ✦', 'linear-gradient(115deg,#ffb3d9,#ffe9a3,#b8f5d0,#a9dcff)', '#141634'],
      ['PROMO', '#9FE3FF', '#141634'],
    ],
  },
  icons: {
    drop: ['...#....', '...#....', '..###...', '.#####..', '.##.##..', '#######.', '.#####..', '..###...'],
    crown: ['........', '#..#..#.', '##.#.##.', '#######.', '#######.', '.#####..', '.#####..', '........'],
  },
};
