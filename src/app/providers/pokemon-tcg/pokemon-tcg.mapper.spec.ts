import { describe, expect, it } from 'vitest';
import normalCardFixture from '../../../../test/fixtures/pokemon-tcg-api/normal-card.json';
import { PokemonTcgApiCardListResponse } from './pokemon-tcg-api.types';
import { toCard } from './pokemon-tcg.mapper';

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
