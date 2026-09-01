import { Injectable, inject } from '@angular/core';
import { CARD_PROVIDERS } from '../../../providers/card-providers.provider';
import { CardProvider } from '../../../providers/card-provider';
import { CARD_SEARCH_RESULT_LIMIT_PER_PROVIDER } from '../config/card-search.config';
import { Card, TcgId } from '../types/card';
import { CardSearchResult } from '../types/card-search-result';

// Enige service die CardProvider aanroept (zie docs/governance/ARCHITECTURE.md). Hangt af
// van de CardProvider-interface via het CARD_PROVIDERS-token, nooit van een concrete
// implementatie (dependency inversion).
@Injectable({ providedIn: 'root' })
export class CardCatalogService {
  private readonly providers = inject<CardProvider[]>(CARD_PROVIDERS);

  async search(query: string, tcgFilter?: TcgId): Promise<CardSearchResult> {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return { cards: [], failedTcgs: [] };
    }

    const providersToQuery = tcgFilter ? this.providers.filter((provider) => provider.tcg === tcgFilter) : this.providers;

    const outcomes = await Promise.allSettled(
      providersToQuery.map((provider) =>
        provider.search(trimmedQuery).then((cards) => cards.slice(0, CARD_SEARCH_RESULT_LIMIT_PER_PROVIDER)),
      ),
    );

    const cards: Card[] = [];
    const failedTcgs: TcgId[] = [];

    outcomes.forEach((outcome, index) => {
      if (outcome.status === 'fulfilled') {
        cards.push(...outcome.value);
      } else {
        failedTcgs.push(providersToQuery[index].tcg);
      }
    });

    return { cards, failedTcgs };
  }

  // async zodat een ontbrekende provider een promise-rejection oplevert (consistent met de
  // rest van de interface), in plaats van synchroon te gooien.
  async getCardDetail(tcg: TcgId, externalId: string): Promise<Card | null> {
    const provider = this.providers.find((candidate) => candidate.tcg === tcg);

    if (!provider) {
      throw new Error(`Geen CardProvider geregistreerd voor tcg "${tcg}".`);
    }

    return provider.getById(externalId);
  }
}
