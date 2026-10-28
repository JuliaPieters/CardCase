/**
 * Importing a collection exported from another app (Collectr, ManaBox, or any CSV/JSON with similar columns): the rows
 * are read, the columns recognised by their names, and each row matched to a card of the active department.
 *
 * A row is matched, in this order, by its Scryfall id (Magic), its set code and number, or its name and number (with
 * the set name to choose between cards of the same name and number, as Collectr only has set names).
 */
import type { Game } from '../games/types';

export type Row = Record<string, string>;

/** Column names as other apps write them (lowercase, letters and digits only) → what they hold. */
const COLUMNS: Record<string, string[]> = {
  name: ['name', 'productname', 'cardname', 'card', 'title'],
  setCode: ['setcode', 'editioncode', 'setid', 'expansioncode'],
  setName: ['setname', 'set', 'edition', 'expansion', 'expansionname'],
  number: ['collectornumber', 'cardnumber', 'number', 'no', 'nr', 'collectorno'],
  qty: ['quantity', 'qty', 'count', 'amount', 'aantal'],
  lang: ['language', 'lang', 'taal'],
  finish: ['foil', 'finish', 'printing', 'variance', 'variant', 'version', 'treatment'],
  scryfallId: ['scryfallid'],
  game: ['category', 'game', 'tcg', 'productline'],
};

const LANGS: Record<string, string> = {
  en: 'EN', english: 'EN', engels: 'EN',
  de: 'DE', german: 'DE', deutsch: 'DE', duits: 'DE',
  fr: 'FR', french: 'FR', francais: 'FR', frans: 'FR',
  it: 'IT', italian: 'IT', italiano: 'IT', italiaans: 'IT',
  es: 'ES', spanish: 'ES', espanol: 'ES', spaans: 'ES',
  ja: 'JA', jp: 'JA', japanese: 'JA', japans: 'JA',
  zh: 'ZH', zhs: 'ZH', zht: 'ZH', chinese: 'ZH', chinesesimplified: 'ZH', chinesetraditional: 'ZH', chinees: 'ZH',
};

const plain = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const key = (s: string) => plain(s).replace(/[^a-z0-9]/g, '');
/** A card name to compare: no accents, punctuation or dashes ("Elsa – Snow Queen" = "Elsa - Snow Queen"). */
export const normName = (s: string) =>
  plain(s)
    .replace(/\([^)]*\)|\[[^\]]*\]/g, ' ')
    .trim()
    .replace(/\s+-\s+[a-z-]*\d+[a-z]*(\/[a-z0-9-]+)?$/, '') // TCGplayer's "Charizard ex - 199/165", "Chespin - 058"
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
/** A card number to compare: the part before "/", no leading zeros ("025/165" = "25"). */
export const normNum = (s: string) => {
  const n = plain(String(s ?? '')).split('/')[0].replace(/[^a-z0-9]/g, '');
  return n.replace(/^0+(?=\d)/, '');
};
const words = (s: string) => new Set(plain(s).split(/[^a-z0-9]+/).filter((w) => w.length > 1 && w !== 'the'));

/** Rows of a CSV (comma, semicolon or tab separated, quoted fields) or JSON file (an array of objects, or { cards: [...] }). */
export function parseFile(text: string): Row[] {
  const t = text.replace(/^﻿/, '').trim();
  if (t.startsWith('[') || t.startsWith('{')) {
    const j = JSON.parse(t);
    const list = Array.isArray(j) ? j : j.cards || j.collection || j.data || Object.values(j).find(Array.isArray) || [];
    return list.filter((x: any) => x && typeof x === 'object').map((x: any) => Object.fromEntries(Object.entries(x).map(([k, v]) => [k, v == null ? '' : String(v)])));
  }
  const first = t.split('\n')[0];
  const sep = [',', ';', '\t'].sort((a, b) => first.split(b).length - first.split(a).length)[0];
  const table: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (quoted) {
      if (ch === '"' && t[i + 1] === '"') (field += '"'), i++;
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) row.push(field), (field = '');
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && t[i + 1] === '\n') i++;
      row.push(field), table.push(row), (row = []), (field = '');
    } else field += ch;
  }
  row.push(field), table.push(row);
  const [head, ...rest] = table;
  return rest.filter((r) => r.some((x) => x.trim())).map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] ?? '').trim()])));
}

