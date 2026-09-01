# Gebruiksvoorwaarden externe API's

Status: te checken vóór launch, niet alleen bij het bouwen van de provider. Elke bron heeft eigen regels over attributie en gebruik — dit is geen puur technische kwestie.

| Bron | Attributie vereist? | Bekende beperkingen |
|---|---|---|
| Pokémon TCG API | Geen officiële attributie-eis bekend, wel expliciet **niet-officieel/community-onderhouden** en zonder affiliatie met The Pokémon Company — niet suggereren dat Cardcase officieel is. | Rate limits zonder key laag; registreer een key (zie `docs/references/pokemon-tcg-api.md`). |
| Scryfall | Vraagt om creditering ("data provided by Scryfall") ergens zichtbaar in de app, en om verantwoord om te gaan met rate limits (geen agressieve bulk-scraping). | Geen bulk-doorverkoop van hun data als eigen product. |
| Limitless TCG | Platformbeschrijving vermeldt dat de API-toegang tot het `/decks`-endpoint alleen wordt gegeven aan **publieke projecten met een legitiem doel** — een key aanvragen vereist dus een korte uitleg van wat Cardcase is. | Niet bedoeld als stabiele publieke data-API voor derde partijen — wijzigingen zijn mogelijk zonder aankondiging. |

## Actie voor dit project

- Voeg een simpele "Databronnen"-sectie toe aan de app (bv. in een instellingen- of over-scherm) met creditering aan Pokémon TCG API, Scryfall en Limitless TCG.
- Bij het aanvragen van een Limitless TCG API-key: kort uitleggen wat Cardcase is en dat het een niet-commercieel hobbyproject is.
- Cardcase zelf claimt nergens officieel gelieerd te zijn aan Pokémon, Wizards of the Coast (Magic), of een van de andere TCG-uitgevers.

## Nog niet opgelost

- Herbekijken zodra de app daadwerkelijk gebruikers buiten jezelf krijgt — bij puur persoonlijk gebruik is dit risico laag, bij een publiek toegankelijke app weegt dit zwaarder.
