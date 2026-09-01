# CLAUDE.md

Dit bestand is de **inhoudsopgave**, niet de encyclopedie. Als iets hier ontbreekt, staat het waarschijnlijk in `docs/`. Werk je aan iets dat hier niet beschreven staat: zoek eerst in `docs/design-docs/index.md` en `docs/product-specs/index.md` voordat je aannames doet.

## Wat dit project is

**Cardcase** is een multi-TCG portfolio tracker (vergelijkbaar met Collectr), zonder kaartherkenning via camera. Gebruikers zoeken kaarten handmatig op, houden collecties bij, zien de live waarde van hun portfolio en kunnen ruilen analyseren op eerlijkheid.

Zie `docs/product-specs/index.md` voor de volledige scope.

## Tech stack

- Angular (frontend + business logic)
- Firebase (auth, Firestore, hosting, functions)
- Externe data: Pokémon TCG API, Scryfall (Magic) — zie `docs/references/`

## Kernprincipe: geen handgeschreven code in domeinlogica

Werk depth-first: breek een taak op in kleine, testbare stappen, laat de agent elke stap bouwen en valideren voordat je verder gaat. Bij een mislukte poging: zoek uit welke *capability* ontbreekt (tool, abstractie, documentatie) in plaats van gewoon opnieuw te proberen.

## Architectuurregel (verplicht, mechanisch afgedwongen)

Zie `ARCHITECTURE.md` voor het volledige model. Kort samengevat:

- Elk bedrijfsdomein (`card-catalog`, `collection`, `valuation`, `trade-analyzer`) is gelaagd: `Types → Config → Repo → Service → UI`. Afhankelijkheden mogen alleen voorwaarts.
- Domeinoverschrijdende functionaliteit (TCG-databronnen, auth, logging) loopt **uitsluitend** via `Providers`. Een domein mag nooit rechtstreeks een externe API aanroepen.
- **Belangrijkste regel van dit project:** elke TCG-databron implementeert de `CardProvider`-interface (zie `docs/design-docs/core-beliefs.md`) en normaliseert naar het gedeelde `Card`-model. Domeinlogica mag nooit TCG-specifieke velden kennen.

## Data parsen, niet valideren

Externe API-responses (Pokémon TCG API, Scryfall) worden bij de grens geparsed naar het interne `Card`-model. Geen `any`, geen losse velden doorgeven vanuit de provider-laag naar boven.

## Documentatieconventies

- Documentatie in het Nederlands, code (variabelen, functies, commentaar) in het Engels.
- Geen afkortingen in namen van tokens/types. Enkelvoud voor entiteiten (`Card`, niet `Cards`).
- Elke afgeronde feature: werk `docs/product-specs/<domein>.md` bij als het gedrag wijzigt.

## Design

Zie `DESIGN.md` voor het volledige tokensysteem (kleur, typografie, layout, motion). Kort samengevat: speels/cartoonachtig maar niet donker, licht én donker thema vanaf v1, en de kaart-vorm zelf (echte TCG-verhouding) is het centrale UI-motief in plaats van generieke rounded cards. Geen losse hex-waarden in componenten — altijd via de tokens.

## Beveiliging

Zie `SECURITY.md` voor de Firestore-toegangsregels en secrets-beleid. Kernregel: elke collectie heeft vanaf het eerste commit expliciete owner-based rules, gedeelde caches (prijzen, decklists) zijn alleen server-side schrijfbaar.

## Omgevingen

Zie `ENVIRONMENTS.md` voor de scheiding tussen lokale emulator en het (enkele) productie-Firebase-project, en hoe Firebase-quota's/kosten in de gaten worden gehouden. Tests draaien altijd tegen de emulator, nooit tegen het echte project — er is geen apart staging-project.

## Externe API's: voorwaarden

Zie `docs/references/api-terms.md` voor attributie-eisen en gebruiksbeperkingen van de Pokémon TCG API, Scryfall en Limitless TCG — geen puur technische kwestie, ook relevant voor of/hoe dit gebouwd wordt.

## Schema-wijzigingen

Zie `docs/design-docs/schema-versioning.md` voordat je een bestaand model (`Card`, `CollectionEntry`, etc.) wijzigt op een manier die bestaande Firestore-data ongeldig maakt.

## Kwaliteit

Zie `QUALITY.md` voor testconventies, coverage-richtlijnen, definition-of-done per feature en de merge-filosofie. Kort samengevat: service-laag en providers goed getest, geen tests die de echte externe API's raken, kleine PR's snel mergen, instabiele tests oplossen met een herhaalde run in plaats van blokkeren.

## Agent-observability

Waar mogelijk koppel je Claude Code aan tooling waarmee het zijn eigen werk kan controleren (bv. een browser-MCP-server voor UI-gedrag, of losse scripts om Firestore-emulator-state te inspecteren) in plaats van dat jij elke wijziging handmatig moet natesten. Dit is dezelfde reden waarom het harness-engineering-artikel Chrome DevTools aan de agent koppelde: hoe meer de agent zelf kan valideren, hoe minder jouw (schaarse) aandacht de bottleneck wordt. Zie de bijbehorende stap in `docs/exec-plans/active/00-foundation.md` en de skill `.claude/skills/browser-validate/`.

## Skills

Terugkerende, geteste procedures staan als `SKILL.md` in `.claude/skills/`, precies zoals het artikel beschrijft ("skills ingebed in de repository"). Nu aanwezig:

- `provider-fixtures` — hoe je een `CardProvider`/`DeckDataProvider` test tegen echte, opgeslagen API-responses in plaats van live calls.
- `architecture-check` — handmatige controle van de laag-/provider-grenzen uit `ARCHITECTURE.md`, zolang de lint-regels dit nog niet volledig mechanisch afdwingen.
- `browser-validate` — hoe je een UI-wijziging zelf valideert via de browsertooling.

Voeg een nieuwe skill toe zodra je merkt dat je dezelfde instructie meer dan een keer herhaalt in een prompt — dat is het signaal dat het een skill moet worden in plaats van steeds opnieuw uitgetypt te worden.

## Plannen

- Kleine wijzigingen: geen apart plan nodig, gewoon een PR-beschrijving.
- Nieuwe features of domeinen: maak een exec-plan in `docs/exec-plans/active/` (zie template daar). Verplaats naar `completed/` bij afronding.

## Kwaliteit / CI (aan te vullen zodra ingericht)

- `docs/QUALITY_SCORE.md` houdt per domein bekende hiaten bij.
- `docs/exec-plans/tech-debt-tracker.md` houdt bewuste shortcuts bij die later opgelost moeten worden.

## Wat nog niet bestaat

Dit project begint leeg. Zie `docs/exec-plans/active/00-foundation.md` voor de eerste stap.
