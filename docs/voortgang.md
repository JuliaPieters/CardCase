# Cardcase · voortgang meerdere TCG's

Wordt bijgewerkt na elke stap uit [implementatieplan.md](implementatieplan.md).

| Stap | Branch | Status |
| --- | --- | --- |
| 0 · Docs en plan | `lorcana` | ✅ Docs geschreven (product, datamodel, design-systeem), implementatieplan klaar. Wacht op beslissingen over de open punten. |
| 1 · Datamodel en CardSource | `lorcana` | ⏳ Nog niet begonnen |
| 2 · Routing, thema's, configuratie | `lorcana` | ⏳ |
| 3 · Wisselaar, onboarding, overzicht | `lorcana` | ⏳ |
| 4a · Lorcana | `lorcana` | ⏳ |
| → merge `lorcana` naar `main` | | ⏳ |
| 4b · Magic | `magic` | ⏳ |
| 4c · One Piece | `one-piece` | ⏳ |

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
