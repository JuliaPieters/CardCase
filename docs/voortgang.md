# Cardcase · voortgang meerdere TCG's

Wordt bijgewerkt na elke stap uit [implementatieplan.md](implementatieplan.md).

| Stap | Branch | Status |
| --- | --- | --- |
| 0 · Docs en plan | `lorcana` | ✅ |
| 1 · Datamodel en CardSource | `lorcana` | ✅ Opslag v2 met migratie en tests, `CardSource` per spel, waardegeschiedenis per dag (in het gebruikersdocument). |
| 2 · Routing, thema's, configuratie | `lorcana` | ✅ `/<afdeling>/…`, `data-game`, thema-tokens, config per afdeling, logo-component, favicon. ⏳ Tokens nog niet hernoemd naar voluit geschreven namen. |
| 3 · Wisselaar, onboarding, overzicht | `lorcana` | ✅ |
| 4a · Lorcana | `lorcana` | 🟡 Alles gebouwd: catalogus, prijzen (ook in de catalogus), thema, filters, recepten, kaartpagina, foil, waardegeschiedenis, scanner (boekpagina, snel scannen, tips), decoratie, delen. Nog testen: camera, mobiel, echt account. |
| → merge `lorcana` naar `main` | | ✅ 27-10-2026 |
| 4b · Magic | `magic` | 🟡 Catalogus (Scryfall, 97.781 prints), prijzen, thema, filters, recepten, kaartpagina, decks met formaten en Commander. Nog: scanner testen, telefoonformaat nalopen. |
| 4c · One Piece | `one-piece` | 🟡 Catalogus (Punk Records, 5.340 kaarten EN/JA met parallels en herdrukken), Cardmarket-prijzen, thema, filters, recepten, kaartpagina, decks (leider + 50), decoratie, Collectr-import op kaartnummer, scanner op kaartnummer. Telefoonformaat nagelopen. Scanner: kaartnummer (tolerant gelezen) en plaatjesindex om de gewone print en de parallels te onderscheiden. Nog: scanner met een echte camera testen. |
| → merge `one-piece` naar `main` | | ✅ 28-10-2026 |

## Open punten Lorcana

- **Getest met een echte camera:** de scanner (herkenning, snel scannen) is alleen met unit tests en zonder camera bekeken.
- **Mobiele weergave** nog niet bekeken.
- **Je echte account** op Lorcana (inloggen, opslaan, wisselen) nog niet getest; alles als gast.
- Opslag: de app schrijft `cardcaseV2` (alle afdelingen) én `cardcase` (Pokémon in de oude vorm, voor app-versies van vóór de afdelingen). Het veld `cardcase` kan later weg, als niemand de oude versie meer gebruikt.

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
- Decks voor Lorcana (bouwen, inlezen, controle, speelstijl, genereren, sparen). Op telefoonformaat nagelopen. Gemerged naar `main`.
- Magic: The Gathering op branch `magic`: catalogus uit Scryfall (`npm run sync-magic`, 4,7 MB gecomprimeerd), decks per formaat (Standard t/m Vintage, Pauper, Commander).

### 2026-10-28
- One Piece op branch `one-piece`: catalogus uit Punk Records (de officiële kaartlijsten, Engels en Japans) via `npm run sync-one-piece`. Parallels (`_p1`) en herdrukken (`_r1`, bv. uit PRB-01) zijn eigen kaarten.
- Prijzen uit de Cardmarket price guide (idGame 18). Cardmarket noemt de prints niet bij naam; per uitgave worden ze op productvolgorde gekoppeld, de gewone print aan het goedkoopste product. Welke uitgaven Japans zijn, staat in de sealed producten ("(Non-English)", "(Asia Region Legal)"). 947 kaarten zonder prijs, vooral promo's.
- De officiële plaatjes mogen niet op een andere site getoond worden (Cross-Origin-Resource-Policy), dus ze lopen via images.weserv.nl. Engelse plaatjes hebben het watermerk "SAMPLE" van Bandai; een bron zonder watermerk is er niet.- Decks voor One Piece: de leider is de "commander" van het deckscherm (kroontje), 50 kaarten, maximaal 4 per kaartnummer (parallels tellen mee), alleen de kleuren van de leider. Lijsten in- en uitlezen op kaartnummer (`4xOP01-016`, zoals OPTCGSim). Het deckscherm kreeg daarvoor `commanderLabel`, `currentFormatLabel` en `listLine` in `DeckRules`.
- Decoratie: perkament, zeekaart, open zee, wanted-poster, scheepsdek; stickers doodskop, anker, strohoed, munt, kompas.
- Collectr-import herkent One Piece-kaarten aan hun kaartnummer, en de parallel als de rij "Parallel", "Alternate Art" of "Manga" noemt.
- Kaartpagina en collectie tonen het nummer zoals de afdeling het schrijft (`cardNumber`); bij One Piece stond het setnummer er dubbel.- Scanner voor One Piece: het kaartnummer rechtsonder wordt gelezen zoals OCR het teruggeeft ("0PO1-12063" → OP01-120, "£801-001" → EB01-001) en alleen geaccepteerd als dat nummer bestaat. Een plaatjesindex (`npm run sync-hashes-one-piece` → `public/card-hashes/one-piece.bin`, 83 kB) kiest tussen de prints van één nummer; getest met nagebootste camerabeelden: 10 van 10 goed. Een herdruk heeft hetzelfde plaatje als het origineel en is op foto niet te onderscheiden. `CardHashes` laadt nu de index van de actieve afdeling.
