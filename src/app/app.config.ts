import { ApplicationConfig, inject, isDevMode, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';
import { CatalogService } from './core/catalog';
import { loadFirebaseConfig } from './core/firebase.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Caches the app and catalog for offline use and fast startup; production builds only.
    provideServiceWorker('ngsw-worker.js', { enabled: !isDevMode(), registrationStrategy: 'registerWhenStable:30000' }),
    // The store builds its initial state from the catalog and the auth setup, so load both before the app renders.
    provideAppInitializer(() => {
      const catalog = inject(CatalogService);
      return Promise.all([catalog.load(), loadFirebaseConfig()]);
    }),
  ],
};
