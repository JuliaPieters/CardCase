/**
 * Binder recipes that work the same in every department (docs/product.md): a department's config lists them next to
 * its own. Tiles are [key, label, pixel icon, description, colour, text colour].
 */
type Tile = [string, string, string, string, string, string];

export const MASTER: Tile = ['master', 'Master set', 'master', 'Elke kaart uit één set, inclusief varianten.', '#3E6FB0', '#FFF8EE'];
export const ILLUSTRATOR: Tile = ['illus', 'Illustrator', 'brush', 'Alle kaarten van één tekenaar.', '#7A5BC7', '#FFF8EE'];
export const EMPTY: Tile = ['empty', 'Leeg beginnen', 'page', "Lege pagina's om zelf te vullen of te decoreren.", '#FFFDF6', '#1A1C22'];

export const SHARED_STEPS: Record<string, string[]> = {
  master: ['set', 'order'],
  illus: ['illus', 'langs', 'per', 'pref'],
  empty: ['pages'],
};

/** Version preferences every department has (a department adds its own, like Pokémon's illustration rares). */
export const PREF_OWNED: [string, string, string, string] = ['owned', 'Wat ik al heb, anders goedkoopste', 'Je eigen kaarten eerst; ontbrekende zo goedkoop mogelijk.', 'savings'];
export const PREF_OLDEST: [string, string, string, string] = ['oldest', 'Oudste versie', 'Zo dicht mogelijk bij het origineel.', 'history'];
export const PREF_SET: [string, string, string, string] = ['set', 'Uit een specifieke set', 'Kies een set; staat hij er niet in, de gewone kaart.', 'collections_bookmark'];
export const prefValue = (noun: string): [string, string, string, string] => ['value', 'Meest waardevol', `De topversie van elke ${noun}.`, 'diamond'];

/** The config of a department that isn't built yet: only the shared recipes. */
export const STUB_RECIPES = {
  scan: { langs: [{ key: 'EN', label: 'EN', ocr: ['eng'] }], strips: { name: [0, 0.16] as [number, number], number: [0.86, 0.14] as [number, number] }, match: () => [] },
  screenName: 'OVERZICHT',
  noun: { one: 'kaart', many: 'kaarten' },
  recipes: [MASTER, ILLUSTRATOR, EMPTY],
  recipeSteps: SHARED_STEPS,
  prefs: [PREF_OWNED, PREF_OLDEST, prefValue('kaart'), PREF_SET],
};
