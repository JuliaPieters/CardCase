import { Card, PriceSnapshot } from '../../domains/card-catalog/types/card';
import { ScryfallApiCard } from './scryfall-api.types';

// Mapping conform docs/references/scryfall-api.md. `variant` is hier altijd 'normal': welke
// varianten beschikbaar zijn staat in `prices.*_foil`, gebruikt door toPriceSnapshot
// hieronder — search()/getById() geven zelf nog steeds de kaart als geheel terug, niet één
// Card per variant (zie docs/exec-plans/tech-debt-tracker.md).
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

// EUR als voorkeur (Nederlandse gebruiker), USD als terugval — Scryfall geeft beide direct,
// geen conversie nodig (zie docs/references/scryfall-api.md). 'reverseFoil' bestaat niet als
// Scryfall-concept, dus die variant heeft nooit een prijs.
export function toPriceSnapshot(card: Card, apiCard: ScryfallApiCard): PriceSnapshot {
  if (card.variant !== 'normal' && card.variant !== 'foil') {
    throw new Error(`Scryfall kent geen variant "${card.variant}".`);
  }

  const { prices } = apiCard;
  const isFoil = card.variant === 'foil';

  const eur = isFoil ? prices.eur_foil : prices.eur;
  const usd = isFoil ? prices.usd_foil : prices.usd;

  const [currency, price] = eur ? (['EUR', eur] as const) : usd ? (['USD', usd] as const) : [null, null];

  if (!currency || price === null) {
    throw new Error(`Geen Scryfall-prijs voor "${apiCard.name}" (${apiCard.id}), variant "${card.variant}".`);
  }

  return {
    cardId: card.id,
    variant: card.variant,
    currency,
    price: Number(price),
    // Scryfall geeft geen per-kaart prijs-tijdstempel; dit is het moment van opvragen.
    asOf: new Date().toISOString().slice(0, 10),
    source: 'magic',
  };
}
