import { CARDS, TYPES } from '../../core/data';
import type { DeckAnalysis, DeckLine, DeckRules, GenerateOptions } from '../../core/decks';

/**
 * Lorcana's deck rules: at least 60 cards, at most 4 copies of a card (by its full name, all printings together), one
 * or two inks. The analysis reads the cost curve, inkable share, lore and keywords; the generator builds a deck along
 * a curve for a play style.
 */

const nameOf = (c: any) => c.names.EN;
const inksOf = (lines: DeckLine[]) => [...new Set(lines.flatMap((l) => l.card.inks.filter((i: string) => i !== 'none')))];
const inkName = (i: string) => TYPES[i]?.[0] || i;
const copies = (lines: DeckLine[], f: (c: any) => boolean) => lines.reduce((a, l) => a + (f(l.card) ? l.n : 0), 0);

function problems(lines: DeckLine[]): string[] {
  const out: string[] = [];
  const total = lines.reduce((a, l) => a + l.n, 0);
  if (total < 60) out.push(`Nog ${60 - total} kaarten nodig: een deck heeft er minimaal 60.`);
  const byName = new Map<string, number>();
  for (const l of lines) byName.set(nameOf(l.card), (byName.get(nameOf(l.card)) || 0) + l.n);
  for (const [name, n] of byName) if (n > 4) out.push(`${n}× ${name}: maximaal 4 van dezelfde kaart.`);
  const inks = inksOf(lines);
  if (inks.length > 2) out.push(`${inks.length} inkkleuren (${inks.map(inkName).join(', ')}): maximaal 2.`);
  return out;
}

function analyze(lines: DeckLine[]): DeckAnalysis {
  const total = lines.reduce((a, l) => a + l.n, 0) || 1;
  const curve = Array.from({ length: 7 }, (_, i) => copies(lines, (c) => Math.min(7, Math.max(1, c.cost ?? 0)) === i + 1));
  const avgCost = lines.reduce((a, l) => a + (l.card.cost ?? 0) * l.n, 0) / total;
  const share = (f: (c: any) => boolean) => copies(lines, f) / total;
  const kw = (k: string) => share((c) => c.keywords?.includes(k));
  const chars = lines.filter((l) => l.card.cardType === 'Character');
  const charN = chars.reduce((a, l) => a + l.n, 0) || 1;
  const avgLore = chars.reduce((a, l) => a + (l.card.lore ?? 0) * l.n, 0) / charN;
  const inkable = share((c) => c.inkwell);
  const actions = share((c) => c.cardType === 'Action' || c.cardType === 'Song');
  const items = share((c) => c.cardType === 'Item' || c.cardType === 'Location');

  // Each style scores how much of the deck points its way; the highest wins.
  const scores: [string, number, string][] = [
    ['Aggro', share((c) => (c.cost ?? 0) <= 2) * 2 + kw('Rush') * 3 + kw('Reckless') * 3 + (avgCost < 3 ? 0.6 : 0), 'Veel goedkope personages om vroeg te questen en de tegenstander onder druk te zetten.'],
    ['Questing', (avgLore - 1) * 0.9 + kw('Evasive') * 2.5 + kw('Ward') * 1.5, 'Personages met veel lore, vaak Evasive of met Ward, om zo snel mogelijk 20 lore te halen.'],
    ['Control', actions * 2.5 + share((c) => (c.cost ?? 0) >= 5) * 1.5 + kw('Bodyguard') * 2 + kw('Challenger') * 2 + kw('Resist'), 'Acties, liedjes en sterke verdedigers om het bord te beheersen en later te winnen met grote kaarten.'],
    ['Shift', kw('Shift') * 4 + kw('Boost') * 2, 'Speelt goedkope versies van personages om ze later te shiften naar sterkere versies.'],
    ['Ramp', items * 3 + share((c) => (c.cost ?? 0) >= 7) * 3, 'Items en locaties om sneller inkt op te bouwen voor dure kaarten.'],
  ];
  scores.sort((a, b) => b[1] - a[1]);
  const [style, score, why] = scores[0];
  // No style stands out: a bit of everything.
  const midrange = score < 0.9 || scores[1][1] > score * 0.85;
  const playstyle = midrange ? 'Midrange' : style;
  const explanation = midrange ? 'Een gebalanceerd deck: een gelijkmatige curve, personages om te questen en antwoorden voor wat de tegenstander speelt.' : why;

  const inks = inksOf(lines);
  const topKw = ['Rush', 'Evasive', 'Bodyguard', 'Challenger', 'Ward', 'Resist', 'Shift', 'Singer', 'Support', 'Boost', 'Reckless']
    .map((k) => [k, copies(lines, (c) => c.keywords?.includes(k))] as [string, number])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  return {
    playstyle,
    explanation,
    curve,
    facts: [
      { label: 'Inkkleuren', value: inks.map(inkName).join(' / ') || '–' },
      { label: 'Gemiddelde kosten', value: avgCost.toFixed(1) },
      { label: 'Inkwell', value: Math.round(inkable * 100) + '%' + (inkable < 0.6 ? ' · weinig, kans op te weinig inkt' : '') },
      { label: 'Lore per personage', value: avgLore.toFixed(1) },
      { label: 'Personages · acties/liedjes · items/locaties', value: `${copies(lines, (c) => c.cardType === 'Character')} · ${copies(lines, (c) => c.cardType === 'Action' || c.cardType === 'Song')} · ${copies(lines, (c) => c.cardType === 'Item' || c.cardType === 'Location')}` },
      { label: 'Keywords', value: topKw.map(([k, n]) => `${k} ${n}`).join(' · ') || '–' },
    ],
  };
}

