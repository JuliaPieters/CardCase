import { Card, PriceSnapshot, TcgId } from '../../domains/card-catalog/types/card';
import { CardProvider } from '../card-provider';
import { PokemonTcgApiCard, PokemonTcgApiCardListResponse, PokemonTcgApiCardResponse } from './pokemon-tcg-api.types';
import { toCard, toPriceSnapshot } from './pokemon-tcg.mapper';

// Zie docs/references/pokemon-tcg-api.md.
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
    const apiCard = await this.fetchRawById(externalId);
    return apiCard ? toCard(apiCard) : null;
  }

  async getPrice(card: Card): Promise<PriceSnapshot> {
    const apiCard = await this.fetchRawById(card.externalId);

    if (!apiCard) {
      throw new Error(`Pokémon TCG API: kaart "${card.externalId}" niet gevonden voor prijsopvraag.`);
    }

    return toPriceSnapshot(card, apiCard);
  }

  private async fetchRawById(externalId: string): Promise<PokemonTcgApiCard | null> {
    const response = await fetch(`${this.baseUrl}/cards/${encodeURIComponent(externalId)}`);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Pokémon TCG API getById mislukt: ${response.status} ${response.statusText}`);
    }

    const body = (await response.json()) as PokemonTcgApiCardResponse;
    return body.data;
  }
}
