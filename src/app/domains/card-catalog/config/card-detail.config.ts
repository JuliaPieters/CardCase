import { CardVariant } from '../types/card';

// Welke varianten de kaartdetailweergave probeert op te halen. Providers normaliseren zelf
// nog geen meerdere varianten per kaart (zie docs/exec-plans/tech-debt-tracker.md) — de
// service probeert daarom elke kandidaat-variant los via CardProvider.getPrice() en toont
// alleen wat daadwerkelijk een prijs oplevert (zie CardCatalogService.getVariantPrices).
export const CARD_DETAIL_VARIANT_CANDIDATES: CardVariant[] = ['normal', 'foil', 'reverseFoil'];
