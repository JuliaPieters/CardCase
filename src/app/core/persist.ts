// @ts-nocheck -- works on the untyped store state; see store.ts.
import { CARDS, GAME, LANGS, isCard, mkB, tot } from './data';

/**
 * The user's own data: per department (game) a collection and binders, plus the departments they collect and settings.
 * Cards are stored by their key ("pokemon:sv08-250", see games/types.ts), not by catalog index, so a newer catalog
 * doesn't scramble the collection. The same saved form is used for the browser cache (per account) and for Firestore.
 *
 * Only the active department is unpacked into the state (owned/added/binders, by catalog index); the others stay in
 * their saved form (`otherGames`) until you switch to them.
 *
 * Version 1 (before departments) held only Pokémon cards, keyed by "set/number"; it is migrated when read.
 */
const KEY_V1 = 'cc-user-v1';
const KEY = 'cc-user-v2';
const ACCOUNT_KEY = 'cc-account';

/**
 * The Firestore field holding the saved form. Until departments go live the old field `cardcase` (version 1, read by
 * the version online) is only read, never written: see docs/implementatieplan.md §0.
 */
export const REMOTE_FIELD = 'cardcaseV2';
export const REMOTE_FIELD_V1 = 'cardcase';

export interface UserData {
  owned: Record<number, Record<string, number>>;
  added: Record<number, number>;
  binders: any[];
  dark: boolean;
  /** Departments the user collects, in their order; empty until they chose (onboarding). */
  games: string[];
  /** The saved form of every department except the active one. */
  otherGames: Record<string, SavedGame>;
  /** Cards and value per department, for the switcher and the overview without loading every catalog. */
  summary: Record<string, GameSummary>;
}

export interface SavedGame {
  owned: Record<string, Record<string, number>>;
  added: Record<string, number>;
  binders: any[];
}

export interface GameSummary {
  cards: number;
  unique: number;
  value: number;
}

/** JSON-safe form: { v: 2, games, lastGame, dark, data: {game: SavedGame}, summary, savedAt, by? }. */
export type SavedUser = Record<string, any>;

const zeros = () => Object.fromEntries(LANGS.map((l) => [l, 0]));
const denseOwned = () => CARDS.map(() => zeros());

/** Empty collection with one empty binder to start from. */
export function freshUser(): UserData {
  return { owned: denseOwned(), added: {}, binders: [firstBinder()], dark: false, games: [], otherGames: {}, summary: {} };
}

const firstBinder = () => Object.assign(mkB('b1', 'Mijn eerste binder', 9, 2, '#E3350D', []), { kind: 'free', desc: 'Vrije indeling', game: GAME });

export function serializeUser(st: UserData): SavedUser {
  const mine = serializeGame(st);
  const data = { ...st.otherGames, [GAME]: mine };
  const summary = { ...st.summary, [GAME]: summarize(st) };
  // A department you have cards in is one you collect, whether or not you picked it at the start.
  const games = [...(st.games || [])];
  if (!games.includes(GAME) && Object.keys(mine.owned).length) games.push(GAME);
  // JSON round trip drops `undefined`, which Firestore rejects.
  return JSON.parse(JSON.stringify({ v: 2, games, lastGame: GAME, dark: !!st.dark, data, summary, savedAt: Date.now() }));
}

function serializeGame(st: UserData): SavedGame {
  const owned = {};
  const added = {};
  CARDS.forEach((c, id) => {
    const n = st.owned[id];
    if (n && LANGS.some((l) => n[l])) owned[c.key] = n;
    if (st.added[id] != null && owned[c.key]) added[c.key] = st.added[id];
  });
  const toKey = (x) => (isCard(x) ? 'U:' + CARDS[x].key : x);
  const binders = st.binders.map((b) => ({ ...b, game: b.game || GAME, slots: b.slots.map(toKey), dismissed: (b.dismissed || []).map(toKey) }));
  return { owned, added, binders };
}

function summarize(st: UserData): GameSummary {
  let cards = 0;
  let unique = 0;
  let value = 0;
  CARDS.forEach((c, id) => {
    const n = tot(st.owned[id]);
    if (!n) return;
    cards += n;
    unique++;
    value += n * (c.trend || 0);
  });
  return { cards, unique, value: Math.round(value * 100) / 100 };
}

/** A key from version 1 ("sv08/250", always Pokémon) as a key of today; keys of today are returned as they are. */
const upgradeKey = (k: string) => (k.includes(':') ? k : 'pokemon:' + k.replace('/', '-'));

/** Catalog index by card key, rebuilt when the catalog is (re)loaded. */
let indexCache: { cards: any; n: number; map: Map<string, number> } | null = null;
function indexOf(key: string): number | undefined {
  if (!indexCache || indexCache.cards !== CARDS[0] || indexCache.n !== CARDS.length) indexCache = { cards: CARDS[0], n: CARDS.length, map: new Map(CARDS.map((c) => [c.key, c.id])) };
  return indexCache.map.get(upgradeKey(key));
}

/** A saved collection ({key: {EN, …}}) of the active department in the state's form: counts per catalog index. */
export function ownedFromSaved(saved: Record<string, any> | undefined) {
  const owned = denseOwned();
  for (const [key, n] of Object.entries(saved || {})) {
    const id = indexOf(key);
    if (id != null) owned[id] = { ...zeros(), ...n };
  }
  return owned;
}

/** A saved binder (card slots as 'U:<key>') in the state's form. */
export function binderFromSaved(b: any) {
  const toId = (x) => (typeof x === 'string' && x.startsWith('U:') ? (indexOf(x.slice(2)) ?? null) : x);
  return { ...b, slots: b.slots.map(toId), dismissed: (b.dismissed || []).map(toId).filter((x) => x != null) };
}

