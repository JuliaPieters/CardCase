import { Card } from '../../domains/card-catalog/types/card';
import { PokemonTcgApiCard } from './pokemon-tcg-api.types';

// Mapping conform docs/references/pokemon-tcg-api.md. `variant` is hier altijd 'normal':
// welke varianten (foil/reverseFoil) beschikbaar zijn staat in `tcgplayer.prices`, dat pas
// gebruikt wordt zodra card-catalog varianten daadwerkelijk aanbiedt — nog niet in deze
// dummy-implementatie (zie exec-plan 00-foundation.md).
//
// `id` is hier een samengestelde placeholder (`tcg:externalId`) in plaats van een echte
// uuid: die wordt pas toegekend zodra een kaart de card-catalog-repo binnenkomt.
export function toCard(apiCard: PokemonTcgApiCard): Card {
  return {
    id: `pokemon:${apiCard.id}`,
    tcg: 'pokemon',
    externalId: apiCard.id,
    name: apiCard.name,
    setCode: apiCard.set.id,
    setName: apiCard.set.name,
    cardNumber: apiCard.number,
    variant: 'normal',
    imageUrl: apiCard.images.large,
    rarity: apiCard.rarity ?? 'unknown',
  };
}
