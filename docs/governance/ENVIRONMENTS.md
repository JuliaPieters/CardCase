# Environments

Status: Leidend. Vastgelegd vóórdat er tegen het "echte" Firebase-project getest wordt.

## Eén Firebase-project, twee omgevingen

Er is maar één Firebase-project (dat is een bewuste, praktische keuze — niet elk account kan meerdere gratis projecten aanmaken). De scheiding tussen "testen" en "echt" gebeurt daarom niet via aparte cloud-projecten, maar via de lokale emulator:

| Omgeving | Waar | Gebruikt door |
|---|---|---|
| **Lokaal/dev** | Firebase-emulator suite (Auth, Firestore, Functions), draait lokaal, raakt het echte project nooit | Dagelijkse ontwikkeling en **alle** geautomatiseerde tests (zie `docs/governance/QUALITY.md`) |
| **Productie** | Het ene Firebase-project | Je eigen echte collectie/portfolio, en handmatig testen vlak voor je een feature zelf gaat gebruiken |

Er is geen apart staging-project. Een bijna-afgeronde feature test je handmatig in productie, met normale voorzichtigheid (zoals je toch al zou doen bij een app die alleen jij gebruikt) — dat is bij een single-user hobbyproject een acceptabele afweging.

**Harde regel, juist omdat er maar één project is:** geautomatiseerde tests draaien **nooit** tegen het echte Firebase-project, uitsluitend tegen de emulator. Zonder een apart staging-project als vangnet is dit de enige bescherming tegen een test die per ongeluk je eigen collectiedata overschrijft of de gedeelde prijs-/decklist-cache vervuilt — dus dit is niet optioneel.

Omgevingselectie gebeurt via environment-config (bv. Angular's `environment.ts`-per-configuratie: `emulator` vs. `production`), nooit via een hardcoded projectnaam of API-key middenin een service — zie ook de hardcoded-waarden-regel in `docs/governance/QUALITY.md`.

Wil je later toch íets van een tussenstap tussen emulator en productie: de emulator kan een export/snapshot van productiedata importeren om realistischer te testen, zonder dat er ooit geschreven wordt naar het echte project. Dat is dan de "staging"-vervanger, niet een los project.

## Firebase-quota's en kosten

Firestore-reads en Cloud Function-invocations vallen in het gratis niveau ("Spark plan") totdat een grens wordt overschreden — bij een hobbyproject makkelijk per ongeluk te overschrijden door bijvoorbeeld een query die bij elke render opnieuw de hele collectie ophaalt in plaats van te cachen. Met maar één project is dit extra relevant: er is geen apart staging-project waar een dure query eerst onschuldig zou opvallen — een bug is meteen zichtbaar op je enige, echte project.

- Stel een **budget-alert** in op het Firebase/Google Cloud-project (e-mailmelding bij een ingesteld bedrag), zodat een bug die veel reads veroorzaakt niet onopgemerkt kosten maakt.
- Periodieke achtergrondtaken (prijs-/decklist-verversing, zie `valuation.md` en `deck-insights.md`) zijn de meest waarschijnlijke bron van veel invocations — hou hun frequentie bewust laag (dagelijks, niet per minuut) totdat er een concrete reden is om te versnellen.
- Bij twijfel of een query "duur" is (veel reads per gebruikersactie): eerst uitzoeken via de emulator of de Firebase-console tijdens ontwikkeling, niet pas achteraf ontdekken via de rekening.

## Nog niet opgelost

- Exacte budget-drempel voor de alert — invullen zodra er een gevoel is voor normaal gebruik.
