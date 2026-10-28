import { CARDS, applyGameConfig, setCatalog } from '../../core/data';
import { buildCatalog } from './catalog';
import { config } from './config';
import { matchOnePiece, readCode } from './scan';

const card = (k: string, name: string, extra: any = {}) => ({
  k,
  s: 'OP01',
  n: k.slice(5),
  base: k.replace(/_[pr]\d+$/, ''),
  par: +(/_p(\d+)$/.exec(k)?.[1] ?? 0),
  rep: 0,
  cat: 'Character',
  col: ['Red'],
  r: 'SecretRare',
  c: 9,
  pw: 10000,
  ct: null,
  attr: [],
  ty: [],
  blk: 1,
  i18n: { EN: [name, '', '', ''], JA: ['シャンクス', '', '', ''] },
  ...extra,
});

describe('One Piece scanner', () => {
  beforeEach(() => {
    applyGameConfig(config);
    const raw = {
      imageBase: { EN: '', JA: '' },
      langs: ['EN', 'JA'],
      sets: [{ code: 'OP01', name: 'Romance Dawn', type: 'booster', released: '2022-12-02', total: 121 }],
      cards: [card('OP01-120', 'Shanks'), card('OP01-120_p1', 'Shanks'), card('OP01-120_p2', 'Shanks'), card('OP01-016', 'Nami', { r: 'Rare' }), card('OP01-060', 'Donquixote Doflamingo')],
    };
    const { sets, cards } = buildCatalog(raw);
    setCatalog(sets, cards);
  });

  it('reads the card id leniently, as OCR returns it from real cards', () => {
    expect(readCode('OP01-120 SEC')).toBe('OP01-120');
    expect(readCode('opO1–12O')).toBe('OP01-120');
    expect(readCode('P-001')).toBe('P-001');
    expect(readCode('no id here 120')).toBeNull();
    // Read by tesseract from the official images: the rarity icon runs into the number, the dash goes missing.
    expect(readCode('l ef The Four Emperors/Red-Haired Pirates 0PO1-12063 i')).toBe('OP01-120');
    expect(readCode(') Supernovas/Straw Hat Crew sTo101263 © i')).toBe('ST01-012');
    expect(readCode('| : Land of Wano/Kouzuki Clan £801-001 1m €) g')).toBe('EB01-001');
  });

  it('only takes a reading that is a real card id when it knows them', () => {
    expect(readCode('Pirates 0PO1-12063', new Set(['OP01-120']))).toBe('OP01-120');
    expect(readCode('Pirates 0PO1-12063', new Set(['OP01-016']))).toBeNull();
  });

  it('offers every print of the id, the regular one first, close enough for the photo to pick', () => {
    const ms = matchOnePiece('Shanks', { numText: 'OP01-120', limit: 5 });
    expect(ms.map((m) => CARDS[m.id].key)).toEqual(['one-piece:OP01-120', 'one-piece:OP01-120_p1', 'one-piece:OP01-120_p2']);
    expect(ms[0].conf).toBeGreaterThanOrEqual(70);
    expect(ms[0].conf - ms[2].conf).toBeLessThanOrEqual(5);
  });

  it('falls back on the name when the id is unreadable', () => {
    const ms = matchOnePiece('Donquixote Doflamingo', { numText: '' });
    expect(CARDS[ms[0].id].names.EN).toBe('Donquixote Doflamingo');
    expect(matchOnePiece('Xyz', { numText: '' })).toEqual([]);
  });
});
