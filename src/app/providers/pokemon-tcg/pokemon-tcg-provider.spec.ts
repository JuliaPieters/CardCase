import { afterEach, describe, expect, it, vi } from 'vitest';
import cardByIdFixture from '../../../../test/fixtures/pokemon-tcg-api/card-by-id.json';
import cardWithPriceVariantsFixture from '../../../../test/fixtures/pokemon-tcg-api/card-with-price-variants.json';
import normalCardFixture from '../../../../test/fixtures/pokemon-tcg-api/normal-card.json';
import { PokemonTcgProvider } from './pokemon-tcg-provider';

// Unit tests met gemockte responses (echte, opgeslagen fixtures — zie
// .claude/skills/provider-fixtures/SKILL.md), zodat de provider zelf (envelope, statuscodes)
// getest wordt zonder de live API te raken. Zie pokemon-tcg-provider.smoke.spec.ts voor de
// losse, handmatig te draaien test tegen de échte API.
function stubFetchOnce(body: unknown, status = 200): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 404 ? 'Not Found' : 'OK',
      json: () => Promise.resolve(body),
    }),
  );
}

describe('PokemonTcgProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('search() normaliseert de resultatenlijst', async () => {
    stubFetchOnce(normalCardFixture);
    const provider = new PokemonTcgProvider();

    const cards = await provider.search('pikachu');

    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({ tcg: 'pokemon', name: 'Pikachu' });
  });

  it('getById() normaliseert een gevonden kaart', async () => {
    stubFetchOnce(cardByIdFixture);
    const provider = new PokemonTcgProvider();

    const card = await provider.getById('basep-1');

    expect(card).toMatchObject({ tcg: 'pokemon', externalId: 'basep-1', name: 'Pikachu' });
  });

  it('getById() geeft null terug bij een 404', async () => {
    stubFetchOnce({}, 404);
    const provider = new PokemonTcgProvider();

    const card = await provider.getById('bestaat-niet');

    expect(card).toBeNull();
  });

  it('getPrice() haalt de kaart opnieuw op en normaliseert de prijs voor de gevraagde variant', async () => {
    stubFetchOnce(cardWithPriceVariantsFixture);
    const provider = new PokemonTcgProvider();
    const card = await provider.getById('sm115-19');

    const priceSnapshot = await provider.getPrice({ ...card!, variant: 'reverseFoil' });

    expect(priceSnapshot).toMatchObject({ cardId: card!.id, currency: 'USD', source: 'pokemon' });
    expect(priceSnapshot.price).toBeGreaterThan(0);
  });
});
