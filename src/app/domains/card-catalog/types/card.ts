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
  currency: 'EUR' | 'USD';
  price: number;
  asOf: string;
  source: TcgId;
}
