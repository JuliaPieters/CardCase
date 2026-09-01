import { describe, expect, it } from 'vitest';
import { PokemonTcgProvider } from './pokemon-tcg-provider';

// Losse, handmatig te draaien smoke test tegen de échte Pokémon TCG API — zie docs/governance/QUALITY.md
// ("geen tests die bij elke run de echte externe API raken"). Draai bewust met:
//   RUN_SMOKE_TESTS=1 npm test
describe.skipIf(!process.env['RUN_SMOKE_TESTS'])('PokemonTcgProvider (smoke test, live API)', () => {
  it(
    'vindt echte kaarten voor "pikachu"',
    async () => {
      const provider = new PokemonTcgProvider();

      const cards = await provider.search('pikachu');

      expect(cards.length).toBeGreaterThan(0);
      expect(cards[0]).toMatchObject({ tcg: 'pokemon' });
    },
    // Zonder API-key is de rate limit (en daarmee de latency) laag — zie
    // docs/references/pokemon-tcg-api.md.
    15000,
  );
});
