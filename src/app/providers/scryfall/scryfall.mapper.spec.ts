import { describe, expect, it } from 'vitest';
import doubleFacedCardFixture from '../../../../test/fixtures/scryfall-api/double-faced-card.json';
import normalCardFixture from '../../../../test/fixtures/scryfall-api/normal-card.json';
import cardWithPriceVariantsFixture from '../../../../test/fixtures/scryfall-api/card-with-price-variants.json';
import { ScryfallApiCard, ScryfallApiCardListResponse } from './scryfall-api.types';
import { toCard, toPriceSnapshot } from './scryfall.mapper';

// Fixtures = echte, opgeslagen Scryfall-responses (zie
// .claude/skills/provider-fixtures/SKILL.md), niet handgeschreven objecten.
describe('toCard', () => {
  it('normaliseert een normale (enkelzijdige) kaart', () => {
    const response = normalCardFixture as ScryfallApiCardListResponse;
    const [apiCard] = response.data;

    const card = toCard(apiCard);

    expect(card).toEqual({
      id: `magic:${apiCard.id}`,
      tcg: 'magic',
      externalId: apiCard.id,
      name: apiCard.name,
      setCode: apiCard.set,
      setName: apiCard.set_name,
      cardNumber: apiCard.collector_number,
      variant: 'normal',
      imageUrl: apiCard.image_uris?.large,
      rarity: apiCard.rarity,
    });
  });

  it('gebruikt de afbeelding van de voorzijde bij een dubbelzijdige kaart (geen top-level image_uris)', () => {
    const apiCard = doubleFacedCardFixture as ScryfallApiCard;
    expect(apiCard.image_uris).toBeUndefined();
    expect(apiCard.card_faces?.length).toBeGreaterThan(0);

    const card = toCard(apiCard);

    expect(card.imageUrl).toBe(apiCard.card_faces?.[0].image_uris?.large);
    expect(card.name).toBe(apiCard.name);
  });
});

describe('toPriceSnapshot', () => {
  const apiCard = cardWithPriceVariantsFixture as ScryfallApiCard;

  it('geeft de EUR-prijs voor de normal-variant (EUR heeft voorkeur boven USD)', () => {
    const card = { ...toCard(apiCard), variant: 'normal' as const };

    const snapshot = toPriceSnapshot(card, apiCard);

    expect(snapshot.currency).toBe('EUR');
    expect(snapshot.price).toBe(Number(apiCard.prices.eur));
  });

  it('geeft de EUR-foil-prijs voor de foil-variant', () => {
    const card = { ...toCard(apiCard), variant: 'foil' as const };

    const snapshot = toPriceSnapshot(card, apiCard);

    expect(snapshot.currency).toBe('EUR');
    expect(snapshot.price).toBe(Number(apiCard.prices.eur_foil));
  });

  it('gooit een duidelijke error voor een variant die Scryfall niet kent', () => {
    const card = { ...toCard(apiCard), variant: 'reverseFoil' as const };

    expect(() => toPriceSnapshot(card, apiCard)).toThrow(/reverseFoil/);
  });
});
