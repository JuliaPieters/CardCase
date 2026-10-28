import type { CardKey, CardSource, LoadedCatalog, PriceEntry } from '../types';
import { buildCatalog } from './catalog';

/**
 * Cardmarket's public price guide for One Piece (idGame 18), refreshed daily. It can't be fetched from a browser, so the
 * app reaches it through its own server: a rewrite in vercel.json, and proxy.conf.json for `ng serve`.
 */
const PRICE_GUIDE = 'cardmarket/priceGuide/price_guide_18.json';

/** One Piece cards from public/catalogs/one-piece.json; Cardmarket prices (EUR) per print. */
export class OnePieceSource implements CardSource {
  readonly game = 'one-piece' as const;
  readonly bulkPrices = true;
  private guide?: Promise<Map<number, any>>;

  async loadCatalog(): Promise<LoadedCatalog> {
    const res = await fetch('catalogs/one-piece.json');
    if (!res.ok) throw new Error(`catalogs/one-piece.json: ${res.status}`);
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
      const trend = p.trend || p.avg || p.low || null;
      out[c.key] = [now, trend, p.low ?? null, p.avg1 ?? trend, p.avg7 ?? trend, p.avg30 ?? trend];
    }
    return out;
  }

  /** The whole guide, fetched once per session; the browser caches it too. */
  private priceGuide(): Promise<Map<number, any>> {
    this.guide ??= fetch(PRICE_GUIDE)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`${PRICE_GUIDE}: ${res.status}`))))
      .then((g) => new Map(g.priceGuides.map((p: any) => [p.idProduct, p])));
    // A failed download is tried again next time.
    this.guide.catch(() => (this.guide = undefined));
    return this.guide;
  }
}
