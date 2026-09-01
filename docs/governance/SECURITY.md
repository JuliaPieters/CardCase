# Security

Status: Leidend. Dit wordt vastgelegd vóórdat er Firestore-code geschreven wordt, niet achteraf. Zonder expliciete regels is het standaardgedrag van Firestore "open" tijdens development — dat is de meest voorkomende manier waarop hobbyprojecten per ongeluk data lekken.

## Kernprincipe

**Elke Firestore-collectie heeft vanaf het eerste commit expliciete security rules, ook tijdens lokale development.** Nooit `allow read, write: if true;` als "tijdelijke" oplossing — dat wordt in de praktijk nooit op tijd teruggedraaid.

## Toegangsmodel

| Collectie | Wie mag lezen | Wie mag schrijven |
|---|---|---|
| `users/{userId}` | alleen de eigenaar (`request.auth.uid == userId`) | alleen de eigenaar |
| `portfolios/{portfolioId}` | alleen de eigenaar | alleen de eigenaar |
| `collectionEntries/{entryId}` | alleen de eigenaar van de bijbehorende portfolio | alleen de eigenaar |
| `tradeAnalyses/{tradeId}` | alleen de maker | alleen de maker |
| `cardCache` / `priceCache` / `deckArchetypeCache` (gedeelde, door Cloud Functions bijgewerkte cache van externe API's) | elke ingelogde gebruiker (leesalleen) | **niemand direct** — alleen schrijfbaar via Cloud Functions met admin-rechten, nooit vanuit de client |

Regel van duim: als een document persoonlijke gebruikersdata bevat, is de eigenaar-check verplicht. Als een document gedeelde, door het systeem bijgewerkte data is (prijzen, kaartcatalogus, decklists), is het read-only voor clients en alleen schrijfbaar door server-side code.

## Cloud Functions / server-side taken

De periodieke ververs-taken voor prijzen (`valuation`) en decklist-data (`deck-insights`) draaien als Cloud Functions met admin-rechten, nooit als client-side code die met een gebruikerscredential naar de cache schrijft. Dit voorkomt dat een gecompromitteerde of gemanipuleerde client de gedeelde cache kan vervuilen voor alle gebruikers.

## Secrets

- API-keys voor Pokémon TCG API, Scryfall (geen key nodig) en Limitless TCG (indien aangevraagd) staan **nooit** in client-side code of gecommit in de repo.
- Server-side secrets (Cloud Functions) via Firebase's eigen secret-manager / environment-config, niet in een `.env`-bestand dat per ongeluk gecommit kan worden.
- `.env*`-bestanden en Firebase-servicekeys staan in `.gitignore` vanaf de allereerste commit.

## Mechanische afdwinging

- Firestore security rules worden getest met de Firebase-emulator (zie `docs/governance/QUALITY.md` — repo-laag test tegen de emulator). Een PR die een collectie toevoegt zonder bijbehorende rules-test hoort niet gemerged te worden.
- CI-check (toe te voegen in `00-foundation.md`): faalt als er een `.env`-bestand of iets dat op een API-key lijkt in een commit zit (bv. via `gitleaks` of een vergelijkbare simpele scanner).

## Import/export

Export en CSV-import (zie `docs/product-specs/portability.md`) zijn gewone client-acties binnen het bestaande eigenaarmodel hierboven — geen aparte rules nodig. Wel expliciet: een import schrijft alleen naar de `collectionEntries` van de ingelogde gebruiker zelf, nooit naar een andere portfolio, ook niet als de gebruiker een portfolio-id zelf zou kunnen meesturen in het importbestand.

## Wat we bewust simpel houden (geen overkill voor dit project)

- Geen aparte rollen/rechtenstructuur (admin/moderator etc.) — er is maar één rol: "eigenaar van zijn eigen data".
- Geen rate-limiting op user-niveau in v1 — pas relevant zodra er meer dan een handjevol gebruikers zijn.
