import { Injectable, signal } from '@angular/core';
import { CARDS, RARITIES, mockCatalog, pad, setCatalog } from './data';

const API = 'https://api.tcgdex.net/v2';
const PRICE_KEY = 'cc-prices-v1';
const PRICE_TTL = 24 * 60 * 60 * 1000;
const CONCURRENCY = 6;

const TYPE_MAP: Record<string, string> = {
  Fire: 'fire',
  Water: 'water',
  Grass: 'grass',
  Lightning: 'electric',
  Psychic: 'psychic',
  Fairy: 'psychic',
  Fighting: 'fighting',
  Darkness: 'dark',
  Metal: 'metal',
  Dragon: 'dragon',
  Colorless: 'colorless',
};

export type CatalogSource = 'catalog' | 'mock';

/** `generated` timestamp of the loaded catalog.json; public/card-hashes.bin must have been built from the same one. */
export let catalogVersion = '';

/** Cached Cardmarket price: [fetchedAt, trend, low, avg1, avg7, avg30]. */
type PriceEntry = [number, number | null, number | null, number | null, number | null, number | null];

/**
 * Loads the full card catalog (public/catalog.json, built by `npm run sync-catalog`) into data.ts,
 * and fetches Cardmarket prices per card from TCGdex on demand.
 */
@Injectable({ providedIn: 'root' })
export class CatalogService {
  /** Where the current catalog came from. */
  readonly source = signal<CatalogSource>('mock');
  /** Bumped whenever new prices arrive, so views that show prices recompute. */
  readonly priceTick = signal(0);

  private prices: Record<string, PriceEntry> = readPrices();
  private inFlight = new Set<string>();

  async load(): Promise<void> {
    try {
      localStorage.removeItem('cc-catalog-v1'); // cache of the earlier single-set loader
    } catch {}
    try {
      const res = await fetch('catalog.json');
      if (!res.ok) throw new Error(`catalog.json: ${res.status}`);
      const raw = await res.json();
      catalogVersion = raw.generated ?? '';
      const { sets, cards } = buildCatalog(raw);
      setCatalog(sets, cards, today());
      this.applyCachedPrices();
      this.source.set('catalog');
    } catch (err) {
      console.warn('[catalog] catalog.json niet geladen, voorbeelddata gebruikt', err);
      const m = mockCatalog();
      setCatalog(m.sets, m.cards);
      this.source.set('mock');
    }
  }

  /** Makes sure the given cards (by catalog id) have a fresh price; fetches the missing ones in the background. */
  ensurePrices(ids: Iterable<number>) {
    if (this.source() !== 'catalog') return;
    const now = Date.now();
    const todo = [];
    for (const id of ids) {
      const c = CARDS[id];
      if (!c?.apiId || this.inFlight.has(c.uid)) continue;
      const hit = this.prices[c.uid];
      if (hit && now - hit[0] < PRICE_TTL) continue;
      this.inFlight.add(c.uid);
      todo.push(c);
    }
    if (todo.length) void this.fetchPrices(todo);
  }

  private async fetchPrices(cards: any[]) {
    let next = 0;
    const worker = async () => {
      while (next < cards.length) {
        const c = cards[next++];
        try {
          const res = await fetch(`${API}/${c.api}/cards/${encodeURIComponent(c.apiId)}`);
          const cm = res.ok ? (await res.json()).pricing?.cardmarket : null;
          const trend = cm ? (cm.trend || cm.avg || cm.low || null) : null;
          this.prices[c.uid] = [Date.now(), trend, cm?.low ?? null, cm?.avg1 ?? trend, cm?.avg7 ?? trend, cm?.avg30 ?? trend];
          applyPrice(c, this.prices[c.uid]);
        } catch {
          // Offline or rate limited: try again on the next request for this card.
        } finally {
          this.inFlight.delete(c.uid);
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, cards.length) }, worker));
    writePrices(this.prices);
    this.priceTick.update((n) => n + 1);
  }

  private applyCachedPrices() {
    const byUid = new Map(CARDS.map((c) => [c.uid, c]));
    for (const [uid, p] of Object.entries(this.prices)) {
      const c = byUid.get(uid);
      if (c) applyPrice(c, p);
    }
  }
}

function applyPrice(c: any, p: PriceEntry) {
  c.trend = p[1];
  c.low = p[2];
  c.avg1 = p[3];
  c.avg7 = p[4];
  c.avg30 = p[5];
}

