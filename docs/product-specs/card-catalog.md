# Card catalog

Status: Concept

## Doel

Gebruiker kan kaarten zoeken over meerdere TCG's heen en een kaart selecteren om aan zijn collectie toe te voegen.

## Functionaliteit v1

- Zoeken op naam, optioneel gefilterd op TCG en set.
- Resultaten tonen: afbeelding, naam, set, nummer, beschikbare varianten.
- Detail van één kaart: alle bekende varianten + huidige prijs per variant.

## Databronnen

- Pokémon: [Pokémon TCG API](https://pokemontcg.io/) — zie `docs/references/pokemon-tcg-api-llms.txt`
- Magic: [Scryfall API](https://scryfall.com/docs/api) — zie `docs/references/scryfall-api-llms.txt`

Elke bron heeft een eigen `CardProvider`-implementatie (zie `ARCHITECTURE.md`). Zoekresultaten van meerdere providers worden samengevoegd tot één lijst van genormaliseerde `Card`-objecten.

## Nog niet opgelost

- Wat gebeurt er als een zoekopdracht > X resultaten oplevert per provider — hoe verdelen we een resultatenlimiet over providers?
- Fuzzy matching / typo-tolerantie: afhankelijk van wat de externe API's zelf al bieden.
