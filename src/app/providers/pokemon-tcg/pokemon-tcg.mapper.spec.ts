import { describe, expect, it } from 'vitest';
import normalCardFixture from '../../../../test/fixtures/pokemon-tcg-api/normal-card.json';
import cardWithPriceVariantsFixture from '../../../../test/fixtures/pokemon-tcg-api/card-with-price-variants.json';
import { PokemonTcgApiCard, PokemonTcgApiCardListResponse, PokemonTcgApiCardResponse } from './pokemon-tcg-api.types';
import { toCard, toPriceSnapshot } from './pokemon-tcg.mapper';

// Fixture = echte, opgeslagen Pokémon TCG API-response (zie
// .claude/skills/provider-fixtures/SKILL.md), niet een handgeschreven object.
describe('toCard', () => {
  it('normaliseert een echte Pokémon TCG API-response naar het interne Card-model', () => {
    const response = normalCardFixture as PokemonTcgApiCardListResponse;
    const [apiCard] = response.data;

    const card = toCard(apiCard);

    expect(card).toEqual({
      id: `pokemon:${apiCard.id}`,
      tcg: 'pokemon',
      externalId: apiCard.id,
      name: apiCard.name,
      setCode: apiCard.set.id,
      setName: apiCard.set.name,
      cardNumber: apiCard.number,
      variant: 'normal',
      imageUrl: apiCard.images.large,
      rarity: apiCard.rarity,
    });
  });
});

describe('toPriceSnapshot', () => {
  const apiCard = (cardWithPriceVariantsFixture as PokemonTcgApiCardResponse).data as PokemonTcgApiCard;

  it('leest de market-prijs voor de normal-variant uit tcgplayer.prices', () => {
    const card = { ...toCard(apiCard), variant: 'normal' as const };

    const snapshot = toPriceSnapshot(card, apiCard);

    expect(snapshot).toEqual({
      cardId: card.id,
      variant: 'normal',
      currency: 'USD',
      price: apiCard.tcgplayer?.prices?.['normal'].market,
      asOf: apiCard.tcgplayer?.updatedAt.replaceAll('/', '-'),
      source: 'pokemon',
    });
  });

  it('leest de market-prijs voor de reverseFoil-variant (reverseHolofoil bij tcgplayer)', () => {
    const card = { ...toCard(apiCard), variant: 'reverseFoil' as const };

    const snapshot = toPriceSnapshot(card, apiCard);

    expect(snapshot.price).toBe(apiCard.tcgplayer?.prices?.['reverseHolofoil'].market);
  });

  it('gooit een duidelijke error als de variant geen prijs heeft', () => {
    const card = { ...toCard(apiCard), variant: 'foil' as const };

    expect(() => toPriceSnapshot(card, apiCard)).toThrow(/foil/);
  });
});