/** Expands the compact catalog.json into the card objects data.ts works with. */
export function buildCatalog(raw: any) {
  const T: string[] = raw.strings;
  const s = (i: number) => (i >= 0 ? T[i] : null);
  const sets = raw.sets.map((x: any) => ({
    code: x.code,
    name: x.name,
    serie: x.serie,
    n: 0,
    year: x.year,
    released: x.released ?? null,
    lang: x.lang,
    avail: x.lang === 'EN' ? (x.hasDE ? ['EN', 'DE'] : ['EN']) : [x.lang],
  }));
  const cards = raw.cards.map((t: any[], i: number) => {
    const [setIdx, localId, name, nameDE, rar, type, dex, illus, imgFlags, category, altRef] = t;
    const set = raw.sets[setIdx];
    sets[setIdx].n++;
    const lang = set.lang;
    const avail = lang === 'EN' ? (nameDE ? ['EN', 'DE'] : ['EN']) : [lang];
    const rarity = s(rar);
    return {
      uid: set.code + '/' + localId,
      api: set.api,
      /** Card id at TCGdex, for prices; null for Japanese sets that only the official database has. */
      apiId: set.api ? set.id + '-' + localId : null,
      set: set.code,
      setName: set.name,
      num: parseInt(localId, 10) || 0,
      localId,
      total: set.official,
      numStr: pad(localId) + '/' + pad(set.official),
      names: { EN: name, DE: nameDE ?? name, JA: name, ZH: name },
      type: TYPE_MAP[s(type) ?? ''] ?? 'colorless',
      /** Type as printed (e.g. Fairy, which `type` groups under psychic), or Trainer/Energy for those cards. */
      typeName: s(type) ?? (category === 1 ? 'Trainer' : category === 2 ? 'Energy' : null),
      rarity: mapRarity(rarity),
      rarityName: rarity,
      variant: mapVariant(rarity),
      category,
      avail,
      sp: dex || 5000 + i,
      year: set.year ?? 0,
      /** Release date of the set (YYYY-MM-DD), or null when TCGdex doesn't know it. */
      released: set.released ?? null,
      illus: s(illus) ?? '',
      img: {
        [lang]: imgFlags & 1 && set.img ? set.img + localId + '/low.webp' : altImage(altRef, true),
        DE: imgFlags & 2 && set.imgDE ? set.imgDE + localId + '/low.webp' : null,
      },
      /** Full-size original of an image from another source, tried when the resized copy fails to load. */
      imgAlt: imgFlags & 1 && set.img ? null : altImage(altRef, false),
      /** Row in public/card-hashes.bin with the hash of the photo shown (another card's when it is borrowed). */
      hashRow: i,
      trend: null,
    };
  });
  borrowJapaneseImages(cards);
  return { sets, cards };
}

/**
 * Image from a source other than TCGdex (see scripts/sync-images.mjs, sync-japanese.mjs): the official Japanese or
 * Asian card database, or pokemontcg.io. Those originals are 150–250 kB, so they go through a resizing proxy (≈15 kB, like TCGdex's).
 */
function altImage(ref: string | undefined, resized: boolean): string | null {
  if (!ref) return null;
  const path = ref.slice(2);
  const url =
    ref[0] === 'J'
      ? `https://www.pokemon-card.com/assets/images/card_images/${path}`
      : ref[0] === 'j'
        ? `https://www.pokemon-card.com/assets/images/card_images/large/${path}.jpg`
        : ref[0] === 'c'
          ? `https://asia.pokemon-card.com/tw/card-img/${path}.png`
          : `https://images.pokemontcg.io/${path}.png`;
  return resized ? `https://images.weserv.nl/?url=${encodeURIComponent(url.slice(8))}&w=250&output=webp&q=80` : url;
}

/**
 * Taiwanese and Chinese sets reuse the Japanese set codes and numbering ("ZH-TW-SV2a" 025 = "JA-SV2a" 025), and the
 * artwork is the same: a Chinese card without its own photo shows the Japanese one, if it is the same Pokémon
 * (or, in a Taiwanese set, a trainer/energy card of the same kind).
 */
function borrowJapaneseImages(cards: any[]) {
  const ja = new Map<string, any>();
  for (const c of cards) if (c.avail[0] === 'JA' && c.img.JA) ja.set(c.set.slice(3) + '/' + c.num, c);
  for (const c of cards) {
    if (c.avail[0] !== 'ZH' || c.img.ZH) continue;
    const j = ja.get(c.set.replace(/^ZH-(TW|CN)-/, '') + '/' + c.num);
    const same = c.sp <= 1025 ? j?.sp === c.sp : c.category !== 0 && j?.category === c.category && c.set.startsWith('ZH-TW-');
    if (j && same) {
      c.img.ZH = j.img.JA;
      c.imgAlt = j.imgAlt;
      c.hashRow = j.hashRow;
    }
  }
}

function mapRarity(r: string | null): string {
  const x = (r || '').toLowerCase();
  if (!x) return 'X'; // TCGdex has no rarity for this card
  const tier = RARITIES[r!]?.[2];
  if (tier) return tier;
  if (x === 'common' || x === 'none' || x === 'one diamond') return 'C';
  if (x === 'uncommon' || x === 'two diamond') return 'U';
  if (x === 'rare' || x === 'promo' || x === 'three diamond') return 'R';
  return 'HR';
}

function mapVariant(r: string | null): string {
  const x = (r || '').toLowerCase();
  if (x.includes('illustration')) return 'illus';
  if (x.includes('ultra') || x.includes('hyper') || x.includes('secret') || x.includes('full art') || x.includes('character')) return 'fullart';
  if (x.includes('promo')) return 'promo';
  if (x.includes('holo') || x.includes('double') || x.includes('triple')) return 'holo';
  return 'regular';
}

const today = () => new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });

function readPrices(): Record<string, PriceEntry> {
  try {
    return JSON.parse(localStorage.getItem(PRICE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writePrices(p: Record<string, PriceEntry>) {
  try {
    localStorage.setItem(PRICE_KEY, JSON.stringify(p));
  } catch {
    // Storage full: prices are simply refetched later.
  }
}
