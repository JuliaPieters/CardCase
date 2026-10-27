import { CARDS, TYPES } from '../../core/data';
import type { Deck, DeckAnalysis, DeckLine, DeckRules, GenerateOptions } from '../../core/decks';

/**
 * Magic's deck rules per format. Constructed formats: at least 60 cards, at most 4 of a card except basic lands (and
 * cards that say a deck can have any number), only cards legal in the format. Commander: exactly 100 cards including
 * the commander, one of each card except basic lands, a legendary creature as commander, every card within its colour
 * identity.
 */

const FORMATS: [string, string][] = [
  ['standard', 'Standard'],
  ['pioneer', 'Pioneer'],
  ['modern', 'Modern'],
  ['pauper', 'Pauper'],
  ['legacy', 'Legacy'],
  ['vintage', 'Vintage'],
  ['commander', 'Commander'],
];
const BASICS: Record<string, string> = { white: 'Plains', blue: 'Island', black: 'Swamp', red: 'Mountain', green: 'Forest' };

const nameOf = (c: any) => c.names.EN;
const isLand = (c: any) => c.cardType === 'Land';
const isCommanderFormat = (f?: string) => f === 'commander';
const formatName = (f?: string) => FORMATS.find(([k]) => k === f)?.[1] || f || '';
const copies = (lines: DeckLine[], f: (c: any) => boolean) => lines.reduce((a, l) => a + (f(l.card) ? l.n : 0), 0);
const colourName = (k: string) => TYPES[k]?.[0] || k;
const unlimited = (c: any) => c.basicLand || c.anyNumber;

function problems(lines: DeckLine[], deck?: Deck): string[] {
  const out: string[] = [];
  const format = deck?.format || 'standard';
  const total = lines.reduce((a, l) => a + l.n, 0);
  const commander = deck?.commander != null ? CARDS[deck.commander] : null;
  if (isCommanderFormat(format)) {
    if (total !== 100) out.push(`${total} kaarten: een Commander-deck heeft er precies 100, met de commander erbij.`);
    if (!commander) out.push('Kies een commander: tik op het kroontje bij een legendary creature.');
    else if (!canCommand(commander)) out.push(`${nameOf(commander)} kan geen commander zijn: dat moet een legendary creature zijn.`);
  } else if (total < 60) out.push(`Nog ${60 - total} kaarten nodig: een deck heeft er minimaal 60.`);
  const limit = isCommanderFormat(format) ? 1 : 4;
  const byName = new Map<string, { n: number; card: any }>();
  for (const l of lines) {
    const x = byName.get(nameOf(l.card)) || { n: 0, card: l.card };
    byName.set(nameOf(l.card), { n: x.n + l.n, card: l.card });
  }
  for (const [name, { n, card }] of byName) if (n > limit && !unlimited(card)) out.push(`${n}× ${name}: maximaal ${limit} in ${formatName(format)}.`);
  const illegal = lines.filter((l) => !l.card.legal?.[format]).map((l) => nameOf(l.card));
  if (illegal.length) out.push(`Niet legaal in ${formatName(format)}: ${illegal.slice(0, 3).join(', ')}${illegal.length > 3 ? ` en ${illegal.length - 3} meer` : ''}.`);
  if (commander) {
    const outside = lines.filter((l) => l.card.identity.some((c: string) => !commander.identity.includes(c))).map((l) => nameOf(l.card));
    if (outside.length) out.push(`Buiten de kleuren van ${nameOf(commander)}: ${outside.slice(0, 3).join(', ')}${outside.length > 3 ? ` en ${outside.length - 3} meer` : ''}.`);
  }
  return out;
}

const canCommand = (c: any) => /Legendary/.test(c.typeLine) && (/Creature/.test(c.typeLine) || /can be your commander/i.test(c.typeLine));

