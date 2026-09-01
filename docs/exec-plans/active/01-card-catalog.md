# Exec-plan: Card catalog (zoeken + browsen)

Status: Actief
Domein(en): card-catalog

## Doel

Een gebruiker kan op naam zoeken naar kaarten over Pokémon én Magic heen, de resultaten
bekijken als kaart-vormige tegels (DESIGN.md), en één kaart in detail bekijken (varianten).
Prijs in de detailweergave is bewust **niet** in scope van dit plan — dat raakt de nog open
vragen over prijscache/wisselkoers uit `docs/design-docs/core-beliefs.md` en hoort bij het
`valuation`-domein.

## Stappen

- [ ] `card-catalog/config`: registry van actieve `CardProvider`s + resultatenlimiet per
      provider (lost de "Nog niet opgelost"-vraag in `docs/product-specs/card-catalog.md`
      op — zie beslissingen).
- [ ] `PokemonTcgProvider.getById` afmaken (was een placeholder-error sinds
      00-foundation.md).
- [ ] `MagicProvider` (Scryfall) bouwen: `search`, `getById`, mapping conform
      `docs/references/scryfall-api.md`, inclusief de dubbelzijdige-kaart-uitzondering.
      `getPrice` blijft een placeholder-error, net als bij `PokemonTcgProvider` (prijs is
      uit scope, zie Doel).
- [ ] Fixtures voor Scryfall toevoegen (`test/fixtures/scryfall-api/`): normale kaart +
      dubbelzijdige kaart, conform `.claude/skills/provider-fixtures/`.
- [ ] `card-catalog/service`: `CardCatalogService.search(query, filter?)` roept alle
      geregistreerde providers parallel aan, respecteert de resultatenlimiet per provider,
      geeft één samengevoegde `Card[]`-lijst terug. `getCardDetail(tcg, externalId)` roept de
      juiste provider's `getById`.
- [ ] `card-catalog/ui`: zoekscherm (input + TCG-filter), resultaten als kaart-vormige
      tegels (`--radius-card`, 2.5:3.5, randkleur = variant), kaartdetail (varianten, geen
      prijs). Route toevoegen in `app.routes.ts`.
- [ ] Attributie conform `docs/references/api-terms.md`: zichtbare "data provided by
      Scryfall" + disclaimer dat Cardcase niet officieel gelieerd is.
- [ ] Tests: service (aggregatie, limiet-per-provider), providers (fixtures, zoals
      `PokemonTcgProvider` al had), UI-componenten (gedrag, geen snapshot-tests).
- [ ] `.claude/skills/browser-validate/` uitvoeren: zoekscherm valideren in licht én donker
      thema, console-fouten checken.
- [ ] `.claude/skills/architecture-check/` uitvoeren vóór afronding.
- [ ] `docs/product-specs/card-catalog.md` bijwerken: status Concept → v1, "Nog niet
      opgelost" oplossen/bijwerken, expliciet vermelden dat prijs is uitgesteld.

## Beslissingen tijdens uitvoering

<in te vullen tijdens het bouwen>

## Afronding

Verplaats naar `completed/` zodra zoeken + browsen + kaartdetail end-to-end werkt (handmatig
gevalideerd via de browser-tooling, in licht én donker), de providers getest zijn tegen
fixtures, en de product-spec is bijgewerkt.
