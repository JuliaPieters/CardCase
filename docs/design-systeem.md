# Cardcase · design-systeem

Dit document beschrijft eerst het huidige systeem (Pokémon) en daarna hoe het per afdeling themabaar wordt.

---

## 1. Huidig systeem

### Stijl

Een retro handheld, in de stijl van een Pokédex of Game Boy:
- signaalrode zijbalk en header
- een groen LCD-scherm voor cijfers
- dikke zwarte randen met een harde schaduw, zonder vervaging
- een pixelfont voor koppen en labels

Het is speels en tastbaar: knoppen "drukken in" (`press`, `press-sm`, `press-xy`) en kaarten "liften" (`lift`).

### Tokens (`src/styles.css`)

Deze tokens wisselen tussen licht en donker (`body` / `body.cc-dark`):

| Token | Licht | Donker | Gebruik |
| --- | --- | --- | --- |
| `--bg` | `#F7F3E8` crème | `#1A1C22` | pagina-achtergrond |
| `--surface` | `#FFFDF6` | `#252830` | panelen, kaarten |
| `--soft` | `#EEE8D8` | `#2D3039` | zachte vlakken |
| `--ink` | `#1A1C22` antraciet | `#F2EEE3` | tekst |
| `--muted` | `#6A6558` | `#A8A497` | secundaire tekst |
| `--line` | `#1A1C22` | `#050608` | randen en harde schaduw |
| `--red` | `#E3350D` signaalrood | idem | accent, zijbalk |
| `--page`, `--pocket` | `#FBF8EF`, `#ECE6D6` | `#2A2D35`, `#202228` | binderpagina en pockets |

Deze kleuren zijn vast en hetzelfde in licht en donker: `lcd #9BBC0F` (retrogroen), `lcd-edge #8BAC0F`, `lcd-mid #306230`, `lcd-ink #0F380F`, `device #2B2E36`, `cream #FFF8EE`, `paper`, `coal #1A1C22`, `amber`, `gold`.

**Fonts:** Nunito (tekst), Pixelify Sans (`font-pixel`: koppen, labels, cijfers) en Noto Sans JP/SC/TC (Aziatische kaartnamen). Iconen zijn Material Symbols Rounded.

**Schaduwen:** `--shadow-hard` (4px 4px 0), `-md` (3px), `-sm` (2px), altijd in `--line`.

**Componentklassen:** `.panel`, `.btn`, `.btn-icon`, `.chip`, `.lcd`, `.press*`, `.lift`, `.tap`, `.icon`.

### Waar het nu niet themabaar is

Alles wat per afdeling moet verschillen, moet via tokens lopen. Nu staan er nog veel kleuren direct in de code:

- **~320 hex-kleuren** in templates en view-models, vooral in `core/store.ts` (~100) en `core/data.ts` (~120, deels inhoud zoals typekleuren en stickers, en dat mag blijven). Ook in `app.html`, `scan.ts` en `page-scan.ts`.
- **~370 keer een vaste klasse** zoals `bg-lcd`, `bg-red`, `bg-device`, `text-cream` of `font-pixel`.
- De logo's zijn PNG's met vaste kleuren (`public/icons/logo-*.png`).

---

## 2. Thema per afdeling

### Principe

- **Alle componenten zijn gedeeld.** Alleen designtokens verschillen per afdeling.
- Het attribuut **`data-game="pokemon" | "one-piece" | "magic" | "lorcana"`** bepaalt het thema.
- Tokens zijn CSS-variabelen onder `[data-game="…"]`, gekoppeld aan het Tailwind-blok `@theme inline`. Een utility als `bg-surface` volgt zo vanzelf de afdeling.
- **Tokennamen worden voluit geschreven, zonder afkortingen.** `--bg` wordt `--color-background`, `--ink` wordt `--color-text`, `--lcd` wordt `--color-display`, enzovoort.
- **Donkere modus** blijft een tweede as. Elke afdeling definieert licht én donker.

> **Waar `data-game` staat.** Het plan zegt "op de root van elke afdelingsroute". Sheets, de scanner, toasts en het loginpaneel renderen echter buiten de route-outlet, en de zijbalk en header horen ook bij de afdeling. Daarom komt `data-game` op `<html>`. De afdelingsroute zet het daar bij binnenkomst. Zie het implementatieplan.

### Tokens (namen)

