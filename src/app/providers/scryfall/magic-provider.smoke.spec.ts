import { describe, expect, it } from 'vitest';
import { MagicProvider } from './magic-provider';

// Losse, handmatig te draaien smoke test tegen de échte Scryfall API — zie
// docs/governance/QUALITY.md ("geen tests die bij elke run de echte externe API raken").
// Draai bewust met:
//   RUN_SMOKE_TESTS=1 npm test
describe.skipIf(!process.env['RUN_SMOKE_TESTS'])('MagicProvider (smoke test, live API)', () => {
  it('vindt echte kaarten voor "shivan dragon"', async () => {
    const provider = new MagicProvider();

    const cards = await provider.search('shivan dragon');

    expect(cards.length).toBeGreaterThan(0);
    expect(cards[0]).toMatchObject({ tcg: 'magic' });
  });

  it('geeft een lege lijst terug voor een naam die niet bestaat', async () => {
    const provider = new MagicProvider();

    const cards = await provider.search('zzzznonexistentcardxyz123');

    expect(cards).toEqual([]);
  });

  it('haalt een dubbelzijdige kaart op en normaliseert die', async () => {
    const provider = new MagicProvider();

    const card = await provider.getById('6904ea20-e504-47da-95a0-08739fdde260');

    expect(card).toMatchObject({ tcg: 'magic', name: 'Delver of Secrets // Insectile Aberration' });
  });
});
