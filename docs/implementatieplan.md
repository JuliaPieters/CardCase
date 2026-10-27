# Cardcase · implementatieplan meerdere TCG's

Uitwerking van [product.md](product.md), [datamodel.md](datamodel.md) en [design-systeem.md](design-systeem.md). Er wordt pas code geschreven nadat dit plan is goedgekeurd. De voortgang staat in [voortgang.md](voortgang.md).

---

## 0. Werkwijze: branches en een veilige online versie

`main` is wat online staat: Vercel bouwt `main` als productie. Daar komt niets op dat nog niet af is.

```
main ──────────────────────────────────────●───────────────●──────────────●
  └─ lorcana ──●──●──●──●──●──●──●──●──────┘               │              │
               stap 1  2  3  4a (Lorcana)                  │              │
                                     └─ magic ─────────────┘              │
                                                 └─ one-piece ────────────┘
```

- **Eén branch per spel.** Op **`lorcana`** wordt eerst de basis gebouwd die elke afdeling nodig heeft (stap 1–3: datamodel, routing en thema's, wisselaar, onboarding, overzicht) en daarna Lorcana zelf (stap 4a). Niets ervan komt live tot `lorcana` in `main` wordt gemerged.
- **`lorcana` gaat naar `main`** als Lorcana af is én Pokémon er precies zo uitziet en werkt als nu.
- Daarna komt **`magic`** (vanaf de dan bijgewerkte `main`), en daarna **`one-piece`**.
- Elke branch krijgt van Vercel automatisch een **preview-URL**. Daar wordt getest, niet op productie.
- Komt er tussendoor een fix of feature voor de live versie, dan gaat die gewoon op `main`. `main` wordt regelmatig in `lorcana` gemerged, zodat de verschillen niet te groot worden.

### ⚠️ Previews delen nu de productiedatabase

De preview-builds gebruiken dezelfde Firebase als productie. Een preview die de v2-migratie draait, zou de echte collectie omzetten. De productieversie (v1-code) leest dan een `cardcase`-veld dat hij niet begrijpt, en begint met een lege collectie. Die kan hij vervolgens over je echte collectie heen opslaan.

**Voorstel:**
- Maak een **apart Firebase-project voor previews** (`cardcase-preview`) en zet dat in Vercel als *Preview*-omgevingsvariabelen. `scripts/write-firebase-config.mjs` leest die al uit `FIREBASE_*`.
- Lokaal en op previews werk je dan met testgegevens. Productie blijft onaangeroerd tot de merge.
- **Extra vangnet** in de code: tot de merge naar `main` schrijft v2 alleen naar `users/{uid}/games/*` en naar het veld `cardcaseV2`, nooit naar `cardcase`.

---

## Stap 1 · Datamodel en CardSource

*Op `lorcana`. Zichtbaar verandert er niets.*

**1a. Basistypes** — nieuw `core/game.ts`
- `Game`, `CardId`, `Language`, `CatalogCard`, `CardSet`, `CollectionItem`, `PriceInfo`, zoals in datamodel.md.
- `GAMES` is de lijst van afdelingen. Hier komt nog geen config of thema in.

**1b. Catalogus met `game` en ID's met voorvoegsel**
- `buildCatalog()` geeft elke kaart `id: 'pokemon:<set>-<nummer>'`, `game: 'pokemon'` en `attributes` (`type`, `dex`, `region`, `category`, `form`).
- Code die kaarten nu met `uid` opslaat of opzoekt, gaat over op `id`. De positie in `CARDS` heet voortaan `index`. `id` krijgt zo de betekenis die het in het plan heeft. Dat raakt alle `c.id`- en `CARDS[x]`-plekken in `store.ts`. Het is een grote maar mechanische wijziging, met tests ervoor.
- `card-hashes.bin` blijft per catalogusrij en verandert niet.

**1c. Opslag v2 en migratie** — `core/persist.ts`
- `serializeUser` en `deserializeUser` krijgen de vorm v2: per spel `owned`, `added` en `binders`, plus `games`, `lastGame` en `summary`.
- Migratie van v1 naar v2 zoals beschreven in datamodel.md §3. Er komt een **test met een echte v1-export als fixture**: zelfde aantal kaarten, zelfde binders, zelfde slots.
- Binders krijgen `game`.

**1d. Firestore-indeling v2** — `core/auth.ts`, `core/friends.ts`, `firestore.rules`
- Lezen en schrijven van `users/{uid}` (samenvatting) en `users/{uid}/games/{game}`.
- `shared/{uid}` per spel. `publicBinders` krijgt `game` erbij.
- Regels voor de nieuwe subcollecties. Die moeten ook in de Firebase-console gezet worden; dat doe jij, net als nu.

**1e. `CardSource`** — nieuw `core/sources/`

```ts
interface CardSource {
  readonly game: Game;
  /** De hele catalogus, voor offline gebruik, binders en recepten. */
  loadCatalog(): Promise<{ sets: CardSet[]; cards: CatalogCard[]; version: string }>;
  search(query: CardQuery): Promise<CatalogCard[]>;
  getCard(id: CardId): Promise<CatalogCard | null>;
  getSets(): Promise<CardSet[]>;
  getPrices(ids: CardId[]): Promise<Record<CardId, PriceInfo>>;
}
```

- **`loadCatalog` komt erbij** naast de vier methodes uit het plan. De app zoekt, filtert en bouwt recepten lokaal over de hele catalogus, en werkt offline. Zoeken via een API per toetsaanslag zou dat breken.
- **`PokemonSource` (TCGdex):** `loadCatalog` leest `catalog.json`, `search`/`getCard`/`getSets` werken lokaal, en `getPrices` neemt de bestaande TCGdex/Cardmarket-code uit `core/catalog.ts` over.
- **`LorcanaSource`, `MagicSource`, `OnePieceSource`:** lege implementaties met `// TODO: API kiezen` die een lege catalogus teruggeven.

**1f. Momentopnames van de waarde**
- Eén keer per dag `users/{uid}/valueSnapshots/{datum}` schrijven, met het totaal en per spel. De grafiek gebruikt ze; daarvóór blijft het terugrekenen zoals nu.

**Klaar als:** alle tests slagen, een v1-account migreert correct op de preview (met het testproject) en de app ziet er precies zo uit als nu.

---

## Stap 2 · Routing, thema's en afdelingsconfiguratie (alleen Pokémon)

*Op `lorcana`.*

**2a. Angular Router terug, met een route per afdeling**
- Gisteren heb ik zelf URL's gemaakt (`core/url.ts`) en de ongebruikte Angular-router verwijderd. Voor afdelingen die je lazy laadt is de Angular-router wél de juiste keuze. `url.ts` gaat er dan weer uit.
- Routes:

```
/                       → laatst gebruikte afdeling, of /welkom
/welkom                 onboarding "Wat verzamel jij?"
/overzicht              Mijn Cardcase
/vrienden, /vrienden/:id  boven de afdelingen
/:game                  lazy: laadt afdelingsconfig + CardSource + catalogus
  ''                    dashboard
  scan, zoeken, collectie, collectie/waarde, kaart/:set/:nummer,
  binders, binders/nieuw, binders/recept, binders/:id, binders/:id/bekijk, binders/:id/printen, …
```

- Elke `/:game` (`pokemon`, `one-piece`, `magic`, `lorcana`) heeft een eigen `loadChildren`. Dat stukje laadt alleen de config en de bron van dat spel. De schermen zelf zijn gedeeld en staan in één gedeelde child-routeconfig.
- **De router wordt de bron van waarheid voor het scherm.** `store.go(screen, extra)` blijft bestaan als dun laagje om `router.navigate`, zodat de ~26 plekken die het aanroepen niet allemaal tegelijk hoeven te veranderen. `state.screen` wordt afgeleid uit de actieve route.
- **Oude links blijven werken:** `/kaart/…`, `/binders/…` en `/zoeken` sturen door naar `/pokemon/…`. `?b=` (gedeelde binder) en `?invite=` blijven zoals ze zijn.

**2b. Tokens hernoemen en vaste kleuren eruit**
- De tokens krijgen de nieuwe namen uit design-systeem.md. De Tailwind-utilities veranderen mee (`bg-bg` → `bg-background`, `bg-lcd` → `bg-display`, `font-pixel` → `font-display`, …).
- De ~320 vaste hex-kleuren in templates en view-models worden tokens, behalve inhoudskleuren (typekleuren, stickers, holo).
- Dit is veel mechanisch werk met een groot risico op kleine visuele fouten. Daarom maak ik **vóór en na screenshots van elk scherm, in licht en donker**. Ze moeten gelijk zijn.

**2c. `data-game` en de thema-CSS**
- De afdelingsroute zet `document.documentElement.dataset.game`. Het waarom staat in design-systeem.md.
- In `styles.css` komen blokken `[data-game="pokemon"]` (de huidige waarden) en `[data-game="pokemon"].cc-dark`. De andere afdelingen krijgen alvast een leeg blok.

**2d. Afdelingsconfiguratie** — `src/app/games/<afdeling>/config.ts`

```ts
interface GameConfig {
  game: Game; name: string; route: string; enabled: boolean;
  theme: { mascot: string; headerLogo: string; favicon: string };
  languages: { code: Language; label: string }[];
  filters: FilterDefinition[];     // { key: attribuutsleutel, label, kind: 'single'|'multi'|'range', options }
  recipes: RecipeDefinition[];     // spelspecifiek; de algemene staan in shared/recipes.ts
  source: () => Promise<CardSource>;
}
```

- Naar `games/pokemon/` verhuizen: `TYPES`, `REGIONS`, de recepten Regio-dex, Eén Pokémon alle versies en Type, en de Pokémon-teksten in de UI (~20 plekken: "Alle Pokémon uit een regio", "Kaarten per Pokémon", …).
- **Algemene recepten** (Master set, Illustrator, Leeg beginnen) komen in `shared/recipes.ts`.
- Zoeken, de themabinder en de receptwizard lezen hun filters en stappen uit de config. Er komen geen `if`-statements per spel.
- Het filter **regio** bestaat nu nog niet bij zoeken; dat komt erbij.
- `LANGS` wordt `config.languages`.

**2e. Logo's en favicon** (bestanden staan al in `public/logos/<afdeling>/`)
- Component `<cc-logo>`: `mascotte.svg` plus het woord "CardCase" als HTML-tekst in Pixelify Sans 700, met "Card" in `var(--color-logo-card)` en "Case" in `var(--color-logo-case)`. Dit vervangt `icons/logo-header.png`.
- De favicon wisselt mee met de afdeling via `link[rel=icon]`.

**Klaar als:** `/pokemon/…` werkt helemaal, oude links sturen door, de screenshots zijn gelijk aan vóór, en tests en build slagen.

---

## Stap 3 · Afdelingswisselaar, onboarding en "Mijn Cardcase"

*Op `lorcana`.*

- **Wisselaar** in de header en de zijbalk, zoals beschreven in design-systeem.md. Gegevens per afdeling (kaarten, waarde) komen uit `summary` in het gebruikersdocument. Zo hoeft er geen andere catalogus geladen te worden.
- **Onboarding** `/welkom`: kies één of meer afdelingen en ga naar de eerste. Dit sluit aan op het bestaande loginscherm: na het inloggen, en na het kiezen van een gebruikersnaam en de importvraag. Bestaande gebruikers (`games` bevat al `pokemon`) slaan het over. **Gasten** krijgen de vraag ook.
- **"Mijn Cardcase"** `/overzicht`: totale waarde met grafiek (uit de momentopnames) en een tegel per afdeling.
- **Laatst gebruikte afdeling:** `lastGame` in het gebruikersdocument en `cc-last-game` in de browser.
- **"Afdeling toevoegen"** toont alleen afdelingen met `enabled: true`.

Daarna Lorcana zelf (stap 4a), nog steeds op `lorcana`.

---

## Stap 4 · De andere afdelingen: Lorcana → Magic → One Piece

Per spel een eigen branch (`lorcana`, daarna `magic`, daarna `one-piece`) met dezelfde onderdelen:

1. **API kiezen** voor catalogus en prijzen. Dat doen we samen; per spel maak ik een korte vergelijking.
2. **Sync-script** (`scripts/sync-<spel>.mjs`) → `public/catalogs/<spel>.json`, in dezelfde compacte vorm als Pokémon.
3. **`<Spel>Source`** echt implementeren.
4. **Config:** talen, filters en recepten.
   - Lorcana: inkkleur, kaartsoort, zeldzaamheid; recepten Per inkkleur en Per verhaal.
   - Magic: kleurcombinatie, kaartsoort, zeldzaamheid; recepten Per kleurcombinatie en Commander-deck.
   - One Piece: kleur, leider, kaartsoort; recepten Per leider en Per kleur.
5. **Thema-tokens** (waarden uit `docs/logos/afdelingen.css`) en **fonts**. Logo's en mascotte zijn er al.
6. **Kaartweergave:** de placeholder-kaart (`shared/card.ts`) is nu getekend als een Pokémon-kaart. Die wordt per spel instelbaar via de config, bijvoorbeeld een andere verhouding of kaartrand.
7. **Scannen:** in eerste instantie zonder herkenning. De OCR van het nummer en de plaatjesindex volgen per spel, als aparte taak.
8. `enabled: true` en merge naar `main`. Voor Lorcana gaat de basis uit stap 1–3 dan mee live.

---

## Risico's

| Risico | Aanpak |
| --- | --- |
| Previews overschrijven productiegegevens | Apart Firebase-project voor previews, en v2 schrijft niet naar `cardcase` tot de merge (zie §0). |
| Migratie verliest kaarten of binders | Test met een echte v1-export; het v1-veld blijft als backup staan (`cardcaseV1`). |
| Kleine visuele fouten door het hernoemen van tokens | Screenshots vóór en na per scherm, in licht en donker. |
| `store.ts` (~1250 regels, ongetypeerd) zit vol aannames over één catalogus | Eén actieve catalogus tegelijk; `CARDS` wijst naar die van de actieve afdeling. Wisselen herlaadt de catalogus. |
| Een catalogus wordt groot (Magic: >90.000 prints) | Per spel lazy laden; alleen de actieve catalogus in het geheugen; de service worker cachet per spel. |
| De placeholder-kaart en de scanner zijn op Pokémon ingericht | Expliciet per spel in stap 4. |

---

## Open punten om te beslissen

1. **Apart Firebase-project voor previews?** *(aanbevolen; zie §0)*
2. **`data-game` op `<html>`** in plaats van op de root van de route. Anders krijgen sheets, de scanner en toasts het thema niet.
3. **Tokennamen:** de aangeleverde CSS gebruikt Nederlandse namen (`--color-afdeling-primair`). Voorstel: in de code Engelse semantische namen (`--color-accent`, …), net als de rest van de code. De aangeleverde waarden worden daaraan gekoppeld (zie design-systeem.md). Alternatief: de Nederlandse namen overal overnemen.
4. **Donkere modus per afdeling:** de paletten hebben één modus (Tovenaars donker, de rest licht). Voorstel: elke afdeling krijgt ook een donkere variant, en Tovenaars blijft altijd donker.
5. **`game` per collectie-item opslaan of afleiden.** Voorstel: afleiden uit het documentpad en het voorvoegsel van de ID. In de code staat het veld er wel.
6. **Vrienden boven de afdelingen** (`/vrienden`), met gedeelde binders in het thema van hun eigen afdeling.

Al beslist: logo's en mascottes zijn aangeleverd en staan in `public/logos/<afdeling>/` (niet in `src/assets`). Het headerlogo wordt een component, zoals de README adviseert.
