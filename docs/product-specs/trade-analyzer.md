# Trade analyzer

Status: Concept

## Doel

Gebruiker stelt twee sets kaarten samen (wat ik geef / wat ik krijg) en ziet of de ruil eerlijk is qua waarde.

## Functionaliteit v1

- Twee lijsten samenstellen uit `card-catalog` (niet per se uit eigen collectie — de andere partij hoeft geen account te hebben).
- Totale waarde per kant berekenen op basis van actuele `PriceSnapshot`.
- Verschil tonen (absoluut en percentage) en een simpel oordeel ("eerlijk" / "in jouw voordeel" / "in hun voordeel") op basis van een drempelwaarde.
- Ruil opslaan en later terugkijken.

## Nog niet opgelost

- Drempelwaarde voor "eerlijk" (bv. binnen 5%?) — arbitraire keuze, vastleggen zodra gebouwd zodat het niet stilzwijgend verandert.
