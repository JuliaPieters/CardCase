import { CARDS, GAME } from './data';
import { isGame } from '../games/registry';

/**
 * The address of every screen, so the browser's back button works and a screen can be linked to.
 * toUrl() writes the state as a URL; fromUrl() reads it back as the arguments for store.go().
 *
 * Every screen lives in its department: /pokemon/zoeken, /lorcana/binders/<id>, … (below without that prefix). Friends
 * are above the departments (/vrienden). Addresses from before departments (/kaart/…) are Pokémon's.
 *
 *   /                          home                /binders                  binders
 *   /zoeken?q=&set=&rar=&taal= search              /binders/nieuw            create
 *   /kaart/<set>/<nummer>      detail              /binders/recept           recipe
 *   /collectie                 collection          /binders/<id>             editor (?deco: decorate)
 *   /collectie/waarde          value               /binders/<id>/bekijk      viewer
 *   /vrienden                  friends             /binders/<id>/printen     print
 *   /vrienden/<uid>            friend              /binders/<id>/…           shift, moves, crop, page scan + result
 *   /scan                      scan (home when opened fresh)
 *
 * Screens that live off unsaved state (moving cards, cropping, a page scan) get an address too, so back works, but
 * opening one fresh lands on their binder.
 */

const BINDER_SUB: Record<string, string> = {
  viewer: 'bekijk',
  print: 'printen',
  shift: 'verschuiven',
  moves: 'verplaatsen',
  crop: 'uitsnijden',
  pagescan: 'pagina-scan',
  pageresult: 'pagina-resultaat',
};
/** Sub-pages that can be opened from a link; the others need state that only exists while you're using them. */
const RESTORABLE = new Set(['viewer', 'print']);

export function toUrl(st: any): string | null {
  const path = screenPath(st);
  if (!path || /^\/(vrienden|welkom|overzicht)/.test(path)) return path;
  return '/' + GAME + (path === '/' ? '' : path);
}

function screenPath(st: any): string | null {
  const q = new URLSearchParams();
  const qs = () => (q.toString() ? '?' + q : '');
  switch (st.screen) {
    case 'home':
      return '/';
    case 'search':
      if (st.q) q.set('q', st.q);
      if (st.fSet) q.set('set', st.fSet);
      if (st.fRar) q.set('rar', st.fRar);
      if (st.fLangs?.length) q.set('taal', st.fLangs.join(','));
      return '/zoeken' + qs();
    case 'detail': {
      const c = CARDS[st.detailId];
      if (!c) return null;
      if (st.detailLang && st.detailLang !== c.avail[0]) q.set('taal', st.detailLang);
      return '/kaart/' + cardKey(c).split('/').map(encodeURIComponent).join('/') + qs();
    }
    case 'collection':
      return '/collectie';
    case 'value':
      return '/collectie/waarde';
    case 'binders':
      return '/binders';
    case 'decks':
      return '/decks';
    case 'deck':
      return '/decks/' + encodeURIComponent(st.deckId);
    case 'create':
      return '/binders/nieuw';
    case 'recipe':
      return '/binders/recept';
    case 'editor':
      if (st.edMode === 'deco') q.set('deco', '');
      return '/binders/' + encodeURIComponent(st.edId) + qs().replace(/=$/, '');
    case 'friends':
      return '/vrienden';
    case 'friend':
      return st.friendId ? '/vrienden/' + encodeURIComponent(st.friendId) : '/vrienden';
    case 'scan':
      return '/scan';
    case 'onboarding':
      return '/welkom';
    case 'overview':
      return '/overzicht';
    default: {
      const sub = BINDER_SUB[st.screen];
      if (!sub) return null;
      const id = st.screen === 'viewer' ? st.vId : st.screen === 'pagescan' ? st.ps?.binderId : st.edId;
      return '/binders/' + encodeURIComponent(id) + '/' + sub;
    }
  }
}

let byUid: Map<string, number> | null = null;

/** "<set>/<number>", the same in every catalog version (unlike the card's position in it). */
function cardKey(c: any): string {
  return c.uid ?? c.set + '/' + (c.localId ?? c.num);
}

/** The screen at `url` as [screen, extra state] for store.go(), or null when the address means nothing here. */
export function fromUrl(url: URL, st: any, fresh: boolean): [string, Record<string, unknown>] | null {
  const parts = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
  // Another department's address (going back to it, or an old Pokémon link): see store.syncUrl.
  if (isGame(parts[0])) {
    if (parts[0] !== GAME) return ['game', { game: parts[0], path: url.pathname + url.search }];
    parts.shift();
  } else if (parts[0] && !['vrienden', 'welkom', 'overzicht'].includes(parts[0]) && GAME !== 'pokemon') {
    return ['game', { game: 'pokemon', path: '/pokemon' + url.pathname + url.search }];
  }
  const p = url.searchParams;
  const [a, b, c] = parts;
  if (!a) return ['home', {}];
  if (a === 'zoeken' && !b) {
    const langs = (p.get('taal') || '').split(',').filter(Boolean);
    return ['search', { q: p.get('q') || '', fSet: p.get('set') || '', fRar: p.get('rar') || '', fLangs: langs }];
  }
  if (a === 'kaart' && b && c) {
    if (!byUid || byUid.size !== CARDS.length) byUid = new Map(CARDS.map((x, i) => [cardKey(x), i]));
    const id = byUid.get(b + '/' + c);
    if (id == null) return null;
    const lang = p.get('taal');
    return ['detail', { detailId: id, detailLang: lang && CARDS[id].avail.includes(lang) ? lang : CARDS[id].avail[0], sameLimit: 20 }];
  }
  if (a === 'collectie') return !b ? ['collection', {}] : b === 'waarde' ? ['value', {}] : null;
  if (a === 'vrienden') return b ? ['friend', { friendId: b }] : ['friends', {}];
  if (a === 'welkom' && !b) return ['onboarding', {}];
  if (a === 'overzicht' && !b) return ['overview', {}];
  // Opened fresh, the scanner would ask for the camera before anything is on screen.
  if (a === 'decks') return b && (st.decks || []).some((d: { id: string }) => d.id === b) ? ['deck', { deckId: b }] : ['decks', {}];
  if (a === 'scan' && !b) return [fresh ? 'home' : 'scan', {}];
  if (a !== 'binders') return null;
  if (!b) return ['binders', {}];
  if (b === 'nieuw' && !c) return ['create', {}];
  if (b === 'recept' && !c) return ['recipe', {}];
  // Someone else's binder, or one deleted since: the list of your own.
  if (!st.binders.some((x: { id: string }) => x.id === b)) return ['binders', {}];
  // Another binder starts at its first spread.
  const ed = b === st.edId ? { edId: b } : { edId: b, edSpread: 0, edSide: 0 };
  if (!c) return ['editor', { ...ed, edMode: p.has('deco') ? 'deco' : 'cards' }];
  const screen = Object.keys(BINDER_SUB).find((k) => BINDER_SUB[k] === c);
  if (!screen) return null;
  if (fresh && !RESTORABLE.has(screen)) return ['editor', ed];
  if (screen === 'viewer') return ['viewer', b === st.vId ? {} : { vId: b, vSpread: 0, vSide: 0 }];
  return [screen, screen === 'pagescan' ? {} : ed];
}
