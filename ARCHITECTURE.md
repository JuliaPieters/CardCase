# Architectuur

## Bedrijfsdomeinen

| Domein | Verantwoordelijkheid |
|---|---|
| `card-catalog` | Kaarten zoeken en normaliseren over alle TCG's heen |
| `collection` | Gebruikers-collecties: welke kaarten, aantallen, varianten, set-completion |
| `valuation` | Portfolio-waarde berekenen, historie bijhouden |
| `trade-analyzer` | Eerlijkheid van een ruil tussen twee sets kaarten berekenen |
| `deck-insights` | Deck-buildability en collector-vs-speelwaarde (zie `docs/product-specs/deck-insights.md`) — onderscheidende feature, na de kern |

Elk domein is intern gelaagd:

```
Types → Config → Repo → Service → UI
```

- **Types**: interne modellen van dit domein (bv. `Card`, `CollectionEntry`, `TradeOffer`).
- **Config**: domeinconfiguratie (bv. welke varianten bestaan, cache-instellingen).
- **Repo**: leest/schrijft data (Firestore), kent geen businessregels.
- **Service**: businessregels en orchestratie. Enige laag die `Providers` mag aanroepen.
- **UI**: Angular componenten die alleen met `Service` praten, nooit met `Repo` of `Providers` direct.

Afhankelijkheden mogen alleen "voorwaarts" in deze lijst. Een `Repo` mag geen `Service` importeren, een `UI`-component mag geen `Repo` importeren.

## Cross-cutting: Providers

Alles wat domeinoverschrijdend is loopt via één interface: `Providers`. Dit voorkomt dat elk domein zelf besluit hoe het met Firebase-auth of een externe TCG-API praat.

```
card-catalog ─┐
collection    ├──► Providers ──► Firebase / Pokémon TCG API / Scryfall
valuation     │
trade-analyzer┘
```

### De belangrijkste provider: `CardProvider`

Elke ondersteunde TCG implementeert dezelfde interface:

```ts
interface CardProvider {
  readonly tcg: TcgId; // 'pokemon' | 'magic' | ...
  search(query: string): Promise<Card[]>;
  getById(externalId: string): Promise<Card | null>;
  getPrice(card: Card): Promise<PriceSnapshot>;
}
```

`Card` is het gedeelde, genormaliseerde model — zie `docs/design-docs/core-beliefs.md` voor het exacte veld-voor-veld schema en waarom dit zo gekozen is. Domeinlogica (collection, valuation, trade-analyzer) kent **alleen** `Card` en `PriceSnapshot`, nooit de ruwe Pokémon TCG API- of Scryfall-response.

Nieuwe TCG toevoegen = nieuwe `CardProvider`-implementatie + registratie. Geen wijzigingen in andere domeinen nodig als de normalisatie klopt. Dit is de belangrijkste architecturale garantie van dit project — hier op controleren bij elke PR die een provider raakt.

### Tweede provider-familie: `DeckDataProvider`

Voor de `deck-insights`-feature (zie `docs/product-specs/deck-insights.md`): archetype- en decklist-data, analoog aan `CardProvider` maar met een eigen interface omdat de databron per TCG sterk verschilt (en voor sommige TCG's simpelweg niet bestaat — zie het spec voor de beperking bij Magic). Eerste implementatie: `LimitlessTcgProvider` (Pokémon).

### Gedeelde utility: `CardMatcher`

Zowel `deck-insights` (decklist-regels matchen aan een `Card`) als `portability` (CSV-import-regels matchen aan een `Card`) hebben hetzelfde probleem: vrije tekst (naam + set) omzetten naar een concrete `Card`-referentie, met onzekerheid over exacte matches. Dit wordt één gedeelde `CardMatcher`-utility, gebruikt door beide, in plaats van tweemaal apart geïmplementeerd — zie `docs/product-specs/portability.md` voor de regel dat een onzekere match altijd aan de gebruiker wordt voorgelegd, nooit automatisch gegokt.

## Mechanische afdwinging (nog in te richten)

- Lint-regel: bestanden in `*/repo/` mogen niets uit `*/service/` importeren.
- Lint-regel: alleen bestanden in `providers/` mogen externe API-clients (fetch/HTTP) direct aanroepen.
- Structural test: elk domein onder `src/app/domains/*` volgt de mapstructuur `types/ config/ repo/ service/ ui/`.

Zie `docs/exec-plans/active/00-foundation.md` voor wanneer dit wordt opgezet.