| Nieuw token | Was | Betekenis |
| --- | --- | --- |
| `--color-background` | `--bg` | pagina-achtergrond |
| `--color-surface` | `--surface` | panelen, kaarten |
| `--color-surface-soft` | `--soft` | zachte vlakken |
| `--color-text` | `--ink` | tekst |
| `--color-text-muted` | `--muted` | secundaire tekst |
| `--color-line` | `--line` | randen, harde schaduw |
| `--color-accent` | `--red` (behalve in het logo) | knoppen, actieve staat, zijbalk |
| `--color-accent-dark` | — | donkere tint van het accent (hover, rand) |
| `--color-on-accent` | `cream` | tekst op accent |
| `--color-highlight` | `gold` / `lcd` | tweede accent (badges, voortgang) |
| `--color-display` | `lcd` | het "scherm" (Pokémon: LCD, Piraten: perkament, …) |
| `--color-display-edge` | `lcd-edge` | rand van het scherm |
| `--color-display-text` | `lcd-ink` | tekst op het scherm |
| `--color-display-muted` | `lcd-mid` | balken, rasters op het scherm |
| `--color-device` | `device` | behuizing (donker vlak achter het scherm) |
| `--color-binder-page`, `--color-binder-pocket` | `--page`, `--pocket` | binder |
| `--color-logo-card` | — | **altijd `#E3350D`** (signaalrood) |
| `--color-logo-case` | — | accentkleur van de afdeling |
| `--font-body` | `--font-sans` | lopende tekst |
| `--font-display` | `--font-pixel` | koppen, labels, cijfers |
| `--shadow-hard`, `--shadow-hard-medium`, `--shadow-hard-small` | `-md`, `-sm` | harde schaduw |
| `--radius-panel`, `--radius-button` | vast 12px / 10px | hoekafronding |

Inhoudskleuren blijven vast: typekleuren van Pokémon, sticker- en achtergrondpaletten, holo-verlopen. Die horen bij de kaarten en decoraties, niet bij het thema.

### Palet per afdeling

De kleuren komen uit het plan. Licht en donker zijn uitgewerkt in de lijn van het huidige Pokémon-thema. Waarden met *(voorstel)* zijn nog niet vastgesteld en worden tijdens het bouwen getest op contrast (WCAG AA voor tekst).

**Pokémon** (huidig, retro handheld)
- accent signaalrood `#E3350D`, scherm retrogroen `#9BBC0F`, achtergrond crème `#F7F3E8`, tekst/lijn antraciet `#1A1C22`
- fonts: Nunito + Pixelify Sans

**Lorcana** (sprookjes)
- accent inktblauw `#233A7A`, donker inktblauw `#172757`, achtergrond roomwit `#F6F1E4`, highlight goud `#E2B53A`
- scherm: roomwit met een gouden rand *(voorstel)*
- fonts: Nunito + een sierlijk serif voor koppen, bijv. *Cormorant Garamond* of *Fraunces* *(voorstel)*
- schaduw: zachter en minder hard dan Pokémon, bijv. 3px in donker inktblauw *(voorstel)*

**Magic** (tovenaars)
- accent paars `#4B2A7B`, donker paars `#321A57`, nachtblauw `#141634` (achtergrond in donker, behuizing), zilver `#D9DCE8` (lijnen in donker, scherm), highlight lavendel `#C9B6FF`
- fonts: Nunito + *Cinzel* voor koppen *(voorstel)*

**One Piece** (piraten)
- accent diep zeeblauw `#1F3A5F`, donker zeeblauw `#142A47`, achtergrond/scherm perkament `#EFE3C4`, highlight goud `#D4A63A`
- fonts: Nunito + *Pirata One* of *IM Fell English SC* voor koppen *(voorstel)*

### Logo's, mascottes en favicons

De bronbestanden zijn er al (aangeleverd in `public/icons/cardcase-logo`, toelichting in [logos/README.md](logos/README.md)). Ze zijn verplaatst naar één map per afdeling, met de route als mapnaam:

```
public/logos/<pokemon | lorcana | magic | one-piece>/
  mascotte.svg         volledige mascotte (zelfde viewBox in elke afdeling)
  header.svg           mascotte + woordmerk, als visuele referentie
  favicon.svg          16×16 pixel-art
  favicon-32.png  apple-touch-180.png  icon-512.png
```