/** Version 1 (Pokémon only, keys "set/number") in the form of version 2. */
function migrateV1(raw: SavedUser): SavedUser {
  const rekey = (o) => Object.fromEntries(Object.entries(o || {}).map(([k, v]) => [upgradeKey(k), v]));
  const slot = (x) => (typeof x === 'string' && x.startsWith('U:') ? 'U:' + upgradeKey(x.slice(2)) : x);
  const binders = (raw.binders || []).map((b) => ({ ...b, game: 'pokemon', slots: (b.slots || []).map(slot), dismissed: (b.dismissed || []).map(slot) }));
  return {
    v: 2,
    games: ['pokemon'],
    lastGame: 'pokemon',
    dark: !!raw.dark,
    data: { pokemon: { owned: rekey(raw.owned), added: rekey(raw.added), binders } },
    summary: {},
    savedAt: raw.savedAt || 0,
  };
}

/** Any saved form as version 2, or null when it isn't one. */
export function normalize(raw: SavedUser | null): SavedUser | null {
  if (raw?.v === 2) return raw;
  if (raw?.v === 1) return migrateV1(raw);
  return null;
}

/**
 * The newest of a version-2 and a version-1 copy (in Firestore or this browser). When version 1 is newer, the version
 * online changed the Pokémon collection after this one last saved: Pokémon is taken from it, the other departments
 * from version 2.
 */
export function newest(v2: SavedUser | null, v1: SavedUser | null): SavedUser | null {
  if (!v1 || v1.v !== 1) return normalize(v2);
  if (!v2 || v2.v !== 2) return migrateV1(v1);
  if ((v1.savedAt || 0) <= (v2.savedAt || 0)) return v2;
  const m = migrateV1(v1);
  return { ...v2, data: { ...v2.data, pokemon: m.data.pokemon }, savedAt: v1.savedAt };
}

/** The saved form in a users/{uid} document, or null. */
export const remoteUser = (doc: Record<string, any> | undefined) => newest(doc?.[REMOTE_FIELD] ?? null, doc?.[REMOTE_FIELD_V1] ?? null);

export function deserializeUser(raw: SavedUser | null): UserData | null {
  const u = normalize(raw);
  if (!u) return null;
  const { [GAME]: mine, ...otherGames } = u.data || {};
  const owned = ownedFromSaved(mine?.owned);
  const added = {};
  for (const [key, t] of Object.entries(mine?.added || {})) {
    const id = indexOf(key);
    if (id != null) added[id] = t;
  }
  const binders = (mine?.binders || []).map(binderFromSaved);
  // Departments with cards in them count as chosen, also when the list itself is missing or empty.
  const games = [...(u.games || [])];
  for (const [g, d] of Object.entries(u.data || {})) if (!games.includes(g) && Object.keys((d as SavedGame).owned || {}).length) games.push(g);
  return { owned, added, binders: binders.length ? binders : [firstBinder()], dark: !!u.dark, games, otherGames, summary: u.summary || {} };
}

/** Number of distinct cards in a saved collection, over all departments. */
export function savedCardCount(raw: SavedUser | null): number {
  const u = normalize(raw);
  return Object.values(u?.data || {}).reduce((n, g: any) => n + Object.keys(g.owned || {}).length, 0);
}

/**
 * What friends and links see (shared/{uid}, publicBinders), from a saved user. Pokémon stays in the form the version
 * online reads (keys "set/number") until departments go live; every department is also under `games`.
 */
export function shareForm(saved: SavedUser): { owned: Record<string, any>; binders: any[]; games: Record<string, SavedGame> } {
  const games = saved.data || {};
  // Set codes contain hyphens ("tk-ex-p"), card numbers don't: the last one separates them.
  const legacy = (k: string) => (k.startsWith('pokemon:') ? k.slice(8).replace(/-([^-]*)$/, '/$1') : k);
  const pk = games.pokemon || { owned: {}, binders: [] };
  const slot = (x) => (typeof x === 'string' && x.startsWith('U:') ? 'U:' + legacy(x.slice(2)) : x);
  const owned = Object.fromEntries(Object.entries(pk.owned || {}).map(([k, v]) => [legacy(k), v]));
  const binders = (pk.binders || []).map((b) => ({ ...b, slots: b.slots.map(slot), dismissed: (b.dismissed || []).map(slot) }));
  return { owned, binders, games };
}

/** Browser cache: the guest collection (account null) or a copy of an account's data, as version 2. */
export function readLocal(account: string | null): SavedUser | null {
  const read = (key: string) => {
    try {
      return JSON.parse(localStorage.getItem(account ? key + ':' + account : key) || 'null');
    } catch {
      return null;
    }
  };
  return newest(read(KEY), read(KEY_V1));
}

export function writeLocal(account: string | null, saved: SavedUser) {
  try {
    localStorage.setItem(account ? KEY + ':' + account : KEY, JSON.stringify(saved));
  } catch (err) {
    console.warn('[persist] lokaal opslaan mislukt', err);
  }
}

/** Forgets the browser's copy of an account's data (after logging out). */
export function removeLocal(account: string) {
  try {
    localStorage.removeItem(KEY + ':' + account);
    localStorage.removeItem(KEY_V1 + ':' + account);
  } catch {}
}

/** The account that was signed in last time, so a reload shows its cached collection right away. */
export function lastAccount(): string | null {
  try {
    return localStorage.getItem(ACCOUNT_KEY);
  } catch {
    return null;
  }
}

export function setLastAccount(uid: string | null) {
  try {
    if (uid) localStorage.setItem(ACCOUNT_KEY, uid);
    else localStorage.removeItem(ACCOUNT_KEY);
  } catch {}
}
