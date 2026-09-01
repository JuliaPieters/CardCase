import { Routes } from '@angular/router';

// Card-catalog is voorlopig het enige domein, dus de zoekpagina is de landingspagina — zie
// docs/exec-plans/active/01-card-catalog.md, "Beslissingen tijdens uitvoering". Verandert
// zodra er een echte dashboard/collectie-pagina is.
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./domains/card-catalog/ui/card-search/card-search').then((m) => m.CardSearch),
  },
  {
    path: 'cards/:tcg/:externalId',
    loadComponent: () => import('./domains/card-catalog/ui/card-detail/card-detail').then((m) => m.CardDetail),
  },
];
