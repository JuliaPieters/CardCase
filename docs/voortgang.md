# Cardcase · voortgang meerdere TCG's

Wordt bijgewerkt na elke stap uit [implementatieplan.md](implementatieplan.md).

| Stap | Branch | Status |
| --- | --- | --- |
| 0 · Docs en plan | `lorcana` | ✅ |
| 1 · Datamodel en CardSource | `lorcana` | ✅ Opslag v2 met migratie en tests, `CardSource` per spel, waardegeschiedenis per dag (in het gebruikersdocument). |
| 2 · Routing, thema's, configuratie | `lorcana` | ✅ `/<afdeling>/…`, `data-game`, thema-tokens, config per afdeling, logo-component, favicon. ⏳ Tokens nog niet hernoemd naar voluit geschreven namen. |
| 3 · Wisselaar, onboarding, overzicht | `lorcana` | ✅ |
| 4a · Lorcana | `lorcana` | 🟡 Alles gebouwd: catalogus, prijzen (ook in de catalogus), thema, filters, recepten, kaartpagina, foil, waardegeschiedenis, scanner (boekpagina, snel scannen, tips), decoratie, delen. Nog testen: camera, mobiel, echt account. |
| → merge `lorcana` naar `main` | | ⏳ |
| 4b · Magic | `magic` | ⏳ |
| 4c · One Piece | `one-piece` | ⏳ |

## Open punten Lorcana

- **Getest met een echte camera:** de scanner (herkenning, snel scannen) is alleen met unit tests en zonder camera bekeken.
- **Mobiele weergave** nog niet bekeken.
- **Je echte account** op Lorcana (inloggen, opslaan, wisselen) nog niet getest; alles als gast.
- **Bij de merge:** Firestore-veld omzetten van `cardcaseV2` naar het echte veld (§0 van het plan), en `firestore.rules` nalopen.

## Logboek

### 2026-10-27
- `docs/` aangemaakt. Er waren nog geen docs, dus product.md, datamodel.md en design-systeem.md zijn nieuw. Ze beschrijven de huidige stand en het doel.
- Implementatieplan geschreven. Volgorde van de afdelingen na Pokémon: Lorcana, Magic, One Piece.
- Werkwijze: één branch per spel. Op `lorcana` komen de basis (stap 1–3) en Lorcana; pas daarna gaat het naar `main`. `main` blijft de online versie.
- Gevonden en in het plan opgenomen:
  - Preview-builds delen de productie-Firebase, dus voor het testen van de migratie is een apart project nodig.
  - Er worden nog geen momentopnames van de waarde opgeslagen; die zijn nieuw.
  - Het plan noemt `src/assets`, maar dit project serveert `public/`.
  - `data-game` moet op `<html>`, want overlays renderen buiten de route.
  - De Angular-router komt terug (vervangt `core/url.ts`).
- Aangeleverde logo's (`public/icons/cardcase-logo`) verplaatst naar `public/logos/<afdeling>/`, met de route als mapnaam (`piraat` → `one-piece`, `tovenaar` → `magic`, `sprookje` → `lorcana`). README en kleurtokens staan in `docs/logos/`.
- Code opgedeeld per spel in `src/app/games/<spel>/` (config, source, catalogus, scanner); algemene code vraagt alles via de config.
- Opslag v2 schrijft naar `cardcaseV2`; het veld `cardcase` van de live versie blijft onaangeroerd.
- Lorcana: catalogus uit LorcanaJSON (3.556 kaarten, EN/FR/DE/IT) via `npm run sync-lorcana`; Cardmarket-prijzen (gewoon en foil) via een rewrite in `vercel.json`.
- Thema-tokens per afdeling; Pokémon ziet er hetzelfde uit, Lorcana in inktblauw, roomwit en goud.
- Afdelingswisselaar, onboarding "Wat verzamel jij?" en overzicht "Mijn Cardcase" gebouwd.
- Foil per taal in de collectie, waardegeschiedenis per dag, snel scannen, tips bij mislukte scans, Lorcana-decoratie, delen per afdeling. Alle Lorcana-schermen in de browser doorgelopen (desktop, als gast).
