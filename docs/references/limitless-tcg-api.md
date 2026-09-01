# Limitless TCG API — referentie

Volledige docs: https://docs.limitlesstcg.com/developer.html

## Basis

- Base URL: `https://play.limitlesstcg.com/api`
- Geen API-key nodig voor de meeste endpoints. Uitzondering: het `/decks`-endpoint onder `/games` (deck-categorisatieregels) vereist een key — alleen uit te geven aan publieke projecten met een duidelijk doel, aan te vragen via de site.
- Key meesturen via query-param `key` of header `X-Access-Key`.
- Rate limits zijn actief; check response-headers tijdens het bouwen.
- Primair gericht op Pokémon TCG; ondersteunt volgens de platformbeschrijving ook tournament-data voor andere spellen die op hetzelfde platform draaien (o.a. One Piece). Niet geverifieerd voor Magic of Lorcana op het moment van schrijven — checken voordat je hierop bouwt voor een andere TCG dan Pokémon.

## Relevante endpoints voor `LimitlessTcgProvider`

- `GET /tournaments` — lijst tournaments, filterbaar op format/land/datum
- `GET /tournaments/{id}/standings` — eindstand van een tournament
- `GET /tournaments/{id}/details` — details inclusief decklists per speler
- `GET /decks` (onder `/games/...`, key vereist) — archetype-categorisatieregels

## Mapping naar intern model (`DeckDataProvider`, zie `docs/product-specs/deck-insights.md`)

| Limitless-veld | Intern veld |
|---|---|
| Tournament standings → speler + decklist | bron voor `Archetype` + `DecklistEntry[]` |
| Kaartregel in een decklist (naam + aantal) | `DecklistEntry.card` (via `CardProvider` opzoeken) + `DecklistEntry.quantity` |

Let op: Limitless levert kaarten waarschijnlijk als naam + set-aanduiding in tekstvorm, niet als een kant-en-klare `Card`-referentie. De provider moet dit matchen tegen de Pokémon TCG API-catalogus — dit matchen is zelf een foutgevoelig stuk logica, expliciet testen met echte decklist-voorbeelden.

## Bekende beperkingen

- Geen vergelijkbare bron bekend voor Magic — zie `docs/product-specs/deck-insights.md` voor de consequentie daarvan.
- Doel van het platform is tournament-organisatie, niet een stabiele publieke data-API — houd rekening met wijzigingen en documenteer afwijkingen die je tegenkomt hier.
