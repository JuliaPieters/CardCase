# Product specs — index (Cardcase)

Scope voor v1: kern van Collectr, zonder camera-scanning, zonder social/marketplace.

| Domein | Status | Beschrijving |
|---|---|---|
| [card-catalog.md](card-catalog.md) | Concept | Kaarten zoeken over meerdere TCG's |
| [collection.md](collection.md) | Concept | Collecties bijhouden, varianten, aantallen, set-completion |
| [valuation.md](valuation.md) | Concept | Portfolio-waarde, historie, gains/losses |
| [trade-analyzer.md](trade-analyzer.md) | Concept | Eerlijkheid van een ruil berekenen |

## Onderscheidende features (na de kern, niet in Collectr)

| Domein | Status | Beschrijving |
|---|---|---|
| [deck-insights.md](deck-insights.md) | Concept | Deck-buildability + collector value vs. speelwaarde (alleen Pokémon, zie beperking in het spec) |
| [portability.md](portability.md) | Concept | Collectie exporteren (JSON/CSV) en importeren vanuit een andere app (CSV) |

Set-completion (zie `collection.md`) is ook een onderscheidende feature, maar hoort qua data volledig bij het `collection`-domein en staat daarom niet los.

## Expliciet buiten scope voor v1

- Kaartherkenning via camera
- Marketplace (kopen/verkopen)
- Social features (showcase, creators volgen)
- Sport-kaarten / andere collectibles dan TCG's
