# Exec-plan: Card catalog (zoeken + browsen)

Status: Voltooid
Domein(en): card-catalog

## Doel

Een gebruiker kan op naam zoeken naar kaarten over Pokémon én Magic heen, de resultaten
bekijken als kaart-vormige tegels (DESIGN.md), en één kaart in detail bekijken (varianten).
Prijs in de detailweergave is bewust **niet** in scope van dit plan — dat raakt de nog open
vragen over prijscache/wisselkoers uit `docs/design-docs/core-beliefs.md` en hoort bij het
`valuation`-domein.

## Stappen

- [x] `card-catalog/config`: registry van actieve `CardProvider`s + resultatenlimiet per
      provider (lost de "Nog niet opgelost"-vraag in `docs/product-specs/card-catalog.md`
      op — zie beslissingen).
- [x] `PokemonTcgProvider.getById` afmaken (was een placeholder-error sinds
      00-foundation.md).
- [x] `MagicProvider` (Scryfall) bouwen: `search`, `getById`, mapping conform
      `docs/references/scryfall-api.md`, inclusief de dubbelzijdige-kaart-uitzondering.
      `getPrice` blijft een placeholder-error, net als bij `PokemonTcgProvider` (prijs is
      uit scope, zie Doel).
- [x] Fixtures voor Scryfall toevoegen (`test/fixtures/scryfall-api/`): normale kaart +
      dubbelzijdige kaart, conform `.claude/skills/provider-fixtures/`. Ook een
      nul-resultaten-fixture toegevoegd (Scryfall geeft 404 bij geen matches, geen 200 met
      lege array — zie beslissingen) en een `card-by-id.json` voor Pokémon.
- [x] `card-catalog/service`: `CardCatalogService.search(query, filter?)` roept alle
      geregistreerde providers parallel aan, respecteert de resultatenlimiet per provider,
      geeft één samengevoegde `Card[]`-lijst terug. `getCardDetail(tcg, externalId)` roept de
      juiste provider's `getById`.
- [x] `card-catalog/ui`: zoekscherm (input + TCG-filter), resultaten als kaart-vormige
      tegels (`--radius-card`, 2.5:3.5), kaartdetail. Route toegevoegd in `app.routes.ts`
      (`''` → zoeken, `cards/:tcg/:externalId` → detail). Randkleur-per-variant bewust
      neutraal gehouden — zie beslissingen.
- [x] Attributie conform `docs/references/api-terms.md`: voetregel in `app.html` met
      creditering + disclaimer.
- [x] Tests: service (aggregatie, limiet-per-provider, falende provider blokkeert de rest
      niet), providers (fixtures + smoke tests), UI-componenten (gedrag: hint-staat, lege
      staat, resultaten tonen, provider-foutbanner, route-navigatie).
- [x] `.claude/skills/browser-validate/` uitgevoerd: zoekscherm + kaartdetail gevalideerd in
      licht én donker thema (via `data-theme`, nog geen toggle-UI), geen consolefouten.
      Live gezien: Pokémon TCG API faalde tijdens het testen (bekende flakiness) — de
      foutbanner werkte precies zoals bedoeld, Scryfall-resultaten bleven zichtbaar.
- [x] `.claude/skills/architecture-check/` uitgevoerd vóór afronding — geen afwijkingen.
- [x] `docs/product-specs/card-catalog.md` bijgewerkt: status Concept → v1, "Nog niet
      opgelost" opgelost, prijs + meerdere-varianten expliciet als uitgesteld vermeld.

## Beslissingen tijdens uitvoering

- **Resultatenlimiet per provider**: vast maximum van 20 per bron (`CARD_SEARCH_RESULT_LIMIT_PER_PROVIDER`),
  toegepast in de Service na aggregatie (niet als API-parameter) — simpel, geen per-bron
  paginering-logica nodig. Lost de "Nog niet opgelost"-vraag in het product-spec op.
- **`Card`/`PriceSnapshot`/`TcgId`/`CardVariant` wonen in `card-catalog/types`**, niet in
  `providers/`. Card-catalog's rol is expliciet "normaliseren over alle TCG's heen"
  (ARCHITECTURE.md), en `core-beliefs.md` noemt `Card` letterlijk het gedeelde model tussen
  domeinen — dat is de expliciete interface die ARCHITECTURE.md's cross-domein-regel toestaat.
  `providers/card-provider.ts` importeert dit type dus vanuit card-catalog.
- **`CARD_PROVIDERS`-DI-token** (`src/app/providers/card-providers.provider.ts`) registreert
  de concrete providers op precies één plek (de composition root); `CardCatalogService`
  injecteert alleen de `CardProvider`-interface (dependency inversion).
- **Falende provider blokkeert de andere niet**: `search()` gebruikt `Promise.allSettled`,
  niet `Promise.all`. Retourneert `{ cards, failedTcgs }` zodat de UI expliciet kan tonen
  welke bron faalde (DESIGN.md: "zegt exact wat er misging"), zonder de succesvolle
  resultaten te verbergen. Ontstaan uit direct geobserveerde flakiness van de Pokémon TCG
  API tijdens het bouwen (herhaaldelijk 500/502, ook tijdens browser-validatie).
- **Scryfall geeft 404 bij nul zoekresultaten**, geen 200 met lege `data`-array — expliciet
  afgehandeld in `MagicProvider.search()` (anders zou een gewone "geen resultaten"-zoekopdracht
  als error worden behandeld).
- **Scryfall User-Agent-header**: eerst aangenomen dat dit puur onmogelijk was vanuit de
  browser (forbidden header). Bij het bouwen bleek Scryfall een *generieke* library-default
  User-Agent hard af te wijzen (400 `generic_user_agent`) — in een échte browser stuurt de
  browser altijd zijn eigen, niet-generieke UA (voldoet toevallig al aan Scryfall's regel),
  maar server-side/Node (smoke tests) wordt de expliciete header wel echt gebruikt. Zie
  `docs/exec-plans/tech-debt-tracker.md`.
- **Variant-randkleur op de kaarttegel bewust neutraal** (`--text-muted`), niet
  `--accent-primary`: DESIGN.md reserveert die kleur expliciet voor precies twee dingen
  (holo-sweep + primaire CTA) — "niet strooien over badges". Zolang elke variant toch
  `'normal'` is, is er ook niets te differentiëren; een echte variant-kleurcode volgt zodra
  variant-detectie er is, dan eerst toevoegen aan DESIGN.md's tokenschaal.
- **Bronvermelding (Scryfall/Pokémon TCG API) in de app-footer** (`app.html`), niet in een
  apart instellingen-/over-scherm — dat scherm bestaat nog niet. Te verplaatsen zodra er wel
  een over-scherm is.
- **Zoekpagina is de landingspagina** (route `''`), aangezien card-catalog voorlopig het
  enige domein is. Verandert zodra er een dashboard/collectie-startpagina komt.
- **Kaartdetail toont één variant, niet "alle bekende varianten"** zoals het oorspronkelijke
  product-spec-Concept beschreef — providers normaliseren nog geen meerdere varianten per
  kaart (zie tech-debt-tracker). Product-spec bijgewerkt om dit expliciet te maken i.p.v.
  stilzwijgend af te wijken van het Concept.

## Afronding

Zoeken + browsen + kaartdetail werkt end-to-end, handmatig gevalideerd via de browser-tooling
in licht én donker thema (inclusief een live provider-failure tijdens het testen, die correct
werd afgehandeld). Providers zijn getest tegen echte, opgeslagen fixtures. Product-spec is
bijgewerkt. Verplaatst naar `completed/`.
