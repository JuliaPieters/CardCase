import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { CatalogService } from './core/catalog';
import { loadFirebaseConfig } from './core/firebase.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // The store builds its initial state from the catalog and the auth setup, so load both before the app renders.
    provideAppInitializer(() => {
      const catalog = inject(CatalogService);
      return Promise.all([catalog.load(), loadFirebaseConfig()]);
    }),
  ],
};
