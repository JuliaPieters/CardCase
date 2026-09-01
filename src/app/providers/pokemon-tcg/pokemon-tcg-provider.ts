import { Card, PriceSnapshot, TcgId } from '../../domains/card-catalog/types/card';
import { CardProvider } from '../card-provider';
import { PokemonTcgApiCardListResponse, PokemonTcgApiCardResponse } from './pokemon-tcg-api.types';
import { toCard } from './pokemon-tcg.mapper';

// Zie docs/references/pokemon-tcg-api.md. `getPrice` blijft een placeholder-error: prijs is
// bewust buiten scope van 01-card-catalog.md (zie dat exec-plan) — dat raakt de nog open
// vragen over prijscache/wisselkoers in core-beliefs.md en hoort bij `valuation`.
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

  async getById(externalId: string): Promise<Card | null> {
    const response = await fetch(`${this.baseUrl}/cards/${encodeURIComponent(externalId)}`);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Pokémon TCG API getById mislukt: ${response.status} ${response.statusText}`);
    }

    const body = (await response.json()) as PokemonTcgApiCardResponse;
    return toCard(body.data);
  }

  getPrice(_card: Card): Promise<PriceSnapshot> {
    throw new Error('PokemonTcgProvider.getPrice is bewust nog niet geïmplementeerd (zie 01-card-catalog.md, "Doel").');
  }
}
