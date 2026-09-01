import { describe, expect, it } from 'vitest';
import doubleFacedCardFixture from '../../../../test/fixtures/scryfall-api/double-faced-card.json';
import normalCardFixture from '../../../../test/fixtures/scryfall-api/normal-card.json';
import { ScryfallApiCard, ScryfallApiCardListResponse } from './scryfall-api.types';
import { toCard } from './scryfall.mapper';

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
