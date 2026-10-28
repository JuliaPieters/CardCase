import { config } from '../games/lorcana/config';
import { applyGameConfig, foilOf, ownedValue, totFoil } from './data';

describe('foil copies', () => {
  beforeEach(() => applyGameConfig(config));
  // Real prices: trend and the averages priceAt() reads.
  const card = { trend: 2, avg1: 2, avg7: 2, avg30: 2, foil: { trend: 10 } };

  it('count foil within the language counts', () => {
    const o = { EN: 3, FR: 1, foil: { EN: 1, FR: 5 } };
    expect(foilOf(o, 'EN')).toBe(1);
    expect(foilOf(o, 'FR')).toBe(1);
    expect(totFoil(o)).toBe(2);
  });

  it('values foil copies at the foil price', () => {
    expect(ownedValue(card, { EN: 3, foil: { EN: 1 } })).toBe(2 * 2 + 10);
    expect(ownedValue(card, { EN: 2 })).toBe(4);
    expect(ownedValue({ trend: 2, avg30: 2 }, { EN: 2, foil: { EN: 2 } })).toBe(4);
  });
});

describe('other versions (Pokémon)', () => {
  beforeEach(() => applyGameConfig(config));

  it('values each version at its own price, the rest at the plain one', () => {
    const card = { trend: 1, avg1: 1, avg7: 1, avg30: 1, vp: { reverse: { trend: 4 }, holo_1st_edition: { trend: null } } };
    const o = { EN: 4, reverse: { EN: 2 }, holo_1st_edition: { EN: 1 } };
    // One plain at 1, two reverse holo at 4, the 1st edition without a price of its own at the plain price.
    expect(ownedValue(card, o)).toBe(1 + 8 + 1);
  });
});