/** For each of our fields, the column of the file that holds it (or undefined). */
export function columns(rows: Row[]) {
  const heads = Object.keys(rows[0] || {});
  const out: Record<string, string | undefined> = {};
  for (const [f, names] of Object.entries(COLUMNS)) out[f] = names.map((n) => heads.find((h) => key(h) === n)).find(Boolean);
  return out;
}

/** The department a row belongs to, from its category/game column; null when the file doesn't say. */
export function rowGame(v: string | undefined): Game | null {
  const k = key(v || '');
  if (!k) return null;
  if (k.includes('pokemon')) return 'pokemon';
  if (k.includes('lorcana')) return 'lorcana';
  if (k.includes('magic') || k === 'mtg') return 'magic';
  if (k.includes('onepiece')) return 'one-piece';
  return null;
}

export interface Hit { id: number; lang: string; ver: string; qty: number }
export interface Miss { name: string; set: string; number: string; qty: number }
export interface ImportResult {
  hits: Hit[];
  missing: Miss[];
  /** Rows of other departments: game → number of copies. */
  other: Partial<Record<Game, number>>;
}

/**
 * Matches rows to cards. `versions(card)` lists a card's versions (games/config.ts) to find the one a row names
 * ("Reverse Holofoil", "foil"); a Pokémon card whose versions aren't known yet gets the key they would have.
 */
export function matchRows(
  rows: Row[],
  cards: any[],
  game: Game,
  versions: (c: any) => { key: string; label: string }[],
  /** English name of what a card shows (Pokémon: its species), for cards named in another script (Japanese). */
  species: (c: any) => string | null = () => null,
): ImportResult {
  const col = columns(rows);
  const get = (r: Row, f: string) => (col[f] ? r[col[f]!] || '' : '');
  const byName = new Map<string, any[]>();
  const bySetNum = new Map<string, any>();
  const byScryfall = new Map<string, any>();
  for (const c of cards) {
    const ns = new Set(Object.values(c.names || {}).filter(Boolean).map((n: any) => normName(n)));
    for (const n of ns) byName.set(n, [...(byName.get(n) || []), c]);
    bySetNum.set(plain(c.set) + '|' + normNum(c.localId ?? c.num), c);
    if (c.scryfallId) byScryfall.set(c.scryfallId, c);
  }
  // By number, for the fallback below.
  const byNum = new Map<string, any[]>();
  for (const c of cards) {
    const k = normNum(c.localId ?? c.num);
    byNum.set(k, [...(byNum.get(k) || []), c]);
  }
  const res: ImportResult = { hits: [], missing: [], other: {} };
  // The sets the other app's set names turned out to be, from the rows found ("Mega Brave" → JA-M1L).
  const learned = new Map<string, Map<string, number>>();
  const later: Row[] = [];
  const add = (r: Row, c: any, qty: number) => {
    const name = get(r, 'name');
    // Language: the column, or Japanese for Collectr's "Pokemon Japan"; one the card exists in.
    const want = LANGS[key(get(r, 'lang'))] || (/japan|\(jp\)/.test(plain(get(r, 'game') + ' ' + name)) ? 'JA' : null);
    const lang = want && c.avail.includes(want) ? want : c.avail.includes('EN') && !want ? 'EN' : c.avail[0];
    res.hits.push({ id: c.id, lang, ver: versionOf(get(r, 'finish') + ' ' + name, versions(c), game), qty });
    const sn = plain(get(r, 'setName'));
    if (sn) {
      const m = learned.get(sn) || new Map<string, number>();
      m.set(c.set, (m.get(c.set) || 0) + 1);
      learned.set(sn, m);
    }
  };
  for (const r of rows) {
    const g = rowGame(get(r, 'game')) ?? (col['scryfallId'] ? 'magic' : game);
    const qty = Math.max(0, parseInt(get(r, 'qty'), 10) || (col['qty'] ? 0 : 1));
    if (!qty) continue;
    if (g !== game) {
      res.other[g] = (res.other[g] || 0) + qty;
      continue;
    }
    const name = get(r, 'name');
    const num = normNum(get(r, 'number'));
    const setName = get(r, 'setName');
    let c = byScryfall.get(get(r, 'scryfallId').toLowerCase()) ?? (get(r, 'setCode') && num ? bySetNum.get(plain(get(r, 'setCode')) + '|' + num) : null);
    if (!c && name) {
      const named = byName.get(normName(name)) || [];
      const w = words(setName + ' ' + get(r, 'setCode'));
      const score = (x: any) => [...words(x.setName + ' ' + x.set)].filter((y) => w.has(y)).length;
      let cand = num ? named.filter((x) => normNum(x.localId ?? x.num) === num) : named;
      // Numbered differently in the other app: the card of that name in that set, if the set name says which.
      if (!cand.length && num) cand = named.filter((x) => score(x) > 0);
      if (cand.length > 1 && w.size) cand = [...cand].sort((a, b) => score(b) - score(a));
      c = cand[0];
    }
    // Named in English while the card is Japanese ("Mega Absol" · Mega Brave · 038/063): the card with that number in a
    // set of that size, showing that Pokémon. A trainer card only when one card has that number and set size.
    if (!c && num) {
      const japanese = /\(jp\)|japan/.test(plain(name + ' ' + get(r, 'game') + ' ' + setName)) || LANGS[key(get(r, 'lang'))] === 'JA';
      const total = normNum(get(r, 'number').split('/')[1] || '');
      let pool = (byNum.get(num) || []).filter((x) => !total || !/^\d+$/.test(total) || !x.total || String(x.total) === total);
      if (japanese) pool = pool.filter((x) => x.avail.includes('JA'));
      const n = normName(name).replace(/^(mega|dark|light|shining|radiant|alolan|galarian|hisuian|paldean) /, '').replace(/ (ex|gx|v|vmax|vstar|lv x|break|prime|star)$/, '');
      const same = pool.filter((x) => { const sp = species(x); return sp && normName(sp) === n; });
      const cand = same.length ? same : pool.filter((x) => !species(x));
      if (same.length || cand.length === 1) {
        const w = words(setName);
        const score = (x: any) => [...words(x.setName + ' ' + x.set)].filter((y) => w.has(y)).length;
        c = [...cand].sort((a, b) => score(b) - score(a))[0];
      }
    }
    if (c) add(r, c, qty);
    else later.push(r);
  }
  // Not found: the card with that number in the set other rows of that set name were found in (trainer cards of a
  // Japanese set named in English).
  for (const r of later) {
    const qty = Math.max(0, parseInt(get(r, 'qty'), 10) || (col['qty'] ? 0 : 1));
    const votes = [...(learned.get(plain(get(r, 'setName'))) || new Map()).entries()].sort((a, b) => b[1] - a[1]);
    const c = votes.length ? bySetNum.get(plain(votes[0][0]) + '|' + normNum(get(r, 'number'))) : null;
    if (c) add(r, c, qty);
    else res.missing.push({ name: get(r, 'name') || '(geen naam)', set: get(r, 'setName') || get(r, 'setCode'), number: get(r, 'number'), qty });
  }
  return res;
}

