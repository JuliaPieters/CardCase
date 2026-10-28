import { CARDS, applyGameConfig, setCatalog } from '../../core/data';
import { parseDeckList } from '../../core/decks';
import { buildCatalog } from './catalog';
import { config } from './config';
import { rules } from './decks';

/** A small One Piece catalog: per colour a leader and 30 characters and events over the costs; one parallel. */
function catalog() {
  const colours = ['Red', 'Green', 'Blue'];
  const cards = colours.flatMap((col, j) => [
    { k: `OP01-${j}00`, s: 'OP01', n: `${j}00`, base: `OP01-${j}00`, par: 0, rep: 0, cat: 'Leader', col: [col], r: 'Leader', c: 5, pw: 5000, ct: null, attr: [], ty: ['Crew'], blk: 1, i18n: { EN: [`${col} Captain`, '', '', ''] } },
    ...Array.from({ length: 30 }, (_, i) => {
      const id = `OP01-${j}${String(i + 1).padStart(2, '0')}`;
      return { k: id, s: 'OP01', n: id.slice(5), base: id, par: 0, rep: 0, cat: i % 6 === 5 ? 'Event' : 'Character', col: [col], r: 'Common', c: (i % 7) + 1, pw: 3000, ct: 1000, attr: [], ty: i % 2 ? ['Crew'] : ['Navy'], blk: 1, i18n: { EN: [`${col} Pirate ${i + 1}`, i % 4 ? '' : '[Rush]', '', ''] } };
    }),
  ]);
  cards.push({ ...cards[1], k: 'OP01-001_p1', n: '001 P1', par: 1 });
  return { imageBase: { EN: '', JA: '' }, langs: ['EN'], sets: [{ code: 'OP01', name: 'Romance Dawn', type: 'booster', released: '2022-12-02', total: 121 }], cards };
}

const card = (k: string) => CARDS.find((c) => c.key === 'one-piece:' + k);

describe('One Piece decks', () => {
  beforeEach(() => {
    applyGameConfig(config);
    const { sets, cards } = buildCatalog(catalog());
    setCatalog(sets, cards);
  });

  it('generates a legal deck: a leader of the colour and 50 cards', () => {
    const lines = rules.generate({ types: ['red'], ownedOnly: false, currentFormat: false, style: 'midrange', owned: () => 0 });
    expect(lines.commander?.names.EN).toBe('Red Captain');
    const main = lines.filter((l) => l.card !== lines.commander);
    expect(main.reduce((a, l) => a + l.n, 0)).toBe(50);
    expect(main.every((l) => l.card.colours.includes('red') && l.n <= 4)).toBe(true);
    expect(rules.problems(lines, { id: 'd', name: 'x', cards: {}, created: 0, commander: lines.commander.id })).toEqual([]);
  });

  it('counts a parallel as the same card number', () => {
    const leader = card('OP01-000');
    const lines = [
      { card: leader, n: 1 },
      { card: card('OP01-001'), n: 3 },
      { card: card('OP01-001_p1'), n: 2 },
    ];
    const p = rules.problems(lines, { id: 'd', name: 'x', cards: {}, created: 0, commander: leader.id });
    expect(p.some((x) => x.startsWith('5× Red Pirate 1 (OP01-001)'))).toBe(true);
  });

  it('flags cards outside the leader colours, a second leader and a missing leader', () => {
    const leader = card('OP01-000');
    const lines = [
      { card: leader, n: 1 },
      { card: card('OP01-100'), n: 1 },
      { card: card('OP01-101'), n: 4 },
    ];
    const p = rules.problems(lines, { id: 'd', name: 'x', cards: {}, created: 0, commander: leader.id });
    expect(p.some((x) => x.startsWith('Maar één leider'))).toBe(true);
    expect(p.some((x) => x.startsWith('Niet in de kleuren') && x.includes('Green Pirate 1'))).toBe(true);
    expect(rules.problems(lines.slice(2), { id: 'd', name: 'x', cards: {}, created: 0 })[0]).toContain('Kies een leider');
  });

  it('reads a list by card number', () => {
    const { lines, unknown } = parseDeckList('1xOP01-000\n4xOP01-001\n4 Red Pirate 2\n2xOP99-999', {});
    expect(lines.map((l) => [l.card.key, l.n])).toEqual([
      ['one-piece:OP01-000', 1],
      ['one-piece:OP01-001', 4],
      ['one-piece:OP01-002', 4],
    ]);
    expect(unknown).toEqual(['2xOP99-999']);
  });
});
