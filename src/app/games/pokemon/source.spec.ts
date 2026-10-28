import { versions } from './source';

const cm = (idProduct: number, trend: number, trendHolo = 0) => ({ cardmarket: { idProduct, trend, low: trend, avg1: trend, avg7: trend, avg30: trend, 'trend-holo': trendHolo, 'low-holo': trendHolo, 'avg30-holo': trendHolo } });

describe('Pokémon versions from TCGdex', () => {
  it('puts the plain print first and prices a reverse holo from the holo fields', () => {
    const vs = versions([
      { type: 'reverse', size: 'standard', pricing: cm(1, 0.02, 0.17) },
      { type: 'normal', size: 'standard', pricing: cm(1, 0.02, 0.17) },
      { type: 'reverse', size: 'standard', foil: 'pokeball', pricing: cm(2, 0.3, 2.7) },
      { type: 'normal', size: 'jumbo', pricing: cm(3, 12) },
    ]);
    expect(vs.map((v) => v.label)).toEqual(['Normaal', 'Reverse holo', 'Reverse holo · Poké Ball']);
    expect(vs.map((v) => v.key)).toEqual(['normal', 'reverse', 'reverse_pokeball']);
    expect(vs.map((v) => v.price[0])).toEqual([0.02, 0.17, 2.7]);
  });

  it('gives a 1st edition no price of its own when Cardmarket sells it as the same product', () => {
    const vs = versions([
      { type: 'normal', subtype: 'shadowless', stamp: ['1st-edition'], size: 'standard', pricing: cm(660169, 202) },
      { type: 'normal', subtype: 'unlimited', size: 'standard', pricing: cm(273753, 7.8) },
      { type: 'normal', subtype: 'shadowless', size: 'standard', pricing: cm(660169, 202) },
    ]);
    expect(vs.map((v) => v.label)).toEqual(['Normaal', 'Normaal · Shadowless', 'Normaal · Shadowless · 1st edition']);
    expect(vs.map((v) => v.price[0])).toEqual([7.8, 202, null]);
  });
});
