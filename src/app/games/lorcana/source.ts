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
      const foil = [p['trend-foil'] || null, p['low-foil'], p['avg1-foil'], p['avg7-foil'], p['avg30-foil']];
      const regular = [p.trend || p.avg || p.low || null, p.low, p.avg1, p.avg7, p.avg30];
      // A card only printed as foil is worth its foil price (Cardmarket also fills in the regular one for it).
      const main = c.foilOnly && foil[0] ? foil : regular;
      out[c.key] = [now, main[0], main[1] ?? null, main[2] ?? main[0], main[3] ?? main[0], main[4] ?? main[0], ...(c.foilOnly ? [] : foil.map((v) => v ?? null))] as PriceEntry;
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
