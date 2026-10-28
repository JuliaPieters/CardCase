import type { CardKey, CardSource, LoadedCatalog, PriceEntry, PriceVersions } from '../types';
import { buildCatalog } from './catalog';

const API = 'https://api.tcgdex.net/v2';
const CONCURRENCY = 6;

/** Pokémon cards from public/catalog.json; Cardmarket prices per card and per version from TCGdex. */
export class PokemonSource implements CardSource {
  readonly game = 'pokemon' as const;

  async loadCatalog(): Promise<LoadedCatalog> {
    const res = await fetch('catalog.json');
    if (!res.ok) throw new Error(`catalog.json: ${res.status}`);
    const raw = await res.json();
    return { ...buildCatalog(raw), version: raw.generated ?? '' };
  }

  async getPrices(cards: any[]): Promise<Record<CardKey, PriceEntry>> {
    const out: Record<CardKey, PriceEntry> = {};
    // Japanese sets that only the official database has are not at TCGdex.
    const todo = cards.filter((c) => c.apiId);
    let next = 0;
    const worker = async () => {
      while (next < todo.length) {
        const c = todo[next++];
        try {
          const res = await fetch(`${API}/${c.api}/cards/${encodeURIComponent(c.apiId)}`);
          if (!res.ok) continue;
          const card = await res.json();
          const vs = versions(card.variants_detailed || []);
          const base = vs[0]?.price.some((x) => x != null) ? vs[0].price : cardmarket(card.pricing?.cardmarket, false);
          const trend = base[0];
          const entry: PriceEntry = [Date.now(), trend, base[1], base[2] ?? trend, base[3] ?? trend, base[4] ?? trend];
          if (vs.length > 1) entry.push({ base: vs[0].label, v: vs.slice(1).map((x) => [x.key, x.label, ...x.price]) } as PriceVersions);
          out[c.key] = entry;
        } catch {
          // Offline or rate limited: tried again on the next request for this card.
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, todo.length) }, worker));
    return out;
  }
}

type Prices = [number | null, number | null, number | null, number | null, number | null];

/** Cardmarket's [trend, low, avg1, avg7, avg30]; a reverse holo is priced in the "-holo" fields of its product. */
function cardmarket(cm: any, reverse: boolean): Prices {
  const f = (k: string) => (cm?.[reverse ? k + '-holo' : k] || null) as number | null;
  return [f('trend') ?? f('avg') ?? f('low'), f('low'), f('avg1'), f('avg7'), f('avg30')];
}

const TYPES: Record<string, string> = { normal: 'Normaal', holo: 'Holo', reverse: 'Reverse holo' };
const PATTERNS: Record<string, string> = { pokeball: 'Poké Ball', masterball: 'Master Ball' };
const SUBTYPES: Record<string, string> = { 'shadowless-red-cheek': 'Shadowless · rode wangen', '1999-2000-copyright': '© 1999-2000', 'missing-expansion-symbol': 'zonder setsymbool' };
const words = (s: string) => s.replace(/[-_]/g, ' ').replace(/^./, (x) => x.toUpperCase());

/**
 * The versions TCGdex lists for a card (normal, holo, reverse holo, with a foil pattern, 1st edition, shadowless,
 * stamped…), the plain one first. Oversized (jumbo) cards are left out. A version only has a price of its own when it
 * is a product of its own at Cardmarket: 1st edition and unlimited share one there, so the 1st edition gets none.
 */
export function versions(detailed: any[]) {
  const list = detailed
    .filter((v) => (v.size || 'standard') === 'standard' && TYPES[v.type])
    .map((v) => {
      const sub = v.subtype && v.subtype !== 'unlimited' ? v.subtype : null;
      const stamps: string[] = v.stamp || [];
      const extras = [v.foil, sub, ...stamps].filter(Boolean).length;
      const label = [
        TYPES[v.type] + (v.foil ? ' · ' + (PATTERNS[v.foil] || words(v.foil)) : ''),
        ...(sub ? [SUBTYPES[sub] || words(sub)] : []),
        ...stamps.map((s) => (s === '1st-edition' ? '1st edition' : 'stempel ' + words(s).toLowerCase())),
      ].join(' · ');
      const key = [v.type, v.foil, sub, ...stamps].filter(Boolean).join('_').replace(/[^a-z0-9_]/gi, '_').toLowerCase();
      return { v, key, label, extras, order: Object.keys(TYPES).indexOf(v.type) };
    })
    .sort((a, b) => a.extras - b.extras || a.order - b.order);
  const claimed = new Set<string>();
  const seen = new Map<string, number>();
  return list.map((x) => {
    const reverse = x.v.type === 'reverse';
    const cm = x.v.pricing?.cardmarket;
    const product = (cm?.idProduct ?? x.v.thirdParty?.cardmarket) + (reverse ? 'r' : '');
    const own = cm && !claimed.has(product);
    if (cm) claimed.add(product);
    const n = (seen.get(x.key) || 0) + 1;
    seen.set(x.key, n);
    return {
      key: n > 1 ? x.key + '_' + n : x.key,
      label: n > 1 ? x.label + ' (' + n + ')' : x.label,
      price: own ? cardmarket(cm, reverse) : ([null, null, null, null, null] as Prices),
    };
  });
}
