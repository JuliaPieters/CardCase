import type { CardKey, CardSource, LoadedCatalog, PriceEntry } from '../types';
import { buildCatalog } from './catalog';

/**
 * Cardmarket's public price guide for Lorcana (idGame 19), refreshed daily. It can't be fetched from a browser, so the
 * app reaches it through its own server: a rewrite in vercel.json, and proxy.conf.json for `ng serve`.
 */
const PRICE_GUIDE = 'cardmarket/priceGuide/price_guide_19.json';

/** Lorcana cards from public/catalogs/lorcana.json; Cardmarket prices (EUR), regular and foil. */
export class LorcanaSource implements CardSource {
  readonly game = 'lorcana' as const;
  readonly bulkPrices = true;
  private guide?: Promise<Map<number, any>>;

  async loadCatalog(): Promise<LoadedCatalog> {
    const res = await fetch('catalogs/lorcana.json');
    if (!res.ok) throw new Error(`catalogs/lorcana.json: ${res.status}`);
    const raw = await res.json();
    return { ...buildCatalog(raw), version: raw.generated ?? '' };
  }

  async getPrices(cards: any[]): Promise<Record<CardKey, PriceEntry>> {
    const guide = await this.priceGuide();
    const out: Record<CardKey, PriceEntry> = {};
    const now = Date.now();
    for (const c of cards) {
      const p = c.cardmarketId && guide.get(c.cardmarketId);
      if (!p) continue;
      out[c.key] = priceEntry(c, now, [p.trend || p.avg || p.low, p.low, p.avg1, p.avg7, p.avg30], [p['trend-foil'], p['low-foil'], p['avg1-foil'], p['avg7-foil'], p['avg30-foil']]);
    }
    return out;
  }

  /** The whole guide (~800 kB), fetched once per session; the browser caches it too. */
  private priceGuide(): Promise<Map<number, any>> {
    this.guide ??= fetch(PRICE_GUIDE)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`${PRICE_GUIDE}: ${res.status}`))))
      .then((g) => new Map(g.priceGuides.map((p: any) => [p.idProduct, p])));
    // A failed download is tried again next time.
    this.guide.catch(() => (this.guide = undefined));
    return this.guide;
  }
}

/**
 * A card's price from Cardmarket's numbers [trend, low, avg1, avg7, avg30] for the regular and the foil print. A card
 * only printed as foil is worth its foil price (Cardmarket also fills in a regular one for it).
 */
export function priceEntry(c: any, at: number, regular: (number | null)[], foil: (number | null)[]): PriceEntry {
  const f = foil.map((v) => v || null);
  const main = c.foilOnly && f[0] ? f : regular.map((v) => v ?? null);
  return [at, main[0] || null, main[1] ?? null, main[2] ?? main[0], main[3] ?? main[0], main[4] ?? main[0], ...(c.foilOnly ? [] : f)] as PriceEntry;
}
