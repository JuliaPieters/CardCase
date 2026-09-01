# Valuation

Status: Concept

## Doel

Live waarde van een portfolio tonen, met historie zodat gains/losses zichtbaar zijn over tijd.

## Functionaliteit v1

- Totale waarde per portfolio, som van `quantity × prijs per variant`.
- Waarde-grafiek over tijd (dag / maand / all-time).
- Grootste stijgers/dalers binnen een portfolio.
- Valuta wisselen (EUR/USD) — zie open vraag in `core-beliefs.md` over wisselkoersbron.

## Datamodel

```ts
interface PortfolioValueSnapshot {
  portfolioId: string;
  totalValue: number;
  currency: 'EUR' | 'USD';
  asOf: string;
}
```

Gebaseerd op `PriceSnapshot` (zie `core-beliefs.md`), niet op live API-calls per weergave.

## Nog niet opgelost

- Hoe vaak nemen we een portfolio-snapshot voor de historische grafiek? (voorstel: dagelijks, gekoppeld aan de prijscache-refresh)