In de aanlevering heten de mappen `piraat`, `tovenaar` en `sprookje`. In de code is de naam overal de `Game`-waarde (`one-piece`, `magic`, `lorcana`), dus ook in `data-game`. Het plan zegt `src/assets/logos/`, maar dit project serveert `public/`.

- **Headerlogo als component:** de README raadt aan het headerlogo te bouwen als Angular-component: de mascotte-SVG plus het woord "CardCase" als HTML-tekst in Pixelify Sans 700. Font, kleuren en schaduw komen dan uit de tokens. `header.svg` is de referentie.
- **Woordmerk:** "Card" is altijd signaalrood `#E3350D` (`--color-logo-card`). "Case" krijgt de accentkleur van de afdeling (`--color-logo-case`):
  - Pokémon: retrogroen `#9BBC0F`
  - Lorcana: inktblauw `#233A7A` met een gouden schaduw op een lichte achtergrond
- **Schaduw:** hard en verschoven, zonder blur: 4px bij het headerlogo, 8px bij grote logo's.
- **Favicon:** de actieve afdeling zet `link[rel=icon]` (SVG en 32px PNG) op haar eigen bestanden.
- **App-icoon:** los van de afdeling; standaard de CardCase-robot (Pokémon). In je account (accountpaneel) kies je er een, dat zet `apple-touch-icon` en het manifest op `icons/<game>/`. Bronbestanden in `design/app-icons/<game>/app-icon.png`, gerenderd door `npm run icons`; een nieuw icoon ook in `APP_ICONS` (games/chrome.ts) zetten.
- **Mascotte:** wordt gebruikt in de afdelingswisselaar (icoon), op de onboarding, bij lege staten en op de tegels van "Mijn Cardcase". Silhouet, pixelgezicht, ringen en omlijning zijn overal gelijk; alleen outfit, accessoires en kleuren verschillen.

### Aangeleverde kleurtokens

[logos/afdelingen.css](logos/afdelingen.css) geeft per afdeling een palet met Nederlandse namen (`--color-afdeling-primair`, `-accent`, `-achtergrond`, `-oppervlak`, `-extra`, `--color-merk-card`, en voor Pokémon de `--color-scherm-*`-tinten). Dat zijn de **waarden**. In de app worden ze gekoppeld aan de semantische tokens hierboven:

| Aangeleverd | Semantisch token |
| --- | --- |
| `--color-merk-card` | `--color-logo-card` |
| `--color-afdeling-primair` | `--color-accent` (zijbalk, knoppen) |
| `--color-afdeling-primair-donker` | `--color-accent-dark` |
| `--color-afdeling-accent` | `--color-highlight` en `--color-logo-case` (behalve Lorcana, zie boven) |
| `--color-afdeling-achtergrond` | `--color-background` |
| `--color-afdeling-oppervlak` | `--color-surface` |
| `--color-afdeling-extra` | `--color-highlight-secondary` |
| `--color-scherm-*` | `--color-display*` |
| `--color-omlijning` | `--color-line` |

> Let op: de paletten zijn één modus per afdeling. Tovenaars hebben een donkere basis (nachtblauw `#141634`); de andere afdelingen zijn licht. Hoe de knop voor de donkere modus zich per afdeling gedraagt, is een open punt in het implementatieplan.

### Componenten die erbij komen

| Component | Waar | Opmerking |
| --- | --- | --- |
| **Afdelingswisselaar** | header (smal) en bovenaan de zijbalk (breed) | Mascotte-icoon van de huidige afdeling. Klik opent een menu met de andere gekozen afdelingen (icoon, kaarten, waarde) en "Afdeling toevoegen". Elke regel staat in het thema van die afdeling, als voorproefje. Het wisselen zelf heeft een korte overgang (kleuren in ~200 ms), zonder volledige paginalading. |
| **Afdelingstegel** | "Mijn Cardcase", onboarding | Mascotte, naam, aantal kaarten en waarde, in het thema van die afdeling. |
| **Onboarding "Wat verzamel jij?"** | `/welkom` | Tegels die je aan- en uitvinkt (meerdere tegelijk), met een knop om verder te gaan. |
| **"Mijn Cardcase"** | `/overzicht` | Neutraal thema (zie hieronder). Totale waarde met grafiek, daaronder een tegel per afdeling. |

**Neutraal thema** voor `/overzicht` en `/welkom`: crème met antraciet, signaalrood alleen in het logo, en geen pixelfont. Zo staat het boven de afdelingen.
