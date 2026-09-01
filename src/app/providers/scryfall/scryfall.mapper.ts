import { Card } from '../../domains/card-catalog/types/card';
import { ScryfallApiCard } from './scryfall-api.types';

// Mapping conform docs/references/scryfall-api.md. `variant` is hier altijd 'normal',
// dezelfde bewuste vereenvoudiging als bij PokemonTcgProvider (zie
// docs/exec-plans/tech-debt-tracker.md) — welke varianten beschikbaar zijn staat in
// `prices.*_foil`/`prices.*_etched`, dat nog niet gebruikt wordt.
export function toCard(apiCard: ScryfallApiCard): Card {
  return {
    id: `magic:${apiCard.id}`,
    tcg: 'magic',
    externalId: apiCard.id,
    name: apiCard.name,
    setCode: apiCard.set,
    setName: apiCard.set_name,
    cardNumber: apiCard.collector_number,
    variant: 'normal',
    imageUrl: imageUrlOf(apiCard),
    rarity: apiCard.rarity,
  };
}

function imageUrlOf(apiCard: ScryfallApiCard): string {
  const imageUrl = apiCard.image_uris?.large ?? apiCard.card_faces?.[0]?.image_uris?.large;

  if (!imageUrl) {
    throw new Error(`Scryfall-kaart "${apiCard.name}" (${apiCard.id}) heeft geen bruikbare afbeelding.`);
  }

  return imageUrl;
}
