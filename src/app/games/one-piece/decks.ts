import { CARDS, TYPES } from '../../core/data';
import type { Deck, DeckAnalysis, DeckLine, DeckRules, GenerateOptions } from '../../core/decks';

/**
 * One Piece's deck rules: one leader and exactly 50 other cards, at most 4 of a card number (every print of it,
 * parallels too, counts as that number), no other leaders, and every card in the leader's colours. The leader is the
 * deck's "commander" (the crown on the deck screen); it is a line of the deck but not one of the 50.
 */

const SIZE = 50;
/** Copies are counted per card number: OP01-120 and its parallels are one card. */
const nameOf = (c: any) => c.code;
const label = (c: any) => `${c.names.EN} (${c.code})`;
const isLeader = (c: any) => c.cardType === 'Leader';
const copies = (lines: DeckLine[], f: (c: any) => boolean) => lines.reduce((a, l) => a + (f(l.card) ? l.n : 0), 0);
const colourName = (k: string) => TYPES[k]?.[0] || k;
const text = (c: any) => c.text?.EN || '';
/** A keyword in brackets on the card: [Rush], [Blocker], [Trigger]… */
const has = (c: any, k: string) => text(c).includes(`[${k}]`);
const list = (names: string[]) => names.slice(0, 3).join(', ') + (names.length > 3 ? ` en ${names.length - 3} meer` : '');

function problems(lines: DeckLine[], deck?: Deck): string[] {
  const out: string[] = [];
  const leader = deck?.commander != null ? CARDS[deck.commander] : null;
  const main = lines.filter((l) => l.card !== leader || l.n > 1).map((l) => (l.card === leader ? { ...l, n: l.n - 1 } : l));
  const total = main.reduce((a, l) => a + l.n, 0);
  if (!leader) out.push('Kies een leider: tik op het kroontje bij een leiderkaart.');
  else if (!isLeader(leader)) out.push(`${label(leader)} is geen leiderkaart.`);
  if (total !== SIZE) out.push(total < SIZE ? `Nog ${SIZE - total} kaarten nodig: een deck heeft er precies ${SIZE}, plus de leider.` : `${total} kaarten: een deck heeft er precies ${SIZE}, plus de leider.`);
  const leaders = main.filter((l) => isLeader(l.card)).map((l) => label(l.card));
  if (leaders.length) out.push(`Maar één leider per deck; haal weg: ${list(leaders)}.`);
  const byCode = new Map<string, { n: number; card: any }>();
  for (const l of main) {
    const x = byCode.get(nameOf(l.card)) || { n: 0, card: l.card };
    byCode.set(nameOf(l.card), { n: x.n + l.n, card: l.card });
  }
  for (const { n, card } of byCode.values()) if (n > 4) out.push(`${n}× ${label(card)}: maximaal 4 van elk kaartnummer.`);
  if (leader && isLeader(leader)) {
    const outside = main.filter((l) => !isLeader(l.card) && !l.card.colours.some((c: string) => leader.colours.includes(c))).map((l) => label(l.card));
    if (outside.length) out.push(`Niet in de kleuren van ${leader.names.EN}: ${list(outside)}.`);
  }
  return out;
}

