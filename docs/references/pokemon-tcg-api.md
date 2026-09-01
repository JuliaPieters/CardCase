# Pokémon TCG API — referentie

Volledige docs: https://docs.pokemontcg.io/

## Basis

- Base URL: `https://api.pokemontcg.io/v2`
- Geen API key nodig, maar rate limits zijn zonder key laag. Registreer een gratis key via https://dev.pokemontcg.io en stuur mee als `X-Api-Key`-header.
- REST, JSON, standaard HTTP-statuscodes.

## Relevante endpoints voor `PokemonTcgProvider`

- `GET /v2/cards?q=name:pikachu` — zoeken op naam (Lucene-achtige syntax voor `q`, ondersteunt combinaties met set, type, etc.)
- `GET /v2/cards/{id}` — één kaart ophalen op id
- `GET /v2/sets` — sets ophalen (nodig voor `setName`/`setCode` normalisatie)

## Mapping naar intern `Card`-model

| Pokémon TCG API veld | Intern veld | Let op |
|---|---|---|
| `id` | `externalId` | |
| `name` | `name` | |
| `set.id` | `setCode` | |
| `set.name` | `setName` | |
| `number` | `cardNumber` | |
| `images.large` | `imageUrl` | |
| `rarity` | `rarity` | vrije tekst overnemen, zie `core-beliefs.md` |
| `tcgplayer.prices.*` | bron voor `PriceSnapshot` | let op: prijzen zitten al in de card-response, geen los endpoint |

## Bekende beperkingen

- Reliability van deze (community-onderhouden) API wisselt; bouw retries/timeouts in de provider-laag, niet in domeinlogica.
- Prijsdata komt via TCGPlayer-koppeling in de response en is niet altijd voor elke kaart aanwezig.
