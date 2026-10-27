import { readLine } from './scan';

describe('Lorcana card line', () => {
  it('reads number, set size, language and set', () => {
    expect(readLine('12/204 . EN . 5')).toEqual({ num: '12', total: 204, promo: null, lang: 'EN', set: '5' });
    expect(readLine('205/204 . FR . 1')).toEqual({ num: '205', total: 204, promo: null, lang: 'FR', set: '1' });
    expect(readLine('1/31 . EN . Q1')).toEqual({ num: '1', total: 31, promo: null, lang: 'EN', set: 'Q1' });
  });

  it('reads promos and art variants', () => {
    expect(readLine('8/P1 . EN . 1')).toMatchObject({ num: '8', promo: 'P1', set: '1' });
    expect(readLine('4A/204 . DE . 3')).toMatchObject({ num: '4A', total: 204, lang: 'DE', set: '3' });
  });

  it('forgives O for 0 and a missing language', () => {
    expect(readLine('1O2/2O4')).toMatchObject({ num: '102', total: 204, lang: null, set: null });
    expect(readLine('VOICELESS')).toBeNull();
  });
});
