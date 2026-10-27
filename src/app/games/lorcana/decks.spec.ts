import { applyGameConfig, setCatalog } from '../../core/data';
import { parseDeckList } from '../../core/decks';
import { buildCatalog } from './catalog';
import { config } from './config';
import { rules } from './decks';

/** A small Lorcana catalog: 40 characters per ink over the costs, in three inks. */
function catalog() {
  const inks = ['Amber', 'Steel', 'Ruby'];
  const cards = inks.flatMap((ink, j) =>
    Array.from({ length: 40 }, (_, i) => ({
      k: `1-${j * 40 + i + 1}`,
      s: '1',
      n: String(j * 40 + i + 1),
      id: j * 40 + i + 1,
      ink: [ink],
      t: i % 5 === 4 ? 'Action' : 'Character',
      sub: [],
      c: (i % 7) + 1,
      iw: i % 4 ? 1 : 0,
      l: (i % 3) + 1,
      st: 2,
      w: 3,
      mv: null,
      r: 'Common',
      story: 'Frozen',
      art: [],
      foil: ['None', 'Silver'],
      cm: null,
      base: null,
      kw: i % 6 === 0 ? ['Evasive'] : [],
      core: 1,
      i18n: { EN: [`${ink} Hero ${i + 1}`, 'Brave', '', '', ''] },
    })),
  );
  return { imageBase: '', langs: ['EN'], sets: [{ code: '1', name: 'The First Chapter', type: 'expansion', released: '2023-09-01', total: 204 }], cards };
}

describe('Lorcana decks', () => {
  beforeEach(() => {
    applyGameConfig(config);
    const { sets, cards } = buildCatalog(catalog());
    setCatalog(sets, cards);
  });

  it('generates a legal deck of one or two inks', () => {
    const lines = rules.generate({ types: ['amber', 'steel'], ownedOnly: false, currentFormat: true, style: 'midrange', owned: () => 0 });
    expect(lines.reduce((a, l) => a + l.n, 0)).toBe(60);
    expect(lines.every((l) => l.n <= 4)).toBe(true);
    expect(lines.every((l) => ['amber', 'steel'].includes(l.card.type))).toBe(true);
    expect(rules.problems(lines)).toEqual([]);
    expect(rules.analyze(lines).playstyle).toBeTruthy();
  });

  it('builds only from your own cards when asked', () => {
    const lines = rules.generate({ types: ['ruby'], ownedOnly: true, currentFormat: false, style: 'aggro', owned: (c) => (c.names.EN.endsWith('Hero 1 – Brave') ? 2 : 0) });
    expect(lines).toEqual([{ card: expect.anything(), n: 2 }]);
  });

  it('names what makes a deck illegal', () => {
    const three = rules.generate({ types: ['amber', 'steel'], ownedOnly: false, currentFormat: true, style: 'aggro', owned: () => 0 }).slice(0, 3);
    const ruby = rules.generate({ types: ['ruby'], ownedOnly: false, currentFormat: true, style: 'aggro', owned: () => 0 })[0];
    const lines = [...three, { card: ruby.card, n: 6 }];
    const p = rules.problems(lines);
    expect(p.some((x) => x.includes('minimaal 60'))).toBe(true);
    expect(p.some((x) => x.includes('maximaal 4'))).toBe(true);
    expect(p.some((x) => x.includes('maximaal 2'))).toBe(true);
  });

  it('reads a pasted deck list', () => {
    const { lines, unknown } = parseDeckList('4 Amber Hero 1 - Brave\n2x Steel Hero 3 - Brave\n// comment\n1 Mickey - Unknown', []);
    expect(lines.map((l) => [l.card.names.EN, l.n])).toEqual([
      ['Amber Hero 1 – Brave', 4],
      ['Steel Hero 3 – Brave', 2],
    ]);
    expect(unknown).toEqual(['1 Mickey - Unknown']);
  });
});
