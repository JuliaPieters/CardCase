import type { CardKey, CardSource, LoadedCatalog, PriceEntry } from '../types';
import { buildCatalog } from './catalog';

const API = 'https://api.scryfall.com';
/** Scryfall asks for at most ~10 requests a second. */
const PAUSE = 120;

/**
 * Magic cards from public/catalogs/magic.json; prices (Cardmarket in EUR, through Scryfall) refreshed for the cards in
 * view with Scryfall's collection endpoint, 75 at a time. The rules text, left out of the catalog, comes from there too.
 */
export class MagicSource implements CardSource {
  readonly game = 'magic' as const;
  private texts = new Map<string, Promise<string>>();

  constructor(private readonly langs: string[]) {}

  async loadCatalog(): Promise<LoadedCatalog> {
    const res = await fetch('catalogs/magic.json');
    if (!res.ok) throw new Error(`catalogs/magic.json: ${res.status}`);
    const raw = await res.json();
    return { ...buildCatalog(raw, this.langs), version: raw.generated ?? '' };
  }

  async getPrices(cards: any[]): Promise<Record<CardKey, PriceEntry>> {
    const out: Record<CardKey, PriceEntry> = {};
    for (let i = 0; i < cards.length; i += 75) {
      const batch = cards.slice(i, i + 75);
      try {
        const res = await fetch(`${API}/cards/collection`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifiers: batch.map((c) => ({ id: c.scryfallId })) }),
        });
        if (!res.ok) continue;
        const byId = new Map(batch.map((c) => [c.scryfallId, c]));
        for (const x of (await res.json()).data || []) {
          const c = byId.get(x.id);
          if (!c) continue;
          const eur = x.prices?.eur ? +x.prices.eur : null;
          const foil = x.prices?.eur_foil ? +x.prices.eur_foil : x.prices?.eur_etched ? +x.prices.eur_etched : null;
          const main = c.foilOnly ? foil : eur;
          out[c.key] = [Date.now(), main, null, main, main, main, ...(c.foilOnly || foil == null ? [] : [foil, null, foil, foil, foil])] as PriceEntry;
        }
      } catch {
        // Offline: the catalog's prices stay.
      }
      await new Promise((r) => setTimeout(r, PAUSE));
    }
    return out;
  }

  /** The rules text of a card (both faces), from Scryfall; cached for the session. */
  cardText(card: any): Promise<string> {
    let p = this.texts.get(card.scryfallId);
    if (!p) {
      p = fetch(`${API}/cards/${card.scryfallId}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((x) => (x ? x.oracle_text || (x.card_faces || []).map((f: any) => `${f.name}\n${f.oracle_text}`).join('\n\n') || '' : ''))
        .catch(() => '');
      this.texts.set(card.scryfallId, p);
    }
    return p;
  }
}
