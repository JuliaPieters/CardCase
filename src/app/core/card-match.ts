import { CARDS } from './data';

/** One candidate card for scanned text; `conf` is 0–99. */
export interface CardMatch {
  id: number;
  conf: number;
}

export interface MatchOptions {
  /** Card ids that are likely (e.g. the cards in the binder being checked): small boost. */
  prefer?: Set<number>;
  /** The card expected at this spot: bigger boost. */
  expect?: number | null;
  limit?: number;
}

/** A printed collector number such as "025/198" or "TG05/TG30", as read from the bottom of a card. */
export interface PrintedNumber {
  key: string;
  total: number | null;
}

/** A number read from the text, with how much it is trusted (1 = printed with a clear slash). */
interface NumberRead extends PrintedNumber {
  weight: number;
}

interface Index {
  byNum: Map<string, number[]>;
  /** "25/198" → cards with that collector number in a set of that size. */
  byNumTotal: Map<string, number[]>;
  /** Normalized unique names → card ids with that name. */
  names: [string, number[]][];
  size: number;
}

let index: Index | null = null;

/** Builds (once per catalog) the lookup tables used by matchCards. */
function getIndex(): Index {
  if (index && index.size === CARDS.length) return index;
  const byNum = new Map<string, number[]>();
  const byNumTotal = new Map<string, number[]>();
  const names = new Map<string, number[]>();
  const push = (m: Map<string, number[]>, k: string, id: number) => (m.get(k) ?? m.set(k, []).get(k)!).push(id);
  for (const c of CARDS) {
    const key = numKey(localIdOf(c));
    if (key) {
      push(byNum, key, c.id);
      if (totalOf(c) != null) push(byNumTotal, key + '/' + totalOf(c), c.id);
    }
    for (const n of new Set([c.names.EN, c.names.DE])) {
      const k = norm(n);
      if (k.length >= 3) push(names, k, c.id);
    }
  }
  index = { byNum, byNumTotal, names: [...names], size: CARDS.length };
  return index;
}

/**
 * Ranks catalog cards for the text read from a card (or a slot of a binder page).
 * Signals: the collector number and set size printed at the bottom, the name at the top,
 * and optionally which cards are expected (binder plan).
 */
export function matchCards(text: string, opts: MatchOptions = {}): CardMatch[] {
  const idx = getIndex();
  // "Evolves from Kadabra" names the previous stage, not this card.
  const flat = norm(text.replace(/evolves from[^\n]*/gi, ''));
  const nums = readNumbers(text, idx);
  const cand = new Set<number>();

  for (const n of nums) (n.total != null ? idx.byNumTotal.get(n.key + '/' + n.total) : idx.byNum.get(n.key))?.forEach((id) => cand.add(id));
  if (flat.length >= 3) {
    for (const [name, ids] of idx.names) {
      if (name.length < 4 && !flat.includes(name)) continue;
      if (nameSim(name, flat) >= 0.75) ids.forEach((id) => cand.add(id));
    }
  }
  opts.prefer?.forEach((id) => cand.add(id));
  if (opts.expect != null) cand.add(opts.expect);

  const scored: { id: number; score: number; len: number; year: number }[] = [];
  for (const id of cand) {
    const c = CARDS[id];
    if (!c) continue;
    const en = norm(c.names.EN);
    const de = norm(c.names.DE);
    const simEN = nameSim(en, flat);
    const simDE = nameSim(de, flat);
    let score = 0.4 * Math.max(simEN, simDE);
    // "Pikachu ex" beats plain "Pikachu" when both occur in the text.
    const len = simEN >= simDE ? en.length * simEN : de.length * simDE;
    const key = numKey(localIdOf(c));
    let numScore = 0;
    for (const n of nums) {
      if (n.key !== key) continue;
      const total = n.total != null && totalOf(c) === n.total;
      // A number without a readable slash only counts together with a matching set size.
      if (n.weight === 1 || total) numScore = Math.max(numScore, n.weight * (0.35 + (total ? 0.25 : 0)));
    }
    score += numScore;
    if (score < 0.15) continue;
    if (id === opts.expect) score += 0.3;
    else if (opts.prefer?.has(id)) score += 0.15;
    scored.push({ id, score: Math.min(score, 0.99), len, year: c.year || 0 });
  }
  scored.sort((a, b) => b.score - a.score || b.len - a.len || b.year - a.year || a.id - b.id);
  return scored.slice(0, opts.limit ?? 3).map((s) => ({ id: s.id, conf: Math.round(s.score * 100) }));
}

