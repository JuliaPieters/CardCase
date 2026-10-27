import type { GameModule } from '../registry';
import type { CardKey, CardSource, LoadedCatalog, PriceEntry } from '../types';

/** Being built on the lorcana branch (docs/implementatieplan.md, stap 4a). */
class LorcanaSource implements CardSource {
  readonly game = 'lorcana' as const;

  // TODO: build public/catalogs/lorcana.json with scripts/sync-lorcana.mjs.
  async loadCatalog(): Promise<LoadedCatalog> {
    return { sets: [], cards: [], version: '' };
  }

  // TODO: prices.
  async getPrices(): Promise<Record<CardKey, PriceEntry>> {
    return {};
  }
}

export default {
  config: { game: 'lorcana', languages: [{ code: 'EN', label: 'Engels' }], types: {}, rarities: {}, basicRarities: [] },
  source: new LorcanaSource(),
} satisfies GameModule;
