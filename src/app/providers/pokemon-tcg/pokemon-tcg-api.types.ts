// Ruwe response-vorm van de Pokémon TCG API (alleen de velden die deze provider gebruikt).
// Zie docs/references/pokemon-tcg-api.md voor de volledige mapping naar het interne
// Card-model. Nooit doorgeven buiten deze provider — zie CLAUDE.md "Data parsen, niet
// valideren".
export interface PokemonTcgApiTcgplayerPriceEntry {
  low: number | null;
  mid: number | null;
  high: number | null;
  market: number | null;
  directLow: number | null;
}

export interface PokemonTcgApiCard {
  id: string;
  name: string;
  number: string;
  rarity?: string;
  set: {
    id: string;
    name: string;
  };
  images: {
    large: string;
  };
  tcgplayer?: {
    url: string;
    updatedAt: string;
    prices?: Record<string, PokemonTcgApiTcgplayerPriceEntry>;
  };
}

export interface PokemonTcgApiCardListResponse {
  data: PokemonTcgApiCard[];
}

export interface PokemonTcgApiCardResponse {
  data: PokemonTcgApiCard;
}
