import { Card, CardVariant, PriceSnapshot } from '../../domains/card-catalog/types/card';
import { PokemonTcgApiCard } from './pokemon-tcg-api.types';

// Mapping conform docs/references/pokemon-tcg-api.md. `variant` is hier altijd 'normal':
// welke varianten (foil/reverseFoil) beschikbaar zijn staat in `tcgplayer.prices`, gebruikt
// door toPriceSnapshot hieronder — search()/getById() geven zelf nog steeds de kaart als
// geheel terug, niet één Card per variant (zie docs/exec-plans/tech-debt-tracker.md).
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

// tcgplayer.prices-sleutels → intern CardVariant, zie docs/references/pokemon-tcg-api.md
// "tcgplayer.prices.* | bron voor PriceSnapshot".
const TCGPLAYER_PRICE_KEY_BY_VARIANT: Record<Exclude<CardVariant, 'other'>, string> = {
  normal: 'normal',
  foil: 'holofoil',
  reverseFoil: 'reverseHolofoil',
};

export function toPriceSnapshot(card: Card, apiCard: PokemonTcgApiCard): PriceSnapshot {
  const priceKey = card.variant === 'other' ? undefined : TCGPLAYER_PRICE_KEY_BY_VARIANT[card.variant];
  const entry = priceKey ? apiCard.tcgplayer?.prices?.[priceKey] : undefined;
  const price = entry?.market ?? entry?.mid;

  if (price == null) {
    throw new Error(`Geen tcgplayer-prijs voor "${apiCard.name}" (${apiCard.id}), variant "${card.variant}".`);
  }

  return {
    cardId: card.id,
    variant: card.variant,
    currency: 'USD',
    price,
    asOf: (apiCard.tcgplayer?.updatedAt ?? new Date().toISOString().slice(0, 10)).replaceAll('/', '-'),
    source: 'pokemon',
  };
}
