import { buildCatalog } from '../games/pokemon/catalog';
import { matchCards, parseNumber } from './card-match';
import { config } from '../games/pokemon/config';
import { CARDS, applyGameConfig, setCatalog } from './data';

const set = (code: string, lang: string, official: number) => ({ code, id: code, api: lang.toLowerCase(), lang, name: code, serie: 's', year: 2000, official, img: null, imgDE: null, hasDE: true });
// Rows: [setIdx, localId, name, nameDE, rarity, type, dex, illus, imgFlags, category]
const RAW = {
  strings: [],
  sets: [set('base1', 'EN', 102), set('base4', 'EN', 130), set('sv02', 'EN', 193), set('swsh10tg', 'EN', 30), set('JA-SV7', 'JA', 102)],
  cards: [
    [0, '4', 'Charizard', 'Glurak', -1, -1, 6, -1, 0, 0],
    [0, '2', 'Blastoise', 'Turtok', -1, -1, 9, -1, 0, 0],
    [1, '4', 'Charizard', 'Glurak', -1, -1, 6, -1, 0, 0],
    [0, '58', 'Pikachu', 'Pikachu', -1, -1, 25, -1, 0, 0],
    [2, '63', 'Pikachu ex', 'Pikachu-ex', -1, -1, 25, -1, 0, 0],
    [3, 'TG05', 'Gardevoir', 'Guardevoir', -1, -1, 282, -1, 0, 0],
    [4, '4', 'ミュウex', null, -1, -1, 151, -1, 0, 0],
  ],
};
const name = (t: string, o = {}) => matchCards(t, o).map((m) => `${CARDS[m.id].set}/${CARDS[m.id].localId}`);

describe('matchCards', () => {
  beforeAll(() => {
    const { sets, cards } = buildCatalog(RAW);
    setCatalog(sets, cards);
  });

  it('uses the set size to pick the right print', () => {
    expect(name('BASIC Charizard HP 120\nIllus. Mitsuhiro Arita 4/102')[0]).toBe('base1/4');
    expect(name('Charizard\n4/130')[0]).toBe('base4/4');
  });

  it('matches German names and forgives OCR misreads', () => {
    expect(name('Glurak KP 120\n 4/1O2')[0]).toBe('base1/4');
    expect(name('Pikachv\n 058/102')[0]).toBe('base1/58');
  });

  it('prefers the longer name that is in the text', () => {
    expect(name('Pikachu ex 120HP')[0]).toBe('sv02/63');
  });

  it('ignores Japanese names that normalize to almost nothing', () => {
    expect(name('Pikachu ex\n063/193')).not.toContain('JA-SV7/4');
  });

  it('boosts the expected card', () => {
    expect(name('Charizard', { expect: CARDS.find((c) => c.set === 'base4').id })[0]).toBe('base4/4');
  });

  it('reads numbers whose slash OCR lost or misread', () => {
    expect(name('Blastoise\n© 1999 Wizards. 20102 *')[0]).toBe('base1/2');
    expect(name('Pikachu ex\n0637, 193')[0]).toBe('sv02/63');
  });

  it('does not take copyright years or words for numbers', () => {
    expect(name('Charizard\n©1995,96,98,99 Nintendo. © 1999 Wizards. 4/102')[0]).toBe('base1/4');
    expect(parseNumber('weakness X 2 | resistance')).toBeNull();
  });

  it('ignores the name of the previous stage', () => {
    expect(name('STAGE 1 Evolves from Charizard\nPut Pikachu ex on the Basic')[0]).toBe('sv02/63');
  });

  it('tells the Japanese and English print with the same number apart', () => {
    expect(name('xx\nSV7 004/102')[0]).toBe('JA-SV7/4');
    expect(name('Charizard\nEN 004/102')[0]).toBe('base1/4');
    expect(name('xx\n004/102', { lang: 'JA' })[0]).toBe('JA-SV7/4');
  });

  it('reads the number only from the bottom strip when given', () => {
    // "190" at the top is HP; the bottom strip holds the real number.
    expect(name('Pikachu ex 190 HP\n058/102', { numText: '058/102' })[0]).toBe('base1/58');
    expect(name('Charizard HP 1102', { numText: '' })[0]).not.toBe('base1/1');
  });

  it('matches Japanese names read by the Japanese OCR, also without the "ex"', () => {
    expect(name('ミュウ\n004/102')[0]).toBe('JA-SV7/4');
    expect(name('ミ ュ ウ ex')[0]).toBe('JA-SV7/4');
  });

  it('returns nothing for noise', () => {
    expect(name('qwerty zxcv')).toEqual([]);
  });

  it('parses collector numbers', () => {
    expect(parseNumber('SVI EN O57 / 198')).toEqual({ key: '57', total: 198 });
    expect(parseNumber('TG05/TG30')).toEqual({ key: 'TG5', total: 30 });
    expect(parseNumber('063/1910')).toEqual({ key: '63', total: 191 });
    expect(parseNumber('HP 120')).toBeNull();
  });
});
