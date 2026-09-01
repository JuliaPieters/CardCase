# Deck insights

Status: Concept — onderscheidende feature, buiten de kern-v1-scope, hierna te bouwen.

## Doel

Twee dingen die Collectr en vergelijkbare apps niet doen, omdat ze puur waarde-gedreven zijn en geen weet hebben van hoe kaarten daadwerkelijk gespeeld worden:

1. **Deck-buildability**: van bekende competitieve archetypes, welke kan de gebruiker al (deels) bouwen met zijn huidige collectie, en wat mist hij nog?
2. **Collector value vs. speelwaarde**: onderscheid tonen tussen een kaart die duur is omdat hij zeldzaam is, en een kaart die duur is omdat hij veel in winnende decks zit. Twee heel verschillende redenen om een kaart te bezitten.

## Databron: `DeckDataProvider`

Analoog aan `CardProvider` (zie `ARCHITECTURE.md`): een aparte provider-interface voor archetype-/decklist-data, met dezelfde regel — domeinlogica kent nooit de ruwe API-respons, alleen het genormaliseerde model.

```ts
interface DeckDataProvider {
  readonly tcg: TcgId;
  listArchetypes(format?: string): Promise<Archetype[]>;
  getArchetypeDecklist(archetypeId: string): Promise<DecklistEntry[]>;
  getCardMetaShare(card: Card): Promise<number>; // % van tournament-decks dat deze kaart speelt
}

interface Archetype {
  id: string;
  tcg: TcgId;
  name: string;      // bv. "Charizard ex / Pidgeot ex"
  format: string;
  lastUpdated: string;
}

interface DecklistEntry {
  card: Card;
  quantity: number;
}
```

### Pokémon: Limitless TCG

[Limitless TCG](https://docs.limitlesstcg.com/developer.html) biedt tournament-standings en decklists via een publieke API, grotendeels zonder API-key (alleen het `/games/.../decks`-endpoint met deck-categorisatieregels vereist een key, aan te vragen voor publieke projecten). Dit is de eerste `DeckDataProvider`-implementatie: `LimitlessTcgProvider`. Zie `docs/references/limitless-tcg-api.md`.

Zijdelings: Limitless TCG platform ondersteunt naast Pokémon ook o.a. One Piece en (volgens derde-partij bronnen) Lorcana-tournaments — de moeite waard om te checken als dit ooit uitgebreid wordt, aangezien Lorcana een van de TCG's is die je zelf speelt.

### Magic: geen gratis officiële decklist-API

Er is geen vergelijkbare gratis, officiële API met tournament-decklists voor Magic (MTGGoldfish heeft wel data, maar geen publieke API — scrapen zou tegen hun voorwaarden kunnen ingaan). **Consequentie voor v1 van deze feature: deck-insights start met alleen Pokémon.** Voor Magic tonen we deze features niet, of tonen we een duidelijke "niet beschikbaar voor deze TCG"-status in plaats van te doen alsof het overal werkt. Dit expliciet vastleggen voorkomt dat de agent een nep-databron verzint zodra dit gebouwd wordt.

## Functionaliteit v1 (alleen Pokémon)

**Deck-buildability:**
- Lijst van actuele archetypes tonen (uit `listArchetypes`).
- Per archetype: percentage van de decklist dat de gebruiker al bezit, en een lijst ontbrekende kaarten (met prijs, uit `valuation`'s prijsdata).

**Collector value vs. speelwaarde:**
- Op de kaartdetailpagina (`card-catalog`): naast de marktprijs een "meta share"-indicator (bv. "gespeeld in 34% van recente tournament-decks") als die kaart in decklists voorkomt.
- Simpel label: "Collector's item" (hoge prijs, lage meta share) vs. "Competitief" (hoge meta share) vs. beide.

## Nog niet opgelost

- Hoe vaak wordt archetype-/decklist-data ververst? (voorstel: net als prijzen, periodiek via een achtergrondtaak, niet live)
- Rate limits van Limitless TCG zonder API-key zijn onbekend voor onze verwachte gebruikspatroon — uitzoeken tijdens het bouwen, eventueel key aanvragen.
