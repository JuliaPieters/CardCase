import { registerLocaleData } from '@angular/common';
import localeNl from '@angular/common/locales/nl';
import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideFirebase } from './providers/firebase/firebase-app.provider';
import { provideCardProviders } from './providers/card-providers.provider';

// Documentatie in het Nederlands (CLAUDE.md), dus ook de app-locale: correcte
// getal-/valutanotatie (bv. "€ 1,23" i.p.v. "$1.23") voor prijzen en later portfoliowaarde.
registerLocaleData(localeNl);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideFirebase(),
    provideCardProviders(),
    { provide: LOCALE_ID, useValue: 'nl-NL' },
  ]
};
