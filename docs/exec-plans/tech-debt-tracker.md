# Tech debt tracker

Bewuste shortcuts die later opgelost moeten worden. Voeg een regel toe zodra je er willens en wetens een neemt — niet achteraf reconstrueren.

| Datum | Domein | Shortcut | Waarom | Op te lossen wanneer |
|---|---|---|---|---|
| 2026-09-01 | providers (card-catalog) | `PokemonTcgProvider.getById`/`getPrice` gooien een expliciete "niet geïmplementeerd"-error; geen retries/timeouts rond `search()` ondanks de bekende reliability-issues van de API. | Exec-plan 00-foundation.md vroeg om één endpoint te bewijzen (laag-scheiding), niet een productieklare provider. | Zodra card-catalog daadwerkelijk gebouwd wordt. |
| 2026-09-01 | providers (card-catalog) | `Card.id` is een samengestelde placeholder (`tcg:externalId`) i.p.v. een echte uuid; `variant` staat altijd op `'normal'` (geen foil/reverseFoil-detectie via `tcgplayer.prices`). | Idem — dummy-implementatie, geen persistentielaag/variant-logica nog aanwezig. | Zodra card-catalog/repo daadwerkelijk kaarten persisteert. |
| 2026-09-01 | provider-fixtures | Slechts één fixture-scenario (`normal-card.json`) voor de Pokémon TCG API; geen reverse-foil/dubbelzijdige-kaart-scenario's (zie `.claude/skills/provider-fixtures/`). | Card-catalog bestaat nog niet; variant-mapping is nog niet geïmplementeerd. | Zodra card-catalog varianten daadwerkelijk normaliseert. |
| 2026-09-01 | Firestore rules | Veldnamen in `firestore.rules` (`ownerId`, `portfolioId`) zijn een aanname vooruitlopend op de echte schema's van `collection`/`trade-analyzer`. | Rules moesten van vóór de eerste domeindata af bestaan (SECURITY.md), maar die domeinen hebben nog geen Types. | Zodra collection/trade-analyzer hun Types definiëren — rules + rules-tests meebewegen. |