function analyze(lines: DeckLine[], deck?: Deck): DeckAnalysis {
  const leader = deck?.commander != null ? CARDS[deck.commander] : lines.find((l) => isLeader(l.card))?.card;
  const main = lines.filter((l) => !isLeader(l.card));
  const n = main.reduce((a, l) => a + l.n, 0) || 1;
  const curve = Array.from({ length: 7 }, (_, i) => copies(main, (c) => Math.min(7, Math.max(1, c.cost ?? 0)) === i + 1));
  const avg = main.reduce((a, l) => a + (l.card.cost ?? 0) * l.n, 0) / n;
  const share = (f: (c: any) => boolean) => copies(main, f) / n;
  const characters = share((c) => c.cardType === 'Character');
  const events = share((c) => c.cardType === 'Event');
  const ko = share((c) => /K\.O\./.test(text(c)) || /return .* to the owner's hand/i.test(text(c)));
  const colours = leader ? leader.colours : [...new Set(main.flatMap((l) => l.card.colours))];

  const scores: [string, number, string][] = [
    ['Aggro', share((c) => (c.cost ?? 0) <= 3) * 1.5 + share((c) => has(c, 'Rush') || has(c, 'Double Attack')) * 3 + (avg < 3.6 ? 0.5 : 0), 'Veel goedkope personages en Rush om vroeg de leider van je tegenstander aan te vallen.'],
    ['Control', events * 2 + ko * 2 + share((c) => (c.cost ?? 0) >= 7) + share((c) => has(c, 'Blocker')), 'Blockers, K.O.-effecten en events om alles van de tegenstander weg te halen en laat te winnen.'],
    ['Ramp', share((c) => (c.cost ?? 0) >= 8) * 3 + share((c) => /DON!! card from your DON!! deck/i.test(text(c))) * 3, 'Extra DON!! om sneller je dure kaarten te kunnen spelen.'],
  ];
  scores.sort((a, b) => b[1] - a[1]);
  const [style, score, why] = scores[0];
  const midrange = score < 1 || scores[1][1] > score * 0.88;
  const counters = copies(main, (c) => (c.counter ?? 0) > 0);
  const counterEvents = copies(main, (c) => c.cardType === 'Event' && /\[Counter\]/.test(text(c)));
  return {
    playstyle: midrange ? 'Midrange' : style,
    explanation: midrange ? 'Een gebalanceerd deck: sterke personages op elk moment van het spel en genoeg verdediging.' : why,
    curve,
    facts: [
      { label: 'Leider', value: leader ? `${leader.names.EN} · leven ${leader.life ?? '–'}` : '–' },
      { label: 'Kleuren', value: colours.map(colourName).join(' / ') || '–' },
      { label: 'Gemiddelde kosten', value: avg.toFixed(1) },
      { label: 'Personages · events · stages', value: `${copies(main, (c) => c.cardType === 'Character')} · ${copies(main, (c) => c.cardType === 'Event')} · ${copies(main, (c) => c.cardType === 'Stage')}` },
      { label: 'Counter', value: `${counters} kaarten met counter${counterEvents ? ` · ${counterEvents} counter-events` : ''}` + (counters + counterEvents < 30 && characters > 0 ? ' · weinig verdediging' : '') },
      { label: 'Trigger · Blocker', value: `${copies(main, (c) => has(c, 'Trigger'))} · ${copies(main, (c) => has(c, 'Blocker'))}` },
    ],
  };
}

/** Personages per style in 50 cards (the rest are events and a stage or two). */
const CHARACTERS: Record<string, number> = { aggro: 40, midrange: 36, control: 30 };
/** Cards per cost 1…7+ the generator aims for, as a share. */
const CURVE: Record<string, number[]> = {
  aggro: [0.22, 0.24, 0.2, 0.16, 0.1, 0.06, 0.02],
  midrange: [0.16, 0.2, 0.18, 0.18, 0.14, 0.08, 0.06],
  control: [0.12, 0.18, 0.16, 0.16, 0.14, 0.12, 0.12],
};

/**
 * How much a card is played, roughly: what its most expensive print costs (cards that are played a lot are worth
 * more), with a bonus for sharing a type with the leader (Straw Hat Crew, Navy…), which is what most effects ask for.
 */
function quality(c: any, top: Map<string, number>, leader: any): number {
  const price = Math.log10((top.get(nameOf(c)) ?? 0) + 1);
  const synergy = leader && (c.subtypes || []).some((t: string) => (leader.subtypes || []).includes(t)) ? 0.6 : 0;
  return price + synergy + ((c.counter ?? 0) >= 1000 ? 0.1 : 0);
}

function generate(o: GenerateOptions): DeckLine[] & { commander?: any } {
  const top = new Map<string, number>();
  for (const c of CARDS) if (c.trend != null) top.set(nameOf(c), Math.max(top.get(nameOf(c)) ?? 0, c.trend));
  // One print per card number: the regular one, else the cheapest.
  const byCode = new Map<string, any>();
  for (const c of CARDS) {
    const prev = byCode.get(nameOf(c));
    if (!prev || (prev.variant !== 'regular' && c.variant === 'regular') || (prev.variant === c.variant && (c.trend ?? Infinity) < (prev.trend ?? Infinity))) byCode.set(nameOf(c), c);
  }
  // The leader: the most played one with exactly these colours (one you have, with only your own cards).
  const leader = [...byCode.values()]
    .filter((c) => isLeader(c) && c.colours.length === o.types.length && o.types.every((t) => c.colours.includes(t)) && (!o.ownedOnly || o.owned(c) > 0))
    .sort((a, b) => quality(b, top, null) - quality(a, top, null))[0];
  const colours = leader ? leader.colours : o.types;
  const pool = [...byCode.values()]
    .filter((c) => !isLeader(c) && c.colours.some((x: string) => colours.includes(x)) && c.colours.every((x: string) => colours.includes(x)))
    .sort((a, b) => quality(b, top, leader) - quality(a, top, leader));
  const maxOf = (c: any) => Math.min(4, o.ownedOnly ? o.owned(c) : 4);
  const taken = new Map<any, number>();
  let total = 0;
  const take = (c: any, n: number) => {
    const k = Math.min(n, maxOf(c) - (taken.get(c) || 0), SIZE - total);
    if (k > 0) {
      taken.set(c, (taken.get(c) || 0) + k);
      total += k;
    }
  };
  const characterTarget = CHARACTERS[o.style] ?? CHARACTERS['midrange'];
  const curve = CURVE[o.style] || CURVE['midrange'];
  // Personages along the curve, then events; a stage only when there is room left.
  curve.forEach((share, i) => {
    let want = Math.round(share * characterTarget);
    for (const c of pool) {
      if (want <= 0) break;
      if (c.cardType !== 'Character' || Math.min(7, Math.max(1, c.cost ?? 0)) !== i + 1) continue;
      const before = total;
      take(c, Math.min(4, want));
      want -= total - before;
    }
  });
  for (const c of pool) if (c.cardType === 'Event' && total < SIZE) take(c, Math.min(4, SIZE - total));
  for (const c of pool) if (total < SIZE) take(c, Math.min(4, SIZE - total));

  const result = [...taken].map(([card, n]) => ({ card, n })) as DeckLine[] & { commander?: any };
  if (leader) {
    result.unshift({ card: leader, n: 1 });
    result.commander = leader;
  }
  return result;
}

export const rules: DeckRules = {
  size: SIZE + 1,
  maxCopies: 4,
  maxTypes: 2,
  sizeFor: () => SIZE + 1,
  curveLabel: 'kosten',
  commanderLabel: 'leider',
  // By card number, as the simulators (OPTCGSim) and deck sites write it.
  listLine: (l) => `${l.n}x${l.card.code}`,
  hasCommander: () => true,
  canCommand: isLeader,
  nameOf,
  problems,
  analyze,
  styles: [
    ['aggro', 'Aggro · snel aanvallen'],
    ['midrange', 'Midrange · gebalanceerd'],
    ['control', 'Control · blockers en K.O.'],
  ],
  generate,
};
