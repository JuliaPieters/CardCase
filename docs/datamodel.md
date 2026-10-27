# Cardcase · datamodel

Dit document beschrijft eerst hoe de gegevens nu zijn opgebouwd en daarna het doelmodel voor meerdere spellen, met de migratie ertussen.

---

## 1. Huidig model (alleen Pokémon)

### Catalogus

- **Bron:** `public/catalog.json`. Wordt gebouwd door `scripts/sync-catalog.mjs` (TCGdex) en aangevuld door `sync-japanese.mjs`, `sync-chinese.mjs` en `sync-images.mjs`. Daarbij komen de officiële Japanse en Taiwanese databases en pokemontcg.io. Het bestand is compact: een stringtabel, plus kaarten als arrays `[setIdx, localId, name, nameDE, rar, type, dex, illus, imgFlags, category, altRef]`.
- **In het geheugen:** `buildCatalog()` (`core/catalog.ts`) en `setCatalog()` (`core/data.ts`) vullen **globale arrays**: `CARDS`, `SETS`, `BYSET`, `SP` (soorten op dexnummer), `ILLUS` …
- **Kaart-ID's:**
  - `id` = positie in `CARDS`. Werkt alleen in het geheugen, want hij verschuift bij een nieuwe catalogus.
  - `uid` = `<setcode>/<localId>`, bijvoorbeeld `sv08/250`, `JA-SV2a/045`, `ZH-TW-M6/012`. Deze is stabiel en wordt gebruikt bij opslaan en in URL's (`/kaart/<set>/<nummer>`).
- **Talen:** vast `LANGS = ['EN', 'DE', 'JA', 'ZH']`. Een Engelse print met een Duitse versie geldt als één kaart met `avail: ['EN', 'DE']`.
- **Plaatjesindex:** `public/card-hashes.bin` (`sync-hashes.mjs`) bevat per catalogusrij een perceptual hash van 16 bytes, voor de scanner. De header bevat de catalogusversie.

### Gebruikersgegevens

In het geheugen (`store.ts`, ongetypeerd):

```ts
owned:   Array<{ EN: number; DE: number; JA: number; ZH: number }>  // per catalogus-index
added:   Record<index, timestampMs>
binders: Binder[]
dark:    boolean
```

```ts
Binder {
  id: string;            // 'b1', 'b1792747438609'
  name: string; note?: string; cover: string;   // kleur
  fmt: 4 | 9 | 12 | 16;  pages: number;
  kind: 'set' | 'smart' | 'trade' | 'free' | 'recipe';
  slots: (number | string | null)[];  // kaartindex, gereserveerd ('R:…'), decoratie ('D:…') of leeg
  dismissed?: number[];  recipe?: Recipe;  alts?: Record<slot, number>;
  deco: { bg: Record<page, { fill, label }>; images: DecoImage[]; stickers: Sticker[] };
  friends?: boolean;  shareId?: string;
}
```

**Opgeslagen vorm** (`core/persist.ts`, `v: 1`). Dezelfde vorm geldt voor de browsercache (`localStorage['cc-user-v1:<uid>']`) en voor Firestore:

```ts
{ v: 1, owned: { [uid]: { EN, DE, JA, ZH } }, added: { [uid]: ms },
  binders: Binder[] /* slots als 'U:<uid>' */, dark, savedAt, by }
```

### Firestore

| Pad | Inhoud |
| --- | --- |
| `users/{uid}` → veld `cardcase` | De hele gebruiker in v1-vorm, als **één document** (maximaal 1 MiB). |
| `users/{uid}/images/{id}` | Geüploade afbeeldingen voor decoratie. |
| `profiles/{uid}`, `usernames/{name}` | Gebruikersnaam en weergavenaam. |
| `friendships/{a_b}`, `invites/{code}` | Vriendschappen en uitnodigingen. |
| `shared/{uid}` | Wat vrienden zien: `{ owned, binders }`. |
| `publicBinders/{shareId}`, `publicImages/{id}` | Binders die via een link gedeeld zijn. |

### Prijzen en waarde

Prijzen worden per kaart opgehaald via TCGdex (Cardmarket) en gecachet als `[fetchedAt, trend, low, avg1, avg7, avg30]` (`core/catalog.ts`). De waardegrafiek **rekent terug** uit die gemiddelden (`priceAt()` in `core/data.ts`). Er worden geen momentopnames opgeslagen.

---

## 2. Doelmodel (meerdere spellen)

### Spel

```ts
type Game = 'pokemon' | 'one-piece' | 'magic' | 'lorcana';
```

`Game` is ook het route-segment en de waarde van `data-game`.

### Kaart-ID's

Kaart-ID's zijn **uniek over alle spellen heen** en beginnen met het spel:

```
<game>:<setcode>-<nummer>      pokemon:sv08-250   pokemon:JA-SV2a-045   one-piece:OP01-001
```

- Een ID is **ondoorzichtig**: code splitst hem nooit. Setcodes bevatten zelf streepjes (`tk-ex-p`, `ZH-TW-M6`), en nummers bij Magic soms ook (`A-123`). Set en nummer staan daarom altijd als aparte velden op de kaart.
- Van Pokémon v1 naar het nieuwe ID: `'pokemon:' + uid.replace('/', '-')`. Een `uid` bevat precies één `/`.
- URL's blijven leesbaar: `/pokemon/kaart/<set>/<nummer>`.

### Catalogus per spel

