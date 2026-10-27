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
  icons: {
    drop: ['...#....', '...#....', '..###...', '.#####..', '.##.##..', '#######.', '.#####..', '..###...'],
    book: ['.##..##.', '#..##..#', '#..##..#', '#..##..#', '#..##..#', '#..##..#', '.##..##.', '........'],
    crown: ['........', '#..#..#.', '##.#.##.', '#######.', '#######.', '.#####..', '.#####..', '........'],
  },
};

/** Card types, as players name them (a song is an action with the subtype Song). */
export const CARD_TYPES: Record<string, string> = { Character: 'Personage', Action: 'Actie', Song: 'Lied', Item: 'Item', Location: 'Locatie' };
