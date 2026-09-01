# Quality

Status: Leidend. Dit legt vast wat "klaar" betekent voor een stuk werk, zodat de agent niet zelf per PR opnieuw de lat hoeft te bepalen. Zie `docs/QUALITY_SCORE.md` voor de actuele status per domein.

## Testen

- **Service-laag** (businessregels): unit tests verplicht, dit is waar bugs het duurst zijn.
- **Repo-laag** (Firestore-toegang): test tegen de Firebase-emulator, niet tegen productie.
- **Providers** (`PokemonTcgProvider`, `MagicProvider`): unit tests met gemockte API-responses (sla echte voorbeeldresponses op in `docs/references/` of een test-fixtures-map) + losse, handmatig te draaien "smoke test" tegen de echte API. Geen tests die bij elke run de echte externe API raken — dat maakt CI afhankelijk van andermans uptime.
- **UI**: component-tests voor gedrag (bv. "kaart toevoegen update de lijst"), geen pixel-perfecte snapshot-tests — die breken bij elke kleine stylingwijziging en leveren weinig op.

## Coverage

Geen hard percentage als doel op zich — 100% coverage op een `Repo`-laag die alleen Firestore-calls doorgeeft is zinloos. Richtlijn: **Service-laag en Providers zo goed als volledig gedekt, Repo en UI gedekt op gedrag dat daadwerkelijk kan breken.** Als een PR een bugfix bevat, hoort er een test bij die het specifieke scenario vastlegt — anders komt dezelfde bug terug.

## Definition of done (per feature/exec-plan)

- [ ] Voldoet aan de architectuurregels uit `docs/governance/ARCHITECTURE.md` (lagen, providers) en de SOLID-richtlijnen uit `docs/governance/QUALITY.md`.
- [ ] Bijbehorend `docs/product-specs/<domein>.md` is bijgewerkt als het gedrag afweek van het Concept.
- [ ] Tests aanwezig volgens bovenstaande richtlijn.
- [ ] Lint en build slagen.
- [ ] Design volgt `docs/governance/DESIGN.md`: alleen tokens gebruikt (kleur, font-size, spacing, radius), geen losse hex/px-waarden.
- [ ] Nieuwe of gewijzigde Firestore-collecties hebben bijgewerkte security rules + rules-test, conform `docs/governance/SECURITY.md`.
- [ ] Toegankelijkheid: toetsenbord-focus zichtbaar, `prefers-reduced-motion` gerespecteerd, kleur niet de enige drager van betekenis (zie `docs/governance/DESIGN.md`).
- [ ] Een schemawijziging aan een bestaand model volgt `docs/design-docs/schema-versioning.md` (versie-ophoging + read-time normalisatie waar nodig).

## Merge-filosofie

Voor een hobbyproject van deze schaal is de aanpak uit het artikel (kort-levende PR's, instabiele tests oplossen met een herhaalde run in plaats van eindeloos blokkeren) prima toepasbaar, met één aanpassing: **jij bent de enige reviewer**, dus laat Claude Code zijn eigen wijzigingen eerst zelf reviewen en testen voordat jij ernaar kijkt. Blokkeer niet op perfectie in een side-project — een kleine, werkende stap die je later verbetert is beter dan een grote PR die blijft hangen.

- Kleine wijzigingen: geen PR-drempel, gewoon mergen na een groene build.
- Nieuwe domeinen/architectuurwijzigingen: laat Claude Code eerst een korte samenvatting geven van wat er verandert en waarom, voordat je merget.
- Een instabiele (flaky) test: eerst opnieuw draaien; blijft hij falen, dan een regel toevoegen aan `docs/exec-plans/tech-debt-tracker.md` in plaats van de voortgang te blokkeren.

## Code-stijl (mechanisch, niet ter discussie)

- Naamgeving en structuur: zie de conventies in `CLAUDE.md` (geen afkortingen, enkelvoud).
- Kleuren/typografie/spacing: alleen via de tokens in `docs/governance/DESIGN.md` (bv. `--font-size-sm`, `--space-md`), nooit een losse hex-waarde, px-waarde of magic number in een component. Een component die zelf `14px` of `#FFC738` schrijft in plaats van het token te gebruiken, is fout — ook als de waarde toevallig overeenkomt met een bestaand token.
- Datastructuren worden bij de grens geparsed (zie `docs/governance/ARCHITECTURE.md`), nooit `any` doorgeven vanuit een provider.
- Geen andere hardcoded waarden die eigenlijk configuratie zijn: API-endpoints, cache-verversingsintervallen, drempelwaarden (bv. de "eerlijke ruil"-marge uit `trade-analyzer.md`) horen in de `Config`-laag van het betreffende domein, niet verspreid als losse getallen in `Service`- of `UI`-bestanden.

## SOLID

Verplicht voor de `Service`- en `Provider`-laag (waar de businesslogica zit); bij `Repo` en `UI` is dit vooral relevant zodra ze meer dan triviaal worden.

- **Single responsibility**: een `Service` doet één ding. Zodra een servicebestand zowel prijsberekening als validatie als notificaties doet, hoort dat gesplitst te worden — dit is precies waarom `valuation` en `trade-analyzer` losse domeinen zijn in plaats van functies binnen `collection`.
- **Open/closed**: nieuwe TCG toevoegen mag geen wijziging vereisen in bestaande domeinlogica, alleen een nieuwe `CardProvider`-implementatie (zie `docs/governance/ARCHITECTURE.md` — dit is het hele punt van die abstractie).
- **Liskov substitution**: elke `CardProvider`- of `DeckDataProvider`-implementatie moet inwisselbaar zijn zonder dat de aanroepende code weet welke TCG het is. Als `MagicProvider` een methode anders laat gedragen dan `PokemonTcgProvider` op een manier die de `Service`-laag moet detecteren, is de abstractie lek.
- **Interface segregation**: geen enkele, allesomvattende `CardProvider`-interface met methoden die alleen voor één TCG gelden. Iets dat niet generiek is voor alle TCG's hoort niet in de gedeelde interface (zie de open vragen over `rarity` in `docs/design-docs/core-beliefs.md`).
- **Dependency inversion**: een `Service` hangt af van de `CardProvider`-interface, nooit van een concrete `PokemonTcgProvider`-klasse. Injecteer de implementatie, importeer 'm niet direct.

Bij twijfel of iets een SOLID-schending is: check eerst `.claude/skills/architecture-check/` — die skill dekt het praktische deel van dependency inversion en interface segregation al via de laag-/provider-grenzen.
