import { CARDS, applyGameConfig, setCatalog } from '../../core/data';
import { buildCatalog } from './catalog';
import { config } from './config';
import { rules } from './decks';

const LEGAL_ALL = 0b1111111;
/** A Scryfall-like id (16 bytes) as base64url, as the catalog stores it. */
const b64 = (i: number) => btoa(String.fromCharCode(...Array.from({ length: 16 }, (_, k) => (k === 15 ? i % 256 : k === 14 ? i >> 8 : 0)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** A small Magic catalog: creatures and spells in red and green, basics, a legendary creature, an off-colour card. */
function catalog() {
  const strings: string[] = [];
  const s = (v: string) => (strings.includes(v) ? strings.indexOf(v) : strings.push(v) - 1);
  let id = 1;
  const card = (name: string, colour: number, cmc: number, type: string, opts: { flags?: number; legal?: number; rank?: number } = {}) => [
    b64(id++), s(name), 0, String(id), 'c', colour, colour, cmc, s(type), 0.1, null, opts.legal ?? LEGAL_ALL, 1, opts.flags ?? 0, -1, opts.rank ?? id, -1, [],
  ];
  const cards = [
    ...Array.from({ length: 40 }, (_, i) => card(`Red Creature ${i}`, 8, (i % 5) + 1, 'Creature — Goblin')),
    ...Array.from({ length: 40 }, (_, i) => card(`Green Spell ${i}`, 16, (i % 4) + 1, i % 2 ? 'Instant' : 'Sorcery')),
    ...Array.from({ length: 70 }, (_, i) => card(`Gruul Thing ${i}`, 8 | 16, (i % 6) + 1, i % 3 ? 'Creature — Beast' : 'Enchantment')),
    card('Mountain', 0, 0, 'Basic Land — Mountain', { flags: 32 }),
    card('Forest', 0, 0, 'Basic Land — Forest', { flags: 32 }),
    card('Gruul Boss', 8 | 16, 4, 'Legendary Creature — Warrior', { rank: 1 }),
    card('Blue Card', 2, 2, 'Instant'),
    card('Banned Card', 8, 2, 'Instant', { legal: 0 }),
  ];
  // Basics are colourless but their identity is their colour.
  cards[150][6] = 8;
  cards[151][6] = 16;
  return { strings, sets: [{ code: 'tst', name: 'Test', type: 'expansion', released: '2024-01-01' }], cards };
}

describe('Magic decks', () => {
  beforeEach(() => {
    applyGameConfig(config);
    const { sets, cards } = buildCatalog(catalog(), ['EN']);
    setCatalog(sets, cards);
  });
  const named = (n: string) => CARDS.find((c) => c.names.EN === n);

  it('generates a legal 60-card deck with lands', () => {
    const lines = rules.generate({ types: ['red', 'green'], ownedOnly: false, currentFormat: false, style: 'midrange', owned: () => 0, format: 'modern' });
    expect(lines.reduce((a, l) => a + l.n, 0)).toBe(60);
    expect(lines.filter((l) => l.card.cardType === 'Land').reduce((a, l) => a + l.n, 0)).toBe(24);
    expect(rules.problems(lines, { id: 'd', name: '', cards: {}, created: 0, format: 'modern' })).toEqual([]);
  });

  it('generates a Commander deck of 100 single cards around a commander', () => {
    const lines = rules.generate({ types: ['red', 'green'], ownedOnly: false, currentFormat: false, style: 'midrange', owned: () => 0, format: 'commander' });
    expect(lines.commander?.names.EN).toBe('Gruul Boss');
    expect(lines.reduce((a, l) => a + l.n, 0)).toBe(100);
    expect(lines.every((l) => l.n === 1 || l.card.basicLand)).toBe(true);
    expect(rules.problems(lines, { id: 'd', name: '', cards: {}, created: 0, format: 'commander', commander: lines.commander.id })).toEqual([]);
  });

  it('names copies, illegal cards and colours outside the commander', () => {
    const lines = [
      { card: named('Red Creature 1'), n: 5 },
      { card: named('Mountain'), n: 20 },
      { card: named('Banned Card'), n: 1 },
    ];
    const p = rules.problems(lines, { id: 'd', name: '', cards: {}, created: 0, format: 'modern' });
    expect(p.some((x) => x.includes('5× Red Creature 1'))).toBe(true);
    expect(p.some((x) => x.includes('Mountain'))).toBe(false);
    expect(p.some((x) => x.includes('Niet legaal') && x.includes('Banned Card'))).toBe(true);
    const boss = named('Gruul Boss');
    const c = rules.problems([{ card: boss, n: 1 }, { card: named('Blue Card'), n: 1 }], { id: 'd', name: '', cards: {}, created: 0, format: 'commander', commander: boss.id });
    expect(c.some((x) => x.includes('Buiten de kleuren') && x.includes('Blue Card'))).toBe(true);
  });
});
