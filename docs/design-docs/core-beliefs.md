# Kernprincipes

Status: leidend. Wijzig dit bestand alleen via een bewuste beslissing, niet stilzwijgend.

## 1. Eén genormaliseerd kaartmodel, ongeacht TCG

Pokémon TCG API en Scryfall (Magic) hebben totaal verschillende response-schema's (andere veldnamen, andere manier van varianten aangeven, andere rarity-schalen). Om `collection`, `valuation` en `trade-analyzer` TCG-onafhankelijk te houden, normaliseert elke `CardProvider` naar dit model:

```ts
interface Card {
  id: string;              // intern, uuid
  tcg: TcgId;               // 'pokemon' | 'magic'
  externalId: string;       // ruwe id bij de bron, voor re-fetch
  name: string;
  setCode: string;
  setName: string;
  cardNumber: string;
  variant: CardVariant;     // 'normal' | 'foil' | 'reverseFoil' | 'other'
  imageUrl: string;
  rarity: string;           // vrije tekst, geen TCG-specifieke enum
}

interface PriceSnapshot {
  cardId: string;
  currency: 'EUR' | 'USD';
  price: number;
  asOf: string;             // ISO-datum
  source: TcgId;
}
```

**Waarom `rarity` vrije tekst is en geen enum**: Pokémon en Magic gebruiken totaal andere rarity-schalen. Een gedeelde enum zou constant `other`/`unknown` opleveren. Vrije tekst nu, eventueel later een per-TCG rarity-lookup als de UI dit nodig heeft.

**Waarom `variant` wel een vaste enum is**: dit bepaalt direct de UI (welke knoppen tonen we) en de waardebepaling (foil vs. normal heeft andere prijs). Dit moet consistent zijn over TCG's heen om `valuation` simpel te houden.

## 2. Domeinlogica kent nooit een externe API direct

Zie `ARCHITECTURE.md`. Als een domein een veld nodig heeft dat niet in `Card` zit, is de vraag: hoort dit generiek in `Card`, of is dit TCG-specifieke informatie die niet generiek gemaakt moet worden? Los dit hier op, niet met een ad-hoc `any`-veld.

## 3. Prijsdata wordt gecachet, nooit live per render opgehaald

Gratis API's (Pokémon TCG API, Scryfall) hebben rate limits. `valuation` leest prijzen uit Firestore-cache die periodiek (Cloud Function/cron) wordt bijgewerkt, niet rechtstreeks bij elke portfolio-weergave.

## 4. Nog open vragen

- Hoe vaak wordt de prijscache ververst? (voorstel: 1x per dag, aan te passen in `docs/product-specs/valuation.md`)
- Wisselkoers EUR/USD: vaste bron nodig, nog niet gekozen.

Zie ook `schema-versioning.md` voor hoe wijzigingen aan dit model zelf worden afgehandeld zonder bestaande Firestore-data te breken.
