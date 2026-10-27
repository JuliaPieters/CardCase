# Cardcase – logo's en mascottes

Bronbestanden voor het Cardcase-logo, de mascotte per afdeling, favicons en kleurtokens.

## Afdelingen

| Map/bestandsnaam | Afdeling | Route |
|---|---|---|
| `pokemon` | Pokémon (het origineel) | `/pokemon` |
| `piraat` | Piraten-afdeling | `/one-piece` |
| `tovenaar` | Tovenaars-afdeling | `/magic` |
| `sprookje` | Sprookjes-afdeling | `/lorcana` |

## Inhoud

- `mascotte` – de volledige mascotte per afdeling als SVG (zelfde viewBox, dus overal even groot uitgelijnd). Gebruik voor onboarding, lege states, afdelingswisselaar en het overzicht "Mijn Cardcase".
- `header` – headerlogo per afdeling: mascotte + woordmerk "CardCase". De tekst gebruikt het lettertype **Pixelify Sans (700)** van Google Fonts. Advies: bouw het headerlogo in de app als Angular-component (mascotte-SVG + HTML-tekst), zodat het font, de kleuren en de schaduw uit de tokens komen. De SVG is de visuele referentie.
- `favicon` – pixel-art favicon per afdeling als SVG (16×16) en als PNG op 32, 180 (Apple touch icon) en 512 pixels.
- `thema/afdelingen.css` – kleurtokens per afdeling, te activeren met `data-game="…"` op de root van elke afdelingsroute.

## Woordmerk-regels

- "Card" is altijd signaalrood `#E3350D`, in elke afdeling.
- "Case" krijgt de accentkleur van de afdeling (`--color-afdeling-accent`; bij de sprookjes-afdeling inktblauw `#233A7A` met een gouden schaduw op een lichte achtergrond).
- Harde, verschoven schaduw zonder blur (4px bij het headerlogo, 8px bij grote logo's).

## Favicon per afdeling

Wissel de favicon mee met de afdeling (bijvoorbeeld in een route-resolver of een service die `<link rel="icon">` bijwerkt). Standaard in `src/index.html`:

```html

<link rel="icon" type="image/svg+xml" href="favicon/pokemon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="favicon/pokemon-32.png">
<link rel="apple-touch-icon" href="favicon/pokemon-apple-touch-180.png">
```

Zet de map `favicon/` in `public/` van het Angular-project.

## Richtlijnen mascotte

- Silhouet, pixelscherm-gezicht, ringen, kaartvakjes en omlijning zijn in elke variant gelijk; alleen outfit, accessoires en kleuren verschillen.
- Geen logo's, symbolen of kenmerkende elementen uit bestaande games gebruiken.
