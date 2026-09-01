---
name: provider-fixtures
description: "Gebruik deze skill bij het bouwen of wijzigen van een CardProvider, DeckDataProvider (Pokémon TCG API, Scryfall, Limitless TCG), of de CSV-import uit portability.md. Legt vast hoe je een echte API-response of een echt exportbestand van een andere app omzet naar een test-fixture, zodat er getest wordt tegen realistische data zonder de echte API bij elke testrun te raken."
---

# Provider fixtures

Providers en de CSV-import worden getest tegen opgeslagen, echte data — nooit tegen de live API, en nooit tegen handgeschreven nep-JSON die toevallig aan het type voldoet. Zie ook de architectuurregel in `CLAUDE.md`: domeinlogica mag nooit TCG-specifieke velden kennen, dus de fixture is ook de plek waar je die mapping-aannames zichtbaar maakt en test.

## Werkwijze

1. **Eén handmatige call/export per representatief scenario.** Voor elke nieuwe of gewijzigde provider (of de CSV-import) verzamel je echte data voor minimaal:
   - een normale kaart (het gangbare geval),
   - een ongebruikelijke variant (bv. reverse foil, promo, alternate art),
   - provider-specifieke edge cases — bij Scryfall bijvoorbeeld een dubbelzijdige kaart (transform/modal DFC),
   - bij CSV-import: een echt exportbestand van een bestaande app (bv. TCGplayer), niet een zelfgemaakte CSV.

2. **Opslaan onder `test/fixtures/<naam>/<scenario>.json` of `.csv`.**
   - `<naam>` = provider- of importnaam, bv. `test/fixtures/pokemon-tcg-api/`, `test/fixtures/scryfall/`, `test/fixtures/csv-import-tcgplayer/`.
   - `<scenario>` = beschrijvende naam, bv. `normal-card.json`, `reverse-foil.json`, `double-faced-card.json`.
   - Bewaar de ruwe, ongewijzigde API-response of het ruwe exportbestand — niet een voorbewerkte versie.

3. **Providers en import testen tegen deze fixtures**, niet tegen live calls. De testsuite laadt de fixture, voert 'm door de parser/normalisatie, en asserteert op het genormaliseerde `Card`- of `DecklistEntry`-model.

4. **Referentiebestanden bijwerken.** Als een fixture een nieuwe veld-mapping blootlegt (bv. een veld dat je nog niet kende, of een afwijkende structuur), werk dan het bijbehorende bestand in `docs/references/` bij zodat de mapping gedocumenteerd blijft.

5. **Breaking changes in de externe API.** Als een provider zijn responsformaat wijzigt op een manier die bestaande fixtures ongeldig maakt: voeg een **nieuwe** fixture toe (bv. `normal-card-v2.json`), overschrijf de oude niet. Zo blijft zichtbaar hoe het formaat is veranderd en kun je desnoods backward-compat testen.

## Wat dit niet is

- Geen mocks die de vorm van de API simuleren zonder ooit echte data te hebben gezien.
- Geen tests die de live externe API raken (zie `docs/governance/QUALITY.md`).
- Geen fixtures voor domeinlogica zelf — alleen voor de provider-/import-grens waar externe data het systeem binnenkomt.
