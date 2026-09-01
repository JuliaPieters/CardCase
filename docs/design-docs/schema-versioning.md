# Schema-versionering

Status: Leidend.

## Waarom dit nu al vastligt

`Card`, `CollectionEntry` en de andere modellen uit `core-beliefs.md` zullen veranderen zodra het project groeit (nieuw veld, hernoemd veld, nieuwe variant-waarde). Bij een NoSQL-database als Firestore is er geen automatische schema-migratie zoals bij een SQL-database — oude documenten blijven gewoon in hun oude vorm bestaan totdat iets ze expliciet bijwerkt. Zonder afspraak hierover leidt dit tot code die overal moet checken "is dit veld er wel, of is dit een oud document?".

## Regel

1. **Elk document krijgt een `schemaVersion`-veld** (een simpel getal, startend bij `1`) op het moment dat het voor het eerst geschreven wordt.
2. **Een schemawijziging die bestaande data ongeldig maakt** (veld hernoemd, verwijderd, of van vorm veranderd) hoort gepaard te gaan met:
   - een verhoging van `schemaVersion` voor nieuw geschreven documenten,
   - een leesfunctie in de `Repo`-laag die oude versies naar de huidige vorm normaliseert bij het lezen ("read-time migration"), zodat de rest van de applicatie nooit met een oude vorm hoeft om te gaan,
   - een aantekening in `docs/exec-plans/tech-debt-tracker.md` als een echte backfill (alle bestaande documenten herschrijven) nog moet gebeuren.
3. **Een schemawijziging die achterwaarts compatibel is** (een nieuw optioneel veld toevoegen) hoeft geen versie-ophoging — bestaande documenten missen het veld gewoon, en de `Service`-laag gaat daar met een default mee om.

## Wat we bewust simpel houden

Geen aparte migratie-scripts-infrastructuur zoals bij een SQL-project (bv. Flyway/TypeORM-migrations) — bij deze schaal is read-time normalisatie in de `Repo`-laag voldoende. Als dit project ooit een punt bereikt waarop dat niet meer volstaat, is dat zelf een signaal om deze aanpak te herzien — dan hier vastleggen waarom.