/** Finds a collector number like "025/198", "SV045/SV122" or "TG05/TG30" in OCR text, forgiving common misreads. */
export function parseNumber(text: string): PrintedNumber | null {
  return parseNumbers(text)[0] ?? null;
}

function parseNumbers(text: string): PrintedNumber[] {
  const t = text.toUpperCase().replace(/[⁄∕\\|]/g, '/');
  const re = /([A-Z]{0,4}) ?([0-9OQDSIL]{1,3}) *\/ *[A-Z]{0,4} ?([0-9OQDSIL]{2,3})/g;
  const out: PrintedNumber[] = [];
  for (const m of t.matchAll(re)) {
    // Letters may stand in for misread digits, but not make up a whole number ("RESISTANCE" is not "15").
    if (!/\d/.test(m[2]) || !/\d/.test(m[3])) continue;
    const n = digits(m[2]);
    const total = digits(m[3]);
    if (n == null || total == null || n === 0 || total === 0) continue;
    // Letters right before the digits are part of the number only for known prefixes (TG, GG, SV, SWSH, …), not stray OCR noise.
    const prefix = PREFIXES.has(m[1]) ? m[1] : '';
    out.push({ key: prefix + n, total });
  }
  return out;
}

/**
 * All collector numbers in the text: the ones with a slash, plus digit runs where OCR lost or misread the slash
 * ("20102" → 2/102, "0637, 193" → 063/193). The latter only count when that number/set size exists in the catalog.
 */
function readNumbers(text: string, idx: Index): NumberRead[] {
  const out: NumberRead[] = parseNumbers(text).map((n) => ({ ...n, weight: 1 }));
  // A run starts with a digit and stays on one line, so letters of neighbouring words don't join it.
  for (const tok of text.toUpperCase().match(/\d[\dOIL ,.'’]{2,10}/g) ?? []) {
    const d = tok.replace(/[^0-9OIL]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');
    // Copyright years ("©1999") are on every card.
    if (!/^\d{3,7}$/.test(d) || /^(19|20)\d\d$/.test(d)) continue;
    for (let i = 1; i <= 3 && i < d.length; i++) {
      // Prefer reading the character after the number as the slash (often seen as 1, 7 or 0).
      for (const [skip, weight] of [[1, 0.9], [0, 0.8]]) {
        if (skip && !'170'.includes(d[i])) continue;
        const rest = d.slice(i + skip);
        if (rest.length < 2 || rest.length > 3) continue;
        const key = String(parseInt(d.slice(0, i), 10));
        const total = parseInt(rest, 10);
        if (key !== '0' && total >= 10 && idx.byNumTotal.has(key + '/' + total)) out.push({ key, total, weight });
      }
    }
  }
  return out;
}

const PREFIXES = new Set(['TG', 'GG', 'SV', 'SWSH', 'SM', 'XY', 'BW', 'DP', 'H', 'RC', 'HGSS', 'CC']);

function digits(s: string): number | null {
  const d = s.replace(/[OQD]/g, '0').replace(/[IL]/g, '1').replace(/S/g, '5');
  return /^\d+$/.test(d) ? parseInt(d, 10) : null;
}

function localIdOf(c: any): string {
  return c.localId ?? String(c.num);
}

function totalOf(c: any): number | null {
  if (c.total != null) return c.total;
  const t = parseInt(String(c.numStr ?? '').split('/')[1], 10);
  return Number.isNaN(t) ? null : t;
}

/** "SWSH050" → "SWSH50", "025" → "25"; null for ids without digits. */
function numKey(localId: string): string | null {
  const m = /^([A-Za-z]*)0*(\d+)[a-z]?$/.exec(localId.trim());
  return m ? m[1].toUpperCase() + m[2] : null;
}

/** Lowercase letters and digits only, accents removed. */
export function norm(s: string): string {
  return (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/** How well `name` occurs somewhere in `text` (1 = exact substring), via the fuzzy substring edit distance. */
export function nameSim(name: string, text: string): number {
  const m = name.length;
  // Names in Japanese or Chinese normalize to almost nothing (e.g. just "ex"); those can't be read by this OCR anyway.
  if (m < 3 || !text) return 0;
  if (text.includes(name)) return 1;
  let prev = new Array(text.length + 1).fill(0);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= text.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (name[i - 1] === text[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  const d = Math.min(...prev);
  // Short names need an exact hit: one typo in "Mew" is a different word.
  if (m < 5 && d > 0) return 0;
  return Math.max(0, 1 - d / m);
}