function analyze(lines: DeckLine[], deck?: Deck): DeckAnalysis {
  const total = lines.reduce((a, l) => a + l.n, 0) || 1;
  const spells = lines.filter((l) => !isLand(l.card));
  const spellN = spells.reduce((a, l) => a + l.n, 0) || 1;
  const curve = Array.from({ length: 7 }, (_, i) => copies(spells, (c) => Math.min(7, Math.max(1, Math.floor(c.cmc))) === i + 1));
  const avg = spells.reduce((a, l) => a + l.card.cmc * l.n, 0) / spellN;
  const lands = copies(lines, isLand);
  const share = (f: (c: any) => boolean) => copies(spells, f) / spellN;
  const kw = (k: string) => share((c) => c.keywords?.includes(k));
  const creatures = share((c) => c.cardType === 'Creature');
  const spellsShare = share((c) => c.cardType === 'Instant' || c.cardType === 'Sorcery');
  const colours = [...new Set(lines.flatMap((l) => l.card.colours))];

  const scores: [string, number, string][] = [
    ['Aggro', share((c) => c.cmc <= 2) * 1.6 + creatures + kw('Haste') * 3 + (avg < 2.6 ? 0.5 : 0), 'Veel goedkope wezens om snel aan te vallen voordat de tegenstander op gang komt.'],
    ['Control', spellsShare * 2 + kw('Flash') * 2 + share((c) => c.cmc >= 5) + (creatures < 0.3 ? 0.4 : 0), 'Instants, sorceries en antwoorden om alles van de tegenstander te stoppen en laat te winnen.'],
    ['Tempo', kw('Flying') * 1.5 + kw('Flash') * 2 + share((c) => c.cmc <= 3) * 0.8, 'Goedkope vliegende wezens en flash om voor te blijven en de tegenstander uit balans te houden.'],
    ['Ramp', share((c) => c.cmc >= 6) * 2.5 + (colours.includes('green') ? 0.3 : 0) + (lands / total > 0.42 ? 0.4 : 0), 'Extra mana om snel grote kaarten op tafel te krijgen.'],
  ];
  scores.sort((a, b) => b[1] - a[1]);
  const [style, score, why] = scores[0];
  const midrange = score < 1 || scores[1][1] > score * 0.88;
  const landTarget = isCommanderFormat(deck?.format) ? 37 : 24;
  return {
    playstyle: midrange ? 'Midrange' : style,
    explanation: midrange ? 'Een gebalanceerd deck: sterke wezens op elk moment van het spel en genoeg antwoorden.' : why,
    curve,
    facts: [
      { label: 'Kleuren', value: colours.map(colourName).join(' / ') || 'Kleurloos' },
      { label: 'Lands', value: `${lands}` + (lands < landTarget - 3 ? ` · weinig (± ${landTarget} is gebruikelijk)` : lands > landTarget + 4 ? ' · veel' : '') },
      { label: 'Gemiddelde mana value', value: avg.toFixed(1) },
      { label: 'Wezens · instants/sorceries · overig', value: `${copies(spells, (c) => c.cardType === 'Creature')} · ${copies(spells, (c) => c.cardType === 'Instant' || c.cardType === 'Sorcery')} · ${copies(spells, (c) => !['Creature', 'Instant', 'Sorcery'].includes(c.cardType))}` },
      {
        label: 'Keywords',
        value:
          ['Flying', 'Haste', 'Trample', 'Lifelink', 'Deathtouch', 'Flash', 'Vigilance', 'First strike', 'Menace', 'Ward']
            .map((k) => [k, copies(spells, (c) => c.keywords?.includes(k))] as [string, number])
            .filter(([, n]) => n)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([k, n]) => `${k} ${n}`)
            .join(' · ') || '–',
      },
    ],
  };
}

/** Creatures per style in a 60-card deck (the rest of the 36 spells are other cards). */
const CREATURES: Record<string, number> = { aggro: 24, midrange: 18, control: 8 };
/** Spells per mana value 1…6+ the generator aims for, as a share. */
const CURVE: Record<string, number[]> = {
  aggro: [0.25, 0.35, 0.25, 0.1, 0.05, 0],
  midrange: [0.12, 0.28, 0.27, 0.18, 0.1, 0.05],
  control: [0.1, 0.25, 0.25, 0.18, 0.12, 0.1],
};

/** How good a card is, roughly: how much it is played (EDHREC rank). */
const quality = (c: any) => (c.rank ? 1 / Math.log10(c.rank + 10) : 0.15);

