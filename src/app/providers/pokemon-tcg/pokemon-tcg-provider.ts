import { Card, PriceSnapshot, TcgId } from '../../domains/card-catalog/types/card';
import { CardProvider } from '../card-provider';
import { PokemonTcgApiCardListResponse } from './pokemon-tcg-api.types';
import { toCard } from './pokemon-tcg.mapper';

// Zie docs/references/pokemon-tcg-api.md. Dummy-implementatie voor exec-plan
// 00-foundation.md: bewijst dat de laag-scheiding werkt (provider → genormaliseerd Card,
// nooit een ruwe API-response naar buiten) via één endpoint (search). `getById`/`getPrice`
// volgen zodra card-catalog dit domein daadwerkelijk bouwt — geen key nodig voor `search`,
// zij het met een lager rate limit (zie referentiebestand).
export class PokemonTcgProvider implements CardProvider {
  readonly tcg: TcgId = 'pokemon';

  private readonly baseUrl = 'https://api.pokemontcg.io/v2';

  async search(query: string): Promise<Card[]> {
    const response = await fetch(`${this.baseUrl}/cards?q=name:${encodeURIComponent(query)}*`);

    if (!response.ok) {
      throw new Error(`Pokémon TCG API search mislukt: ${response.status} ${response.statusText}`);
    }

    const body = (await response.json()) as PokemonTcgApiCardListResponse;
    return body.data.map(toCard);
  }

  getById(_externalId: string): Promise<Card | null> {
    throw new Error('PokemonTcgProvider.getById is nog niet geïmplementeerd (buiten scope van 00-foundation.md).');
  }

  getPrice(_card: Card): Promise<PriceSnapshot> {
    throw new Error('PokemonTcgProvider.getPrice is nog niet geïmplementeerd (buiten scope van 00-foundation.md).');
  }
}