```ts
interface CatalogCard {
  id: CardId;              // 'pokemon:sv08-250'
  game: Game;
  set: string;             // setcode zoals de bron hem gebruikt
  number: string;          // zoals gedrukt / localId
  names: Partial<Record<Language, string>>;
  languages: Language[];   // waarin deze print bestaat
  rarity: string | null;
  illustrator: string | null;
  images: Partial<Record<Language, string>>;
  released: string | null; // YYYY-MM-DD
  /** Spelspecifieke velden voor filters en recepten; welke er zijn staat in de afdelingsconfiguratie. */
  attributes: Record<string, string | string[] | number | null>;
}
```

Spelspecifieke velden horen in `attributes`, met de sleutels uit de afdelingsconfiguratie:

| Spel | `attributes` |
| --- | --- |
| Pokémon | `type`, `dex`, `region`, `category`, `form` |
| One Piece | `color` (kan meerdere zijn), `leader`, `cardType`, `cost`, `power` |
| Magic | `colorIdentity`, `cardType`, `manaValue` |
| Lorcana | `ink`, `cardType`, `story` (franchise), `cost` |

De globale `CARDS`/`SETS` blijven bestaan, maar wijzen naar de catalogus van de **actieve afdeling**. Er staat altijd maar één catalogus in het geheugen. Dat is belangrijk, want de Pokémon-catalogus alleen heeft al ~60.000 kaarten.

### Talen per spel

`Language` is een string uit de afdelingsconfiguratie (`config.languages`). `LANGS` is niet meer vast. Aantallen in bezit worden per taal van dat spel bijgehouden.

### Collectie-item

```ts
interface CollectionItem {
  cardId: CardId;
  game: Game;
  counts: Partial<Record<Language, number>>;
  addedAt: number;
}
```

### Binder

Er komt één verplicht veld bij:

```ts
Binder { …; game: Game }
```

Een binder hoort bij één afdeling. Slots verwijzen in de opgeslagen vorm naar `'U:<cardId>'`, met een `cardId` uit hetzelfde spel. Een gedeelde binder neemt zijn `game` mee, zodat de kijker hem in het goede thema toont.

### Momentopnames van de waarde

Dit is nieuw. Eén document per dag:

```ts
// users/{uid}/valueSnapshots/{YYYY-MM-DD}
{ date: '2026-10-27', total: 1234.56,
  games: { pokemon: { value: 1100.12, cards: 812 }, 'one-piece': { value: 134.44, cards: 90 } } }
```

- Cardcase heeft geen server. De app schrijft daarom de momentopname van vandaag zelf, de eerste keer dat hij die dag geopend wordt en de prijzen binnen zijn. Later op de dag wordt hij bijgewerkt.
- De grafiek toont de opgeslagen dagen en vult de gaten aan door te interpoleren. Voor de tijd vóór de eerste momentopname blijft hij terugrekenen uit de Cardmarket-gemiddelden, zoals nu.

### Firestore (doel)

| Pad | Inhoud |
| --- | --- |
| `users/{uid}` → veld `cardcase` | `{ v: 2, games: Game[], lastGame, dark, summary: { [game]: { cards, unique, value, updatedAt } } }`. De **samenvatting** voedt "Mijn Cardcase" en de afdelingswisselaar, zonder dat elke catalogus geladen hoeft te worden. |
| `users/{uid}/games/{game}` | `{ v: 2, owned: { [cardId]: { counts, addedAt } }, binders: Binder[], savedAt, by }`. Elk spel heeft zijn eigen document, zodat één spel de limiet van 1 MiB niet voor alle spellen opmaakt. |
| `users/{uid}/valueSnapshots/{date}` | Zie hierboven. |
| `users/{uid}/images/{id}` | Ongewijzigd. |
| `shared/{uid}` | `{ games: { [game]: { owned, binders } } }` |
| `publicBinders/{shareId}` | Krijgt `game` erbij. |

> **Over het `game`-veld op collectie-items:** in Firestore is het spel van een item al bepaald door het documentpad (`games/{game}`) en het voorvoegsel van de sleutel. Het veld wordt daarom niet bij elk item opnieuw opgeslagen. In het TypeScript-model (`CollectionItem.game`) is het er wel. Zie de open punten in het implementatieplan.

`firestore.rules` heeft nieuwe `match`-blokken nodig voor `users/{uid}/games/{game}` en `users/{uid}/valueSnapshots/{date}`. Subcollecties erven de regels van hun ouder niet.

### Browsercache

| Sleutel | Inhoud |
| --- | --- |
| `cc-user-v2:<account>` | Kopie van het gebruikersdocument. |
| `cc-game-v2:<account>:<game>` | Kopie van één spel. |
| `cc-last-game` | Laatst gebruikte afdeling, ook voor gasten. |

---

## 3. Migratie v1 → v2

1. **Lezen:** vindt de app `cardcase.v === 1`, dan zet hij die in het geheugen om:
   - `games = ['pokemon']` en `lastGame = 'pokemon'`
   - elke `uid` → `pokemon:<set>-<nummer>`
   - elke binder krijgt `game: 'pokemon'`
2. **Schrijven:** daarna schrijft hij `users/{uid}/games/pokemon` en het nieuwe veld `cardcase` (v2). Het oude v1-veld blijft nog een tijd staan als `cardcaseV1`, om terug te kunnen.
3. **Gasten:** dezelfde stappen voor `localStorage['cc-user-v1']`.
4. **Gedeelde gegevens:** `shared/{uid}` en `publicBinders` worden bij de eerstvolgende keer opslaan in de nieuwe vorm geschreven. Bij het lezen blijft de app de oude vorm ook nog begrijpen.
5. **Tests:** een v1-document van een echte collectie moet na de migratie hetzelfde aantal kaarten, dezelfde binders en dezelfde slots opleveren.

Bestaande gebruikers hoeven niets te doen en zien geen onboarding.