/** The version a row names ("Reverse Holofoil", "1st Edition Holofoil", "foil", "etched"), '' for the plain one. */
export function versionOf(text: string, vers: { key: string; label: string }[], game: Game): string {
  const t = plain(text);
  if (game !== 'pokemon') {
    if (/non.?foil|normal/.test(t) || !/foil|etched/.test(t)) return '';
    return vers.some((v) => v.key === 'foil') ? 'foil' : '';
  }
  const reverse = /reverse/.test(t);
  const first = /1st|first edition/.test(t);
  const holo = /holo/.test(t) && !reverse;
  const pattern = /poke ?ball/.test(t) ? 'pokeball' : /master ?ball/.test(t) ? 'masterball' : '';
  const shadowless = /shadowless/.test(t);
  if (!reverse && !first && !shadowless && !pattern && !(holo && vers.some((v) => v.key === 'holo'))) return '';
  if (vers.length) {
    // A version with the same features (shadowless preferred when named: Base Set's 1st edition is always shadowless).
    const fits = vers.slice(1).filter((x) => x.key.includes('reverse') === reverse && x.key.includes('1st_edition') === first && (pattern ? x.key.includes(pattern) : !/pokeball|masterball/.test(x.key)) && (!holo || x.key.startsWith('holo')));
    const v = fits.find((x) => x.key.includes('shadowless') === shadowless) ?? fits[0];
    return v ? v.key : '';
  }
  // Versions not loaded yet: the key source.ts will give it.
  if (reverse) return pattern ? 'reverse_' + pattern : 'reverse';
  if (first) return (holo ? 'holo' : 'normal') + (shadowless ? '_shadowless' : '') + '_1st_edition';
  return '';
}
