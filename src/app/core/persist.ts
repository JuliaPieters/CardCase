// @ts-nocheck -- works on the untyped store state; see store.ts.
import { CARDS, LANGS, isCard, mkB } from './data';

/**
 * The user's own data (collection, binders, settings).
 * Cards are stored by their stable `uid` (set code + number), not by catalog index, so a newer
 * catalog.json with extra sets doesn't scramble the collection. The same serialized form is used for
 * the browser cache (per account) and for Firestore (users/{uid}.cardcase).
 */
const KEY = 'cc-user-v1';
const ACCOUNT_KEY = 'cc-account';

export interface UserData {
  owned: Record<number, Record<string, number>>;
  added: Record<number, number>;
  binders: any[];
  dark: boolean;
}

/** JSON-safe form: { v, owned: {uid: {EN,DE,JA,ZH}}, added: {uid: ms}, binders (card slots as 'U:uid'), dark, savedAt }. */
export type SavedUser = Record<string, any>;

const zeros = () => ({ EN: 0, DE: 0, JA: 0, ZH: 0 });
const denseOwned = () => CARDS.map(() => zeros());

/** Empty collection with one empty binder to start from. */
export function freshUser(): UserData {
  const b = mkB('b1', 'Mijn eerste binder', 9, 2, '#E3350D', []);
  return { owned: denseOwned(), added: {}, binders: [Object.assign(b, { kind: 'free', desc: 'Vrije indeling' })], dark: false };
}

export function serializeUser(st: UserData): SavedUser {
  const owned = {};
  const added = {};
  CARDS.forEach((c, id) => {
    const n = st.owned[id];
    if (n && LANGS.some((l) => n[l])) owned[c.uid] = n;
    if (st.added[id] != null && owned[c.uid]) added[c.uid] = st.added[id];
  });
  const toUid = (x) => (isCard(x) ? 'U:' + CARDS[x].uid : x);
  const binders = st.binders.map((b) => ({ ...b, slots: b.slots.map(toUid), dismissed: (b.dismissed || []).map(toUid) }));
  // JSON round trip drops `undefined`, which Firestore rejects.
  return JSON.parse(JSON.stringify({ v: 1, owned, added, binders, dark: !!st.dark, savedAt: Date.now() }));
}

/** Catalog index by card uid, rebuilt when the catalog is (re)loaded. */
let idOfCache: { cards: any; n: number; map: Map<string, number> } | null = null;
function idOf() {
  if (!idOfCache || idOfCache.cards !== CARDS[0] || idOfCache.n !== CARDS.length) idOfCache = { cards: CARDS[0], n: CARDS.length, map: new Map(CARDS.map((c) => [c.uid, c.id])) };
  return idOfCache.map;
}

/** A saved collection ({uid: {EN,DE,JA,ZH}}) in the state's form: counts per catalog index. */
export function ownedFromSaved(saved: Record<string, any> | undefined) {
  const owned = denseOwned();
  for (const [uid, n] of Object.entries(saved || {})) {
    const id = idOf().get(uid);
    if (id != null) owned[id] = { ...zeros(), ...n };
  }
  return owned;
}

/** A saved binder (card slots as 'U:uid') in the state's form. */
export function binderFromSaved(b: any) {
  const toId = (x) => (typeof x === 'string' && x.startsWith('U:') ? (idOf().get(x.slice(2)) ?? null) : x);
  return { ...b, slots: b.slots.map(toId), dismissed: (b.dismissed || []).map(toId).filter((x) => x != null) };
}

export function deserializeUser(raw: SavedUser | null): UserData | null {
  if (!raw || raw.v !== 1) return null;
  const owned = ownedFromSaved(raw.owned);
  const added = {};
  for (const [uid, t] of Object.entries(raw.added || {})) {
    const id = idOf().get(uid);
    if (id != null) added[id] = t;
  }
  const binders = (raw.binders || []).map(binderFromSaved);
  if (!binders.length) return { ...freshUser(), owned, added, dark: !!raw.dark };
  return { owned, added, binders, dark: !!raw.dark };
}

/** Number of distinct cards in a saved collection. */
export const savedCardCount = (raw: SavedUser | null) => Object.keys(raw?.owned || {}).length;

/** Browser cache: the guest collection (account null) or a copy of an account's data. */
export function readLocal(account: string | null): SavedUser | null {
  try {
    return JSON.parse(localStorage.getItem(account ? KEY + ':' + account : KEY) || 'null');
  } catch {
    return null;
  }
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
