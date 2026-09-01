# Design

Status: Leidend. Dit is de visuele bron van waarheid — bij twijfel over kleur, type of layout wordt hier gekeken, niet een nieuwe keuze verzonnen per component.

## Uitgangspunt

Cardcase moet aanvoelen als het opentrekken van een boosterpack, niet als een investeringsdashboard. Speels, licht, een beetje cartoonachtig — maar de cijfers (portfoliowaarde, gains/losses) blijven altijd het makkelijkst leesbare element op het scherm. Speelsheid mag de leesbaarheid van geld nooit in de weg zitten.

Zowel een licht als een donker thema worden vanaf v1 ondersteund — geen van beide is "de uitzondering".

## Kleur

| Token | Licht | Donker | Gebruik |
|---|---|---|---|
| `--surface-base` | `#FFFDF7` | `#1B1730` | Achtergrond |
| `--surface-panel` | `#FFF6E0` | `#251F42` | Kaarten/panelen, licht verhoogd t.o.v. base |
| `--text-primary` | `#241C33` | `#F3EFE6` | Hoofdtekst |
| `--text-muted` | `#6E6580` | `#A79CC4` | Secundaire tekst |
| `--accent-primary` | `#FFC738` | `#FFC738` | Foil-geel — signature accent, spaarzaam gebruiken |
| `--accent-secondary` | `#6C5CE7` | `#8C7CFF` | Interactieve elementen (links, actieve staat) |
| `--positive` | `#2FA97C` | `#4FD79C` | Gains |
| `--negative` | `#FF6B5C` | `#FF8272` | Losses |

**Belangrijk:** `--accent-primary` (het foil-geel) is het signature-element van de app en wordt gereserveerd voor precies twee dingen: de holo-sweep op de meest waardevolle kaart in een portfolio, en de primaire call-to-action-knop. Niet strooien over badges, iconen en labels — dat verwatert het effect.

## Typografie

