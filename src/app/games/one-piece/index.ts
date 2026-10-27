import type { GameModule } from '../registry';
import type { CardKey, CardSource, LoadedCatalog, PriceEntry } from '../types';

/** Not built yet (docs/implementatieplan.md, stap 4): the department is switched off in games/registry.ts. */
class OnePieceSource implements CardSource {
  readonly game = 'one-piece' as const;

  // TODO: choose a card data source and build public/catalogs/one-piece.json with a sync script.
  async loadCatalog(): Promise<LoadedCatalog> {
    return { sets: [], cards: [], version: '' };
  }

  // TODO: choose a price source (Cardmarket in EUR preferred).
  async getPrices(): Promise<Record<CardKey, PriceEntry>> {
    return {};
  }
}

export default {
  // TODO: languages, filters and binder recipes.
  config: { game: 'one-piece', languages: [{ code: 'EN', label: 'Engels' }] },
  source: new OnePieceSource(),
} satisfies GameModule;
