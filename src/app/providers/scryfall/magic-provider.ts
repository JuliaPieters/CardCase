import { Card, PriceSnapshot, TcgId } from '../../domains/card-catalog/types/card';
import { CardProvider } from '../card-provider';
import { ScryfallApiCard, ScryfallApiCardListResponse } from './scryfall-api.types';
import { toCard, toPriceSnapshot } from './scryfall.mapper';

// Zie docs/references/scryfall-api.md.
//
// User-Agent: Scryfall wijst een "generieke" User-Agent (het HTTP-library-default, bv.
// Node's eigen fetch-UA) hard af met een 400 ("generic_user_agent"). In een échte browser
// is `User-Agent` een forbidden header die scripts niet mogen overschrijven — de browser
// stuurt dan altijd zijn eigen, niet-generieke UA, en dat voldoet al aan Scryfall's regel.
// Deze header hieronder is dus vooral relevant buiten de browser (bv. de smoke test/Node);
// in de browser wordt 'm genegeerd, niet als fout.
export class MagicProvider implements CardProvider {
  readonly tcg: TcgId = 'magic';

  private readonly baseUrl = 'https://api.scryfall.com';
  private readonly headers = {
    Accept: 'application/json',
    'User-Agent': 'Cardcase/0.0.0 (+https://github.com/JuliaPieters/CardCase; hobbyproject, niet-commercieel)',
  };

  async search(query: string): Promise<Card[]> {
    const response = await fetch(`${this.baseUrl}/cards/search?q=${encodeURIComponent(`name:${query}`)}`, {
      headers: this.headers,
    });

    // Scryfall geeft 404 bij nul resultaten (geen 200 met lege data-array).
    if (response.status === 404) {
      return [];
    }

    if (!response.ok) {
      throw new Error(`Scryfall search mislukt: ${response.status} ${response.statusText}`);
    }

    const body = (await response.json()) as ScryfallApiCardListResponse;
    return body.data.map(toCard);
  }

  async getById(externalId: string): Promise<Card | null> {
    const apiCard = await this.fetchRawById(externalId);
    return apiCard ? toCard(apiCard) : null;
  }

  async getPrice(card: Card): Promise<PriceSnapshot> {
    const apiCard = await this.fetchRawById(card.externalId);

    if (!apiCard) {
      throw new Error(`Scryfall: kaart "${card.externalId}" niet gevonden voor prijsopvraag.`);
    }

    return toPriceSnapshot(card, apiCard);
  }

  private async fetchRawById(externalId: string): Promise<ScryfallApiCard | null> {
    const response = await fetch(`${this.baseUrl}/cards/${encodeURIComponent(externalId)}`, {
      headers: this.headers,
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Scryfall getById mislukt: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as ScryfallApiCard;
  }
}