function generate(o: GenerateOptions): DeckLine[] & { commander?: any } {
  const format = o.format || 'standard';
  const commanderFormat = isCommanderFormat(format);
  const allowed = (c: any) => c.legal?.[format] && c.identity.every((x: string) => o.types.includes(x));
  // One printing per card: the regular one, else the cheapest.
  const byName = new Map<string, any>();
  for (const c of CARDS) {
    if (!allowed(c)) continue;
    const prev = byName.get(nameOf(c));
    if (!prev || (prev.variant !== 'regular' && c.variant === 'regular') || (prev.variant === c.variant && (c.trend ?? Infinity) < (prev.trend ?? Infinity))) byName.set(nameOf(c), c);
  }
  const maxOf = (c: any) => (o.ownedOnly ? Math.min(commanderFormat ? 1 : 4, o.owned(c)) : commanderFormat ? 1 : 4);
  const taken = new Map<any, number>();
  const take = (c: any, n: number) => {
    const k = Math.min(n, maxOf(c) - (taken.get(c) || 0));
    if (k > 0) taken.set(c, (taken.get(c) || 0) + k);
    return Math.max(0, k);
  };
  const sizeAll = commanderFormat ? 99 : 60;
  const landN = commanderFormat ? 37 : 24;

  // Commander: the most played legendary creature with exactly these colours.
  let commander: any = null;
  if (commanderFormat) {
    commander = [...byName.values()]
      .filter((c) => canCommand(c) && c.identity.length === o.types.length && (!o.ownedOnly || o.owned(c) > 0))
      .sort((a, b) => quality(b) - quality(a))[0];
  }

  const spells = [...byName.values()].filter((c) => !isLand(c) && c !== commander).sort((a, b) => quality(b) - quality(a));
  const spellTarget = sizeAll - landN;
  const creatureTarget = Math.round(((CREATURES[o.style] ?? CREATURES['midrange']) / 36) * spellTarget);
  const per = commanderFormat ? 1 : 4;
  let spellN = 0;
  const curve = CURVE[o.style] || CURVE['midrange'];
  // Creatures and other spells, each along the curve.
  for (const [pick, target] of [
    [(c: any) => c.cardType === 'Creature', creatureTarget],
    [(c: any) => c.cardType !== 'Creature', spellTarget - creatureTarget],
  ] as [(c: any) => boolean, number][]) {
    curve.forEach((share, i) => {
      // Rounding per mana value must not go past the total.
      let want = Math.min(Math.round(share * target), spellTarget - spellN);
      for (const c of spells) {
        if (want <= 0) break;
        if (!pick(c) || Math.min(6, Math.max(1, Math.floor(c.cmc))) !== i + 1) continue;
        const n = take(c, Math.min(per, want));
        want -= n;
        spellN += n;
      }
    });
  }
  for (const c of spells) if (spellN < spellTarget) spellN += take(c, Math.min(per, spellTarget - spellN));

  // Lands: a few of the most played non-basic lands in these colours, then basics split by colour.
  let lands = 0;
  const nonBasic = [...byName.values()].filter((c) => isLand(c) && !c.basicLand && c.identity.length > 0 && c.identity.length <= o.types.length).sort((a, b) => quality(b) - quality(a));
  const nonBasicTarget = o.types.length > 1 ? (commanderFormat ? 10 : 8) : commanderFormat ? 4 : 0;
  for (const c of nonBasic) if (lands < nonBasicTarget) lands += take(c, Math.min(per, nonBasicTarget - lands));
  const colours = o.types.filter((t) => BASICS[t]);
  const basics = colours.map((t) => CARDS.find((c) => c.basicLand && nameOf(c) === BASICS[t] && c.variant === 'regular')).filter(Boolean);
  basics.forEach((b, i) => {
    const n = Math.round((landN - lands) / (basics.length - i));
    // Basic lands are unlimited, also with only your own cards.
    taken.set(b, (taken.get(b) || 0) + n);
    lands += n;
  });
  const result = [...taken].map(([card, n]) => ({ card, n })) as DeckLine[] & { commander?: any };
  if (commander) {
    result.unshift({ card: commander, n: 1 });
    result.commander = commander;
  }
  return result;
}

export const rules: DeckRules = {
  size: 60,
  maxCopies: 4,
  maxTypes: 5,
  formats: FORMATS,
  sizeFor: (f) => (isCommanderFormat(f) ? 100 : 60),
  hasCommander: isCommanderFormat,
  canCommand,
  nameOf,
  problems,
  analyze,
  styles: [
    ['aggro', 'Aggro · snel aanvallen'],
    ['midrange', 'Midrange · gebalanceerd'],
    ['control', 'Control · antwoorden en laat winnen'],
  ],
  generate,
};
