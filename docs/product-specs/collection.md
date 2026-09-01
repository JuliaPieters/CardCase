# Collection

Status: Concept

## Doel

Gebruiker houdt bij welke kaarten hij bezit, in welke variant en aantal, verdeeld over eventueel meerdere portfolio's.

## Functionaliteit v1

- Kaart toevoegen aan collectie vanuit `card-catalog` (variant + aantal kiezen).
- Aantal per variant aanpassen of kaart verwijderen.
- Meerdere portfolio's per gebruiker (bv. "Ruilvoorraad" vs. "Vaste collectie").
- Kaart verplaatsen tussen portfolio's.
- Bulk-acties: meerdere kaarten selecteren en samen verplaatsen/verwijderen.
- **Set-completion**: per set tonen hoeveel van de kaarten de gebruiker bezit (bv. "87/102 uit Base Set"), met een voortgangsbalk. Dit is iets wat Collectr niet toont — die apps zijn puur waarde-gedreven, dit dient verzamelaars die juist volledige sets willen afmaken.
- **Export/import**: zie `docs/product-specs/portability.md` — collectie exporteren (JSON/CSV) en importeren vanuit een andere app (CSV, minimaal naam + set + aantal).

## Datamodel (indicatief, zie `core-beliefs.md` voor `Card`)

```ts
interface CollectionEntry {
  id: string;
  userId: string;
  portfolioId: string;
  card: Card;
  variant: CardVariant;
  quantity: number;
  addedAt: string;
}
```

## Nog niet opgelost

- Mag dezelfde kaart+variant meerdere keren als losse entry bestaan, of altijd samenvoegen tot één entry met opgehoogd aantal? (voorstel: altijd samenvoegen — vastleggen zodra gebouwd)
- Set-completion heeft het totale aantal kaarten per set nodig (bv. `printedTotal` uit de Pokémon TCG API, `card_count` uit Scryfall sets) — op te halen via `CardProvider`, niet los opnieuw te modelleren.