/** Copies per cost 1…7+ the generator aims for, per style (60 in total). */
const CURVES: Record<string, number[]> = {
  aggro: [8, 16, 14, 10, 6, 4, 2],
  midrange: [4, 12, 14, 12, 8, 6, 4],
  control: [4, 10, 12, 12, 10, 7, 5],
};

/** Actions, songs and items per style. */
const OTHER_CARDS: Record<string, number> = { aggro: 8, midrange: 14, control: 20 };

const KW_VALUE: Record<string, number> = { Evasive: 0.8, Rush: 0.6, Ward: 0.6, Bodyguard: 0.5, Challenger: 0.5, Resist: 0.5, Support: 0.4, Singer: 0.3, Shift: 0.3, Boost: 0.3 };

/** How good a card is for its cost, roughly; the style tips the scale. */
function score(c: any, style: string): number {
  const cost = Math.max(1, c.cost ?? 1);
  const kw = (c.keywords || []).reduce((a: number, k: string) => a + (KW_VALUE[k] || 0), 0);
  let v: number;
  if (c.cardType === 'Character') v = ((c.lore ?? 0) * 1.6 + (c.strength ?? 0) * 0.5 + (c.willpower ?? 0) * 0.5 + kw) / cost;
  else v = (1.4 + kw) / Math.sqrt(cost) + (c.cardType === 'Song' ? 0.25 : 0);
  if (style === 'aggro' && c.cardType === 'Character') v *= 1 + (c.keywords?.includes('Rush') ? 0.3 : 0) + (cost <= 2 ? 0.2 : 0);
  if (style === 'control' && c.cardType !== 'Character') v *= 1.3;
  // Inkable cards keep the inkwell going.
  return c.inkwell ? v * 1.25 : v;
}

function generate(o: GenerateOptions): DeckLine[] {
  const curve = CURVES[o.style] || CURVES['midrange'];
  // One printing per card name: the regular one, else the cheapest.
  const byName = new Map<string, any>();
  for (const c of CARDS) {
    if (!c.inks.length || c.inks.some((i: string) => !o.types.includes(i))) continue;
    if (o.currentFormat && !c.core) continue;
    const prev = byName.get(nameOf(c));
    const better = !prev || (prev.variant !== 'regular' && c.variant === 'regular') || (prev.variant === c.variant && (c.trend ?? Infinity) < (prev.trend ?? Infinity));
    if (better) byName.set(nameOf(c), c);
  }
  const pool = [...byName.values()]
    .map((c) => ({ c, s: score(c, o.style), max: o.ownedOnly ? Math.min(4, o.owned(c)) : 4 }))
    .filter((p) => p.max > 0)
    .sort((a, b) => b.s - a.s);
  const taken = new Map<any, number>();
  let total = 0;
  const take = (p: { c: any; max: number }, want: number) => {
    const n = Math.min(p.max - (taken.get(p.c) || 0), want, 60 - total);
    if (n <= 0) return 0;
    taken.set(p.c, (taken.get(p.c) || 0) + n);
    total += n;
    return n;
  };
  // Actions, songs and items get their share first (decks without any lack answers), the best of them.
  const others = pool.filter((p) => p.c.cardType !== 'Character' && (p.c.cost ?? 0) <= 6);
  const otherTarget = OTHER_CARDS[o.style] ?? OTHER_CARDS['midrange'];
  // Spread over the costs (at most 6 copies per cost), so the cheap ones don't take over the curve.
  const perCost = new Map<number, number>();
  for (const p of others) {
    if (total >= otherTarget) break;
    const cost = Math.max(1, p.c.cost ?? 1);
    const n = take(p, Math.min(4, otherTarget - total, 6 - (perCost.get(cost) || 0)));
    perCost.set(cost, (perCost.get(cost) || 0) + n);
  }
  // Then characters along the curve, scaled to the room that is left.
  const room = (60 - total) / 60;
  const chars = pool.filter((p) => p.c.cardType === 'Character');
  curve.forEach((target, i) => {
    let got = 0;
    const want = Math.round(target * room);
    for (const p of chars) {
      if (got >= want) break;
      if (Math.min(7, Math.max(1, p.c.cost ?? 1)) !== i + 1) continue;
      got += take(p, want - got);
    }
  });
  // Then the best of what's left, until there are 60 (or nothing is left, with your own cards).
  for (const p of pool) if (total < 60) take(p, 4);
  return [...taken].map(([card, n]) => ({ card, n }));
}

export const rules: DeckRules = {
  size: 60,
  maxCopies: 4,
  maxTypes: 2,
  nameOf,
  problems,
  analyze,
  styles: [
    ['aggro', 'Aggro · snel en goedkoop'],
    ['midrange', 'Midrange · gebalanceerd'],
    ['control', 'Control · lang spel'],
  ],
  generate,
};
