import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders } from '@angular/core';
import { CardProvider } from './card-provider';
import { PokemonTcgProvider } from './pokemon-tcg/pokemon-tcg-provider';
import { MagicProvider } from './scryfall/magic-provider';

// Enige plek die weet welke CardProvider-implementaties bestaan (zie
// docs/governance/ARCHITECTURE.md, SOLID/dependency inversion in docs/governance/QUALITY.md
// — Service injecteert dit token, importeert nooit een concrete provider-klasse). Nieuwe TCG
// toevoegen = hier registreren, verder nergens.
export const CARD_PROVIDERS = new InjectionToken<CardProvider[]>('CARD_PROVIDERS');

export function provideCardProviders(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: CARD_PROVIDERS,
      useFactory: (): CardProvider[] => [new PokemonTcgProvider(), new MagicProvider()],
    },
  ]);
}
