# Portability (export & import)

Status: Concept — onderscheidende feature (Collectr biedt geen CSV-import vanuit andere apps), hoort bij het `collection`-domein.

## Doel

Voorkomen dat mensen vastzitten aan Cardcase: je collectie moet je er altijd weer uit kunnen krijgen, en je moet 'm vanuit een andere app kunnen overzetten zonder alles opnieuw met de hand in te voeren.

## Export

Twee formaten, beide vanuit een portfolio te downloaden:

- **JSON** — volledige, exacte export van je data (inclusief interne id's, `schemaVersion` uit `docs/design-docs/schema-versioning.md`). Bedoeld als backup / om later weer in Cardcase zelf te importeren.
- **CSV** — spreadsheet-vriendelijk, kolommen: `name, set_name, set_code, card_number, variant, quantity, tcg`. Bedoeld om te openen in Excel/Google Sheets of te importeren in een andere app.

## Import (CSV)

### Minimaal vereiste kolommen

Op basis van hoe bestaande apps (TCGplayer, ManaBox, Deckbox) dit al doen: minimaal **kaartnaam** + **set** (naam of code) + **aantal**. Alles daarboven (variant, prijs die de gebruiker zelf betaalde, conditie) is optioneel en wordt genegeerd als de kolom ontbreekt.

```
name,set_name,quantity
Charizard,Base Set,1
Pikachu,Jungle,3
```

### Matching-logica

Elke geïmporteerde rij wordt gematcht tegen de kaartcatalogus via `CardProvider.search()` (zie `docs/governance/ARCHITECTURE.md`), gefilterd op de opgegeven set. Drie uitkomsten:

1. **Eén duidelijke match** → automatisch toevoegen aan de collectie.
2. **Geen match** → op een "te controleren"-lijst zetten, niet stilzwijgend overslaan. De gebruiker ziet na de import expliciet welke regels niet zijn herkend.
3. **Meerdere mogelijke matches** (bv. setnaam komt niet exact overeen, zoals "Magic 2015" vs. "Magic 2015 Core Set" — een bekend probleem bij CSV-imports tussen apps) → ook op de "te controleren"-lijst, met de kandidaten erbij, zodat de gebruiker zelf kiest. **Nooit automatisch de beste gok nemen** — dit is financiële/collectiedata, een verkeerde automatische match is erger dan een handmatige extra stap.

### Gedeelde matching-logica met deck-insights

`deck-insights.md` heeft exact hetzelfde probleem: decklist-regels (tekst) matchen tegen een `Card`. Bouw dit als één gedeelde `CardMatcher`-utility die door zowel de import-feature als `LimitlessTcgProvider` gebruikt wordt, in plaats van de matching-logica twee keer apart te implementeren (zie SOLID/DRY in `docs/governance/QUALITY.md`).

## Nog niet opgelost

- Conditie (Near Mint, Lightly Played, etc.) wordt door sommige apps geëxporteerd maar zit niet in het huidige `CollectionEntry`-model (zie `docs/design-docs/core-beliefs.md`). Bewust weggelaten voor nu — bij import wordt een conditie-kolom, indien aanwezig, genegeerd, niet foutief in een ander veld gepropt. Toevoegen als het een terugkerende behoefte blijkt.
- Bestandsgrootte-limiet voor upload nog te bepalen (grote collecties = grote CSV's).
- Test-fixtures voor deze feature horen dezelfde aanpak te volgen als `.claude/skills/provider-fixtures/`: echte export-CSV's van minstens één andere app (bv. TCGplayer) opslaan als testmateriaal, niet zelf verzinnen.
