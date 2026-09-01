# Card catalog

Status: v1 (zoeken + browsen + kaartdetail — zie `docs/exec-plans/completed/01-card-catalog.md`)

## Doel

Gebruiker kan kaarten zoeken over meerdere TCG's heen en een kaart selecteren om te bekijken.
Toevoegen aan een collectie volgt zodra het `collection`-domein bestaat.

## Functionaliteit v1

- Zoeken op naam, optioneel gefilterd op TCG (Pokémon/Magic/alle).
- Resultaten tonen: kaart-vormige tegels (afbeelding, naam, set) — zie DESIGN.md.
- Detail van één kaart: naam, set, kaartnummer, zeldzaamheid, variant.
- Faalt één bron (bv. de bekende reliability-issues van de Pokémon TCG API) dan blijven de
  resultaten van de andere bron(nen) zichtbaar, met een expliciete melding welke bron
  faalde — geen silent failure, geen blokkade van de rest.
- Bronvermelding (Pokémon TCG API, Scryfall) + disclaimer dat Cardcase niet officieel
  gelieerd is, zichtbaar in de footer van de app (conform `docs/references/api-terms.md`).

## Expliciet uitgesteld (niet in v1)

- **Prijs.** `CardProvider.getPrice()` is een placeholder-error bij beide providers. Prijs
  raakt de nog open vragen over prijscache/wisselkoers in `docs/design-docs/core-beliefs.md`
  en hoort bij het `valuation`-domein.
- **Meerdere varianten per kaart.** `Card.variant` staat altijd op `'normal'` — providers
  detecteren nog geen foil/reverseFoil (zie `docs/exec-plans/tech-debt-tracker.md`). De
  kaartdetail toont dus één variant, niet "alle bekende varianten" zoals het oorspronkelijke
  Concept beschreef.
- Filteren op set (alleen TCG-filter is er nu).

## Databronnen

- Pokémon: [Pokémon TCG API](https://pokemontcg.io/) — `PokemonTcgProvider`
  (`src/app/providers/pokemon-tcg/`), zie `docs/references/pokemon-tcg-api.md`.
- Magic: [Scryfall API](https://scryfall.com/docs/api) — `MagicProvider`
  (`src/app/providers/scryfall/`), zie `docs/references/scryfall-api.md`.

Elke bron heeft een eigen `CardProvider`-implementatie (zie `docs/governance/ARCHITECTURE.md`).
`CardCatalogService` (`src/app/domains/card-catalog/service/`) roept alle geregistreerde
providers parallel aan en voegt de resultaten samen tot één lijst van genormaliseerde
`Card`-objecten, met een resultatenlimiet per provider
(`CARD_SEARCH_RESULT_LIMIT_PER_PROVIDER`, `card-catalog/config/`).

## Opgelost (was "Nog niet opgelost")

- **Resultatenlimiet per provider**: vast maximum per bron (20), geen dynamische verdeling.
  Simpel en voorspelbaar; te herzien als 20 in de praktijk te weinig/te veel blijkt.
- **Fuzzy matching / typo-tolerantie**: leunt volledig op wat elke API zelf biedt (Pokémon TCG
  API's Lucene-achtige `q`-syntax met trailing wildcard, Scryfall's eigen zoeksyntax) — geen
  eigen implementatie hierbovenop.
