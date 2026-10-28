import { config } from '../games/lorcana/config';
import { DEFRECIPE, applyGameConfig, buildRecipe, setCatalog, syncSlots } from './data';

describe('master set', () => {
  // Elsa twice in the set (the regular one and an Enchanted), Mickey only as regular; Elsa also comes in foil.
  const card = (num: number, name: string, variant: string, foil = true) => ({
    key: 'lorcana:TFC-' + num, set: 'TFC', setName: 'The First Chapter', num, numStr: String(num), names: { EN: name }, type: 'amber',
    rarity: 'C', avail: ['EN'], sp: 2000 + num, year: 2023, variant, illus: '', trend: num, foilOnly: false, foilTypes: foil ? ['None', 'Cold'] : ['None'],
  });
  beforeEach(() => {
    applyGameConfig(config);
    setCatalog([{ code: 'TFC', name: 'The First Chapter' }], [card(1, 'Elsa', 'regular'), card(2, 'Mickey', 'regular', false), card(205, 'Elsa', 'fullart')]);
  });
  const recipe = (mv?: string): any => ({ ...DEFRECIPE, type: 'master', set: 'TFC', order: 'num', fmt: 9, buffer: 0, mv });

  it('one per card: the dear version you have stands in for the regular one', () => {
    const none = buildRecipe(recipe('one'), {});
    expect(none.n).toBe(2);
    expect(none.slots.slice(0, 2)).toEqual([0, 1]);
    const pulled = buildRecipe(recipe('one'), { 2: { EN: 1 } });
    expect(pulled.slots.slice(0, 2)).toEqual([2, 1]);
    expect(pulled.ownedN).toBe(1);
    expect((pulled.alts as any)[0]).toBe(2);
  });

  it('every number: each card of the set once', () => {
    expect(buildRecipe(recipe('nums'), {}).slots.slice(0, 3)).toEqual([0, 1, 2]);
  });

  it('every version: the foil gets a slot of its own, owned only when you have the foil', () => {
    const res = buildRecipe(recipe('all'), { 0: { EN: 1 } });
    expect(res.slots.slice(0, 5)).toEqual([0, 0, 1, 2, 2]);
    expect(res.ver).toEqual({ 0: '', 1: 'foil', 3: '', 4: 'foil' });
    expect(res.ownedN).toBe(1);
    expect(buildRecipe(recipe('all'), { 0: { EN: 1, foil: { EN: 1 } } }).ownedN).toBe(1);
    expect(buildRecipe(recipe('all'), { 0: { EN: 2, foil: { EN: 1 } } }).ownedN).toBe(2);
  });

  it('older recipes: without special versions is one per card', () => {
    expect(buildRecipe({ ...recipe(undefined), special: false }, {}).n).toBe(2);
    expect(buildRecipe({ ...recipe(undefined) }, {}).n).toBe(3);
  });

  it('a slot keeps its version when the slots are laid out again', () => {
    const b = { fmt: 9, pages: 2, slots: [0, 0, null], ver: { 0: '', 1: 'foil' }, deco: { images: [] } };
    expect(syncSlots(b).ver).toEqual({ 0: '', 1: 'foil' });
  });
});
