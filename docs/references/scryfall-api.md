# Scryfall API (Magic: The Gathering) — referentie

Volledige docs: https://scryfall.com/docs/api

## Basis

- Base URL: `https://api.scryfall.com`
- Geen API key nodig. Wel expliciet gevraagd om verantwoord om te gaan met rate limits (richtlijn: max ~10 requests/seconde, met een korte pauze tussen calls) en een duidelijke `User-Agent`/`Accept`-header mee te sturen.
- REST, JSON.

## Relevante endpoints voor `MagicProvider`

- `GET /cards/search?q=<query>` — zoeken, ondersteunt Scryfall's eigen zoeksyntax (kleur, set, type, etc.)
- `GET /cards/named?fuzzy=<naam>` — losse fuzzy-match op naam
- `GET /cards/{id}` — één kaart op Scryfall-id
- `GET /sets` / `GET /sets/{code}` — setinformatie

## Mapping naar intern `Card`-model

| Scryfall veld | Intern veld | Let op |
|---|---|---|
| `id` | `externalId` | |
| `name` | `name` | |
| `set` | `setCode` | |
| `set_name` | `setName` | |
| `collector_number` | `cardNumber` | |
| `image_uris.large` (of per-face bij dubbelzijdige kaarten) | `imageUrl` | dubbelzijdige kaarten (`card_faces`) hebben geen top-level `image_uris` — apart afhandelen |
| `rarity` | `rarity` | vrije tekst overnemen |
| `prices.eur` / `prices.usd` | bron voor `PriceSnapshot` | Scryfall geeft losse EUR- en USD-prijzen, geen conversie nodig voor die twee valuta |

## Bekende beperkingen

- Foil/non-foil/etched zit in `prices.eur_foil` etc. — vertaal dit naar `CardVariant`, niet 1-op-1 doorgeven.
- Dubbelzijdige kaarten (transform/modal) hebben een afwijkende structuur — expliciet testen in de provider.
