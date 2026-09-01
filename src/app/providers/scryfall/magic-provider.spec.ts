import { afterEach, describe, expect, it, vi } from 'vitest';
import cardByIdFixture from '../../../../test/fixtures/scryfall-api/card-by-id.json';
import noResultsFixture from '../../../../test/fixtures/scryfall-api/no-results.json';
import normalCardFixture from '../../../../test/fixtures/scryfall-api/normal-card.json';
import { MagicProvider } from './magic-provider';

// Unit tests met gemockte responses (echte, opgeslagen fixtures — zie
// .claude/skills/provider-fixtures/SKILL.md). Zie magic-provider.smoke.spec.ts voor de
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

describe('MagicProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('search() normaliseert de resultatenlijst', async () => {
    stubFetchOnce(normalCardFixture);
    const provider = new MagicProvider();

    const cards = await provider.search('shivan dragon');

    expect(cards.length).toBeGreaterThan(0);
    expect(cards[0]).toMatchObject({ tcg: 'magic' });
  });

  it('search() geeft een lege lijst terug bij Scryfall\'s 404-"geen resultaten"', async () => {
    stubFetchOnce(noResultsFixture, 404);
    const provider = new MagicProvider();

    const cards = await provider.search('zzzznonexistentcardxyz123');

    expect(cards).toEqual([]);
  });

  it('getById() normaliseert een gevonden kaart', async () => {
    stubFetchOnce(cardByIdFixture);
    const provider = new MagicProvider();

    const card = await provider.getById('702c4781-670b-49ae-b511-90ed119841b0');

    expect(card).toMatchObject({ tcg: 'magic', name: 'Shivan Dragon' });
  });

  it('getById() geeft null terug bij een 404', async () => {
    stubFetchOnce({}, 404);
    const provider = new MagicProvider();

    const card = await provider.getById('bestaat-niet');

    expect(card).toBeNull();
  });
});
