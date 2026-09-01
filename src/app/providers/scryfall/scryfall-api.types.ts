// Ruwe response-vorm van de Scryfall API (alleen de velden die deze provider gebruikt).
// Zie docs/references/scryfall-api.md voor de volledige mapping naar het interne
// Card-model. Nooit doorgeven buiten deze provider — zie CLAUDE.md "Data parsen, niet
// valideren".
export interface ScryfallApiCardFace {
  name: string;
  image_uris?: {
    large: string;
  };
}

export interface ScryfallApiCard {
  id: string;
  name: string;
  set: string;
  set_name: string;
  collector_number: string;
  rarity: string;
  // Dubbelzijdige kaarten (transform/modal, layout bv. 'transform') hebben geen
  // top-level image_uris — de afbeelding zit dan per zijde in card_faces.
  image_uris?: {
    large: string;
  };
  card_faces?: ScryfallApiCardFace[];
  prices: {
    usd: string | null;
    usd_foil: string | null;
    eur: string | null;
    eur_foil: string | null;
  };
}

export interface ScryfallApiCardListResponse {
  data: ScryfallApiCard[];
}
