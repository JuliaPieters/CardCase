import { Card, PriceSnapshot, TcgId } from '../domains/card-catalog/types/card';

// Zie docs/governance/ARCHITECTURE.md "De belangrijkste provider: CardProvider". Elke ondersteunde TCG
// implementeert deze interface en normaliseert naar het gedeelde Card-model. Domeinlogica
// (via Service) hangt af van deze interface, nooit van een concrete implementatie
// (dependency inversion, zie docs/governance/QUALITY.md SOLID).
export interface CardProvider {
  readonly tcg: TcgId;
  search(query: string): Promise<Card[]>;
  getById(externalId: string): Promise<Card | null>;
  getPrice(card: Card): Promise<PriceSnapshot>;
}
