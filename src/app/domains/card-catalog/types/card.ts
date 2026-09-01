// Gedeeld, genormaliseerd kaartmodel — zie docs/design-docs/core-beliefs.md #1.
// Elke CardProvider (src/app/providers/card-provider.ts) normaliseert naar dit model.
// Dit is de expliciete interface waarmee andere domeinen (collection, valuation,
// trade-analyzer) een kaart kennen, zonder ooit een TCG-specifiek veld te zien.

export type TcgId = 'pokemon' | 'magic';

export type CardVariant = 'normal' | 'foil' | 'reverseFoil' | 'other';

export interface Card {
  id: string;
  tcg: TcgId;
  externalId: string;
  name: string;
  setCode: string;
  setName: string;
  cardNumber: string;
  variant: CardVariant;
  imageUrl: string;
  rarity: string;
}

export interface PriceSnapshot {
  cardId: string;
  // Uitgebreid t.o.v. de oorspronkelijke definitie in core-beliefs.md: cardId identificeert
  // een printing, niet een specifieke variant (zie CardVariant op Card) — zonder dit veld
  // is een lijst van prijzen voor dezelfde kaart niet naar variant te herleiden. Zie
  // docs/exec-plans/active/02-full-v1-site.md "Beslissingen tijdens uitvoering".
  variant: CardVariant;
  currency: 'EUR' | 'USD';
  price: number;
  asOf: string;
  source: TcgId;
}
