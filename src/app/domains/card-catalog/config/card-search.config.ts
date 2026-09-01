// Lost de "Nog niet opgelost"-vraag in docs/product-specs/card-catalog.md op: elke
// geregistreerde CardProvider levert maximaal dit aantal resultaten per zoekopdracht.
// Geen complexe verdeling over providers — elke bron krijgt hetzelfde, vaste maximum. Zie
// docs/exec-plans/completed/01-card-catalog.md, "Beslissingen tijdens uitvoering".
export const CARD_SEARCH_RESULT_LIMIT_PER_PROVIDER = 20;

// De zoekpagina toont bij binnenkomst meteen voorbeeldkaarten (zie
// docs/exec-plans/active/02-full-v1-site.md "Beslissingen tijdens uitvoering") i.p.v. een
// lege pagina. 'dragon' levert bij zowel de Pokémon TCG API als Scryfall herkenbare, rijke
// resultaten op — geverifieerd tijdens het bouwen, geen willekeurige keuze.
export const CARD_SEARCH_EXAMPLE_QUERY = 'dragon';