- **Display/koppen:** [Baloo 2](https://fonts.google.com/specimen/Baloo+2) — rond, vriendelijk, geeft de speelse/cartoonachtige toon zonder kinderlijk te worden. Alleen voor titels en de portfoliowaarde zelf. Gewichten: 600 (koppen), 700 (de portfoliowaarde-hero).
- **Body/data:** [Manrope](https://fonts.google.com/specimen/Manrope) — neutrale grotesk met nette tabelcijfers, voor lijsten, tabellen, formulieren. Gewichten: 400 (body), 500 (labels/nadruk), 700 (alleen voor bedragen die moeten opvallen, bv. het verschil in de trade-analyzer). Cijfers in collectie- en waardetabellen gebruiken `font-variant-numeric: tabular-nums`.
- Beide via Google Fonts, self-hosted in de app (niet via een externe CDN-call bij elke pageload) — zie `docs/exec-plans/active/00-foundation.md`.
- Regellengte onder de 80 tekens voor lopende tekst.
- Geen ALL CAPS labels, geen eyebrow-labels boven koppen, geen "→" achter knoptekst.

## Schaal-tokens (verplicht, geen losse waarden)

Elke maat in de UI — lettertype, tekstgrootte, ruimte tussen elementen, afronding — komt uit een van onderstaande vaste schalen. Een component met een losse waarde zoals `font-size: 14px`, `margin: 6px` of een los `font-family` in plaats van een token is een architectuurfout, geen stijlkeuze — zie `docs/governance/QUALITY.md`.

| Token | Waarde | Gebruik |
|---|---|---|
| `--font-family-display` | `'Baloo 2', sans-serif` | Koppen, portfoliowaarde-hero |
| `--font-family-body` | `'Manrope', sans-serif` | Alle overige tekst: body, labels, tabellen, formulieren |

| Token | Waarde | Gebruik |
|---|---|---|
| `--font-weight-regular` | `400` | Body-tekst |
| `--font-weight-medium` | `500` | Labels, nadruk in body-tekst |
| `--font-weight-semibold` | `600` | Koppen (met `--font-family-display`) |
| `--font-weight-bold` | `700` | Portfoliowaarde-hero en bedragen die moeten opvallen (bv. het verschil in de trade-analyzer) |

| Token | Waarde | Gebruik |
|---|---|---|
| `--font-size-xs` | `0.75rem` | Bijschriften, kleine labels |
| `--font-size-sm` | `0.875rem` | Secundaire tekst |
| `--font-size-md` | `1rem` | Standaard body-tekst |
| `--font-size-lg` | `1.25rem` | Subkoppen |
| `--font-size-xl` | `1.75rem` | Koppen |
| `--font-size-2xl` | `2.5rem` | Portfoliowaarde-hero |

| Token | Waarde | Gebruik |
|---|---|---|
| `--space-xs` | `0.25rem` | Ruimte binnen een klein element (bv. tussen icoon en label) |
| `--space-sm` | `0.5rem` | Ruimte tussen nauw verwante elementen |
| `--space-md` | `1rem` | Standaard afstand tussen elementen |
| `--space-lg` | `1.5rem` | Afstand tussen groepen elementen |
| `--space-xl` | `2.5rem` | Afstand tussen secties |

| Token | Waarde | Gebruik |
|---|---|---|
| `--radius-sm` | `0.375rem` | Kleine elementen (knoppen, badges) |
| `--radius-md` | `0.75rem` | Panelen |
| `--radius-card` | `4%` (t.o.v. de kaart-tegel) | De TCG-kaarttegel zelf — bewust een andere naam dan `--radius-md`, want dit volgt de echte kaartvorm, niet een generieke paneelafronding |

Nieuwe waarde nodig die niet in de schaal past? Eerst hier toevoegen met een naam en reden, niet los in een component droppen — anders vervuilt de schaal zich stilletjes tot een verzameling toevallige getallen.

### Implementatie

Alle tokens hierboven staan als CSS custom properties op `:root` (licht) en `[data-theme="dark"]` (donker) — geen los theme-object in TypeScript, geen Tailwind-config-duplicatie ernaast. Voorbeeld:

```css
:root {
  --font-family-display: 'Baloo 2', sans-serif;
  --font-family-body: 'Manrope', sans-serif;
  --font-size-md: 1rem;
  --space-md: 1rem;
  --radius-md: 0.75rem;
  --surface-base: #FFFDF7;
  --accent-primary: #FFC738;
}

[data-theme="dark"] {
  --surface-base: #1B1730;
}
```

Een component gebruikt dus altijd `font-size: var(--font-size-md)`, nooit `font-size: 1rem` of `font-size: 16px` rechtstreeks — ook al is de uitkomst identiek. Zie de `architecture-check`-skill, die hier ook op controleert.

## Toegankelijkheid

Speels mag nooit ten koste gaan van bruikbaarheid:

- Zichtbare toetsenbord-focus op elk interactief element (geen `outline: none` zonder een eigen, duidelijk zichtbaar alternatief in de accent-kleuren hierboven).
- `prefers-reduced-motion` wordt gerespecteerd: de "slot-in"-animatie (zie Motion) vervalt naar een directe statusverandering zonder beweging.
- Kleur is nooit de enige drager van betekenis: `--positive`/`--negative` (gains/losses) gaan altijd samen met een `+`/`-`-teken of pijltje, niet alleen een kleurverschil — belangrijk voor kleurenblinde gebruikers.
- Contrast van tekst-op-achtergrond voldoet aan WCAG AA, in zowel het lichte als het donkere thema — expliciet checken bij het kiezen van een tint binnen de bestaande kleurtokens, niet er na afloop op hopen.

## Lege staten & foutmeldingen

Een lege collectie of een mislukte prijs-ophaal-actie is, net als in de frontend-design-richtlijnen, een moment om te sturen, niet om te verontschuldigen:

- **Lege collectie**: geen kale "Nog geen kaarten" — een uitnodiging om te beginnen, in de stem van de app (speels, niet overdreven). Bijvoorbeeld gericht op de eerste actie: kaarten zoeken en toevoegen.
- **Foutmelding (bv. een externe API die niet reageert)**: zegt exact wat er misging en wat de gebruiker kan doen (bv. "opnieuw proberen"), zonder een mens-achtige verontschuldiging ("oeps, sorry!"). De interface legt uit, het verontschuldigt zich niet.
- Consistentie: dezelfde actie heeft overal dezelfde naam. Een knop die "Kaart toevoegen" heet, hoort te resulteren in een melding die ook "toegevoegd" zegt, niet "opgeslagen" of "verwerkt".

## Layout

Kernmotief: **de kaart-vorm zelf is het UI-element**, niet een generieke rounded card. Elke kaart in de UI houdt de echte TCG-kaartverhouding (2.5:3.5) aan, met een gekleurde rand die de zeldzaamheid/variant aangeeft (bv. een subtiele holo-gradient-rand voor foil-varianten). Dit vervangt de standaard "SaaS-kaartenset met identieke afgeronde hoeken en schaduw" — hier heeft de vorm zelf betekenis.

```
Dashboard (portfolio-overzicht):
┌─────────────────────────────┐
│  Portfoliowaarde (groot,     │   ← hero: het cijfer, in display-type
│  display-type) + trend-lijn  │
├───────────┬───────────┬──────┤
│ Stijgers  │ Dalers    │ ...  │   ← smalle staten, geen kaartjes-grid
└───────────┴───────────┴──────┘

Collectie (binder-gevoel):
┌────┬────┬────┬────┐
│card│card│card│card│   ← elke tegel = echte kaartverhouding
├────┼────┼────┼────┤     rand-kleur = variant/zeldzaamheid
│card│card│card│card│
└────┴────┴────┴────┘
```

Portfoliowaarde en trends: links uitgelijnd, geen gecentreerde hero-tekst — dit is een werktool, geen landingspagina. De collectie-grid mag wel centraal in de pagina staan, zoals een binder op tafel.

## Motion

Eén moment krijgt de aandacht: een kaart toevoegen aan de collectie krijgt een korte "slot-in"-animatie (kaart schuift in de grid, lichte holo-flits). Verder geen hover-animaties op elk element — dat is de generieke tell van een gegenereerde interface. Motion die niet reageert op een actie van de gebruiker (auto-play, doorlopende shimmer) wordt vermeden.

## Wat we bewust vermijden

- Cream achtergrond + terracotta accent (de standaard AI-look).
- Identieke afgeronde kaartjes met dezelfde zachte schaduw voor alles.
- Monospace voor labels, ALL CAPS eyebrows, middle-dot-gescheiden metadata.
