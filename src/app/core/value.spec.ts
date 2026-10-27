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
