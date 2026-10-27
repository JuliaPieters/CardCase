import type { CardKey, CardSource, LoadedCatalog, PriceEntry } from '../types';
import { buildCatalog } from './catalog';

const API = 'https://api.tcgdex.net/v2';
const CONCURRENCY = 6;

/** Pokémon cards from public/catalog.json; Cardmarket prices per card from TCGdex. */
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
          const cm = res.ok ? (await res.json()).pricing?.cardmarket : null;
          const trend = cm ? cm.trend || cm.avg || cm.low || null : null;
          out[c.key] = [Date.now(), trend, cm?.low ?? null, cm?.avg1 ?? trend, cm?.avg7 ?? trend, cm?.avg30 ?? trend];
        } catch {
          // Offline or rate limited: tried again on the next request for this card.
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, todo.length) }, worker));
    return out;
  }
}
