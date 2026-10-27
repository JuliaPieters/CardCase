import { buildCatalog } from '../games/pokemon/catalog';
import { config } from '../games/pokemon/config';
import { CARDS, applyGameConfig, setCatalog } from './data';
import { deserializeUser, newest, serializeUser, shareForm } from './persist';

const set = (code: string, lang: string, official: number) => ({ code, id: code, api: lang.toLowerCase(), lang, name: code, serie: 's', year: 2000, official, img: null, imgDE: null, hasDE: true });
const RAW = {
  strings: [],
  sets: [set('base1', 'EN', 102), set('tk-ex-p', 'EN', 12), set('JA-SV7', 'JA', 102)],
  cards: [
    [0, '4', 'Charizard', 'Glurak', -1, -1, 6, -1, 0, 0],
    [0, '58', 'Pikachu', 'Pikachu', -1, -1, 25, -1, 0, 0],
    [1, '3', 'Pikachu', null, -1, -1, 25, -1, 0, 0],
    [2, '4', 'ミュウex', null, -1, -1, 151, -1, 0, 0],
  ],
};

/** A saved user from before departments: Pokémon only, cards keyed "set/number". */
const V1 = {
  v: 1,
  owned: { 'base1/4': { EN: 2, DE: 0, JA: 0, ZH: 0 }, 'tk-ex-p/3': { EN: 1, DE: 0, JA: 0, ZH: 0 }, 'JA-SV7/4': { EN: 0, DE: 0, JA: 1, ZH: 0 } },
  added: { 'base1/4': 1000 },
  binders: [{ id: 'b1', name: 'Mijn binder', fmt: 9, pages: 1, cover: '#E3350D', slots: ['U:base1/4', null, 'U:tk-ex-p/3', 'R:x', ...Array(5).fill(null)], deco: { bg: {}, images: [], stickers: [] } }],
  dark: true,
  savedAt: 500,
};

describe('persist', () => {
  beforeEach(() => {
    applyGameConfig(config);
    const { sets, cards } = buildCatalog(RAW);
    setCatalog(sets, cards);
  });

  const idOf = (key: string) => CARDS.find((c) => c.key === key)!.id;

  it('migrates a Pokémon collection from before departments', () => {
    const u = deserializeUser(V1)!;
    expect(u.owned[idOf('pokemon:base1-4')]['EN']).toBe(2);
    expect(u.owned[idOf('pokemon:tk-ex-p-3')]['EN']).toBe(1);
    expect(u.owned[idOf('pokemon:JA-SV7-4')]['JA']).toBe(1);
    expect(u.added[idOf('pokemon:base1-4')]).toBe(1000);
    expect(u.binders[0].slots.slice(0, 4)).toEqual([idOf('pokemon:base1-4'), null, idOf('pokemon:tk-ex-p-3'), 'R:x']);
    expect(u.games).toEqual(['pokemon']);
    expect(u.dark).toBe(true);
  });

  it('saves every department, with the game on each binder', () => {
    const u = deserializeUser(V1)!;
    u.otherGames = { lorcana: { owned: { 'lorcana:1-12': { EN: 1 } }, added: {}, binders: [] } };
    const saved = serializeUser(u);
    expect(saved['v']).toBe(2);
    expect(Object.keys(saved['data'].pokemon.owned).sort()).toEqual(['pokemon:JA-SV7-4', 'pokemon:base1-4', 'pokemon:tk-ex-p-3']);
    expect(saved['data'].pokemon.binders[0].game).toBe('pokemon');
    expect(saved['data'].pokemon.binders[0].slots[0]).toBe('U:pokemon:base1-4');
    expect(saved['data'].lorcana.owned['lorcana:1-12']['EN']).toBe(1);
    expect(saved['summary'].pokemon.cards).toBe(4);
    // And back: the same collection.
    const again = deserializeUser(saved)!;
    expect(again.owned).toEqual(u.owned);
    expect(again.binders[0].slots).toEqual(u.binders[0].slots);
    expect(again.otherGames['lorcana']).toEqual(u.otherGames['lorcana']);
  });

  it('takes Pokémon from version 1 when the version online saved it later', () => {
    const v2 = serializeUser({ ...deserializeUser(V1)!, otherGames: { lorcana: { owned: { 'lorcana:1-12': { EN: 1 } }, added: {}, binders: [] } } });
    const later = { ...V1, owned: { 'base1/58': { EN: 1, DE: 0, JA: 0, ZH: 0 } }, savedAt: v2['savedAt'] + 1 };
    const u = newest(v2, later)!;
    expect(Object.keys(u['data'].pokemon.owned)).toEqual(['pokemon:base1-58']);
    expect(u['data'].lorcana).toBeTruthy();
    expect(newest(v2, V1)).toBe(v2);
  });

  it('shares Pokémon in the form the version online reads', () => {
    const shared = shareForm(serializeUser(deserializeUser(V1)!));
    expect(Object.keys(shared.owned).sort()).toEqual(['JA-SV7/4', 'base1/4', 'tk-ex-p/3']);
    expect(shared.binders[0].slots[2]).toBe('U:tk-ex-p/3');
  });
});
