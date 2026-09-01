# Exec-plan: Volledige v1-site

Status: Actief
Domein(en): card-catalog, collection, valuation, trade-analyzer + app-brede afwerking

## Doel

Een complete, samenhangende, visueel afgewerkte v1 van Cardcase — niet losse geïsoleerde schermen per domein, maar één werkende site: kaarten zoeken → toevoegen aan een collectie → portfoliowaarde zien → een ruil analyseren. Dit vervangt het domein-voor-domein-tempo van eerdere exec-plans: alle vier kerndomeinen uit `docs/product-specs/index.md` worden nu in samenhang gebouwd.

Expliciet **buiten** dit plan (ongewijzigd t.o.v. eerdere afspraken): kaartherkenning via camera, marketplace, social features, extra TCG's naast Pokémon/Magic, en de "onderscheidende features" (`deck-insights`, `portability`) — dat blijven latere exec-plans.

## Stappen

### App-shell en navigatie
- [x] Een echte app-shell bouwen: header met de Cardcase-naam/logo-achtige wordmark (Baloo 2), navigatie (nu: Zoeken — Collectie/Trade Analyzer volgen zodra die domeinen bestaan, zie beslissingen), thema-toggle (licht/donker, met persistente keuze via localStorage + systeemvoorkeur als startpunt).
- [x] Layout-grid conform `DESIGN.md`: `app.scss` geeft de main-content consistente marges (`--space-xl`) en een max-breedte, niet meer los zwevend linksboven.

### Card-catalog afwerken (voortbouwend op wat er al staat)
- [x] Zoekformulier en TCG-dropdown herstijlen met de tokens (`--surface-panel`, `--radius-md` voor het paneel, `--radius-sm` voor de velden zelf — zie beslissingen) in plaats van browser-defaults.
- [x] Zoekresultaten tonen als kaart-tegels: echte 2.5:3.5-verhouding, randkleur per zeldzaamheid (zie `DESIGN.md` "Layout" en beslissingen — variant zelf is nog steeds altijd 'normal').
- [x] Kaartdetailweergave: bekende varianten + prijs per variant, nu écht (niet meer uitgesteld) — `CardProvider.getPrice()` afgemaakt bij beide providers, `PriceSnapshot` uitgebreid met `variant`.
- [x] Lege staat herschreven: de zoekpagina toont bij binnenkomst automatisch voorbeeldkaarten i.p.v. "zoek een kaart om te beginnen" (zie beslissingen) — dit was de kern van de gebruikersfeedback ("kaal, een paar knoppen"). Foutstaat (provider niet bereikbaar) bestond al sinds 01-card-catalog.md en is ongewijzigd (zegt exact welke bron faalde).

### Collection bouwen
- [ ] `CollectionEntry`-model + Firestore-repo conform `docs/product-specs/collection.md` en de laagstructuur.
- [ ] Kaart vanuit card-catalog toevoegen aan een portfolio (variant + aantal kiezen).
- [ ] Collectieoverzicht als binder-grid (zie `DESIGN.md` "Layout" — kaarttegels, niet een lijst/tabel).
- [ ] Meerdere portfolio's, kaart verplaatsen, bulk-acties (select meerdere → verplaatsen/verwijderen).
- [ ] Set-completion: voortgangsbalk per set.
- [ ] Firestore security rules bijwerken voor de echte `collectionEntries`/`portfolios`-schema's (vervangt de placeholder-veldnamen uit `firestore.rules`, zie tech-debt-tracker).

### Valuation bouwen
- [ ] Portfoliowaarde berekenen (som van `quantity × prijs`), getoond als hero-cijfer (`--font-size-2xl`, Baloo 2, tabular nums).
- [ ] Waardegrafiek over tijd (dag/maand/all-time) — periodieke prijs-snapshot conform `docs/product-specs/valuation.md`.
- [ ] Grootste stijgers/dalers-widget.
- [ ] Valuta-wissel EUR/USD (bron nog open, zie `core-beliefs.md` — kies er nu één en leg de keuze vast).

### Trade-analyzer bouwen
- [ ] Twee kaartenlijsten samenstellen (wat ik geef / wat ik krijg) vanuit card-catalog.
- [ ] Totale waarde per kant + verschil (absoluut/percentage) + eerlijkheids-oordeel met een gekozen drempelwaarde (leg de gekozen waarde vast in het spec, was nog open).
- [ ] Ruil opslaan en terugkijken.

### App-brede afwerking (niet per domein los, aan het eind in samenhang)
- [ ] Consistentie-pas over alle schermen: dezelfde spacing-tokens, dezelfde knop-stijlen, dezelfde lege/foutstaat-toon overal.
- [ ] Licht + donker thema in elk scherm getest via `.claude/skills/browser-validate/`.
- [ ] Toegankelijkheidscheck (focus-states, contrast, `prefers-reduced-motion`) over de hele site, niet alleen card-catalog.
- [ ] Definition-of-done uit `docs/governance/QUALITY.md` per domein afvinken (tests, geen hardcoded waarden, architectuurregels, security rules).

## Beslissingen tijdens uitvoering

- **Theme-service en app-header horen niet bij een domein.** Thema-keuze en navigatie zijn app-brede UI-concerns, geen bedrijfsdomein (`ARCHITECTURE.md` gaat over `domains/*` en `providers/`, niet over app-chrome). Nieuwe map `src/app/shell/` ernaast, analoog aan hoe `app.routes.ts`/`app.config.ts` al buiten de domeinstructuur staan.
- **Navigatie groeit mee met bestaande domeinen.** Nu alleen "Zoeken" — geen "Collectie"/"Trade Analyzer"-links naar routes die nog niet bestaan (dode links). Toegevoegd zodra die domeinen daadwerkelijk gebouwd zijn, verderop in dit exec-plan.
- **Voorbeeldkaarten bij binnenkomst** (`CARD_SEARCH_EXAMPLE_QUERY = 'dragon'`, card-catalog/config): direct aanleiding voor dit hele exec-plan was de gebruikersfeedback dat de site "kaal" aanvoelde. `'dragon'` is getest tegen zowel de Pokémon TCG API als Scryfall en levert bij beide rijke, herkenbare resultaten op — geen willekeurige keuze. De UI onderscheidt expliciet "Voorbeeldkaarten" van "Resultaten voor '...'" zodat dit niet als een echte zoekopdracht overkomt.
- **Prijs is niet langer uitgesteld.** 01-card-catalog.md stelde prijs bewust uit vanwege de open vragen over prijscache/wisselkoers in `core-beliefs.md`. Die vragen gaan over `valuation`'s *geaggregeerde, herhaalde* prijsweergave (portfoliowaarde); een kaartdetailweergave is een losse, door de gebruiker geïnitieerde actie — core-beliefs.md #3 is hierop bijgewerkt met een expliciete uitzondering.
- **`PriceSnapshot` uitgebreid met `variant`** (ook in `core-beliefs.md`, het canonieke model): zonder dit veld is een lijst prijzen voor dezelfde kaart (zelfde `cardId`, dat een *printing* identificeert, geen variant) niet naar variant te herleiden. Bewuste, afgewogen uitbreiding van het gedeelde model, geen stilzwijgende wijziging.
- **Kaartdetail probeert alle kandidaat-varianten** (`CARD_DETAIL_VARIANT_CANDIDATES = ['normal','foil','reverseFoil']`, card-catalog/config) via `CardProvider.getPrice()` en toont alleen wat een prijs opleverde — geen wijziging aan de `CardProvider`-interface zelf (die blijft exact zoals in `ARCHITECTURE.md` gepind: search/getById/getPrice, geen "geef alle varianten"-methode).
- **Currency-voorkeur bij Scryfall (Magic): EUR boven USD** waar beide beschikbaar zijn — Nederlandse gebruiker, geen conversie nodig (Scryfall geeft beide direct). Pokémon TCG API geeft alleen USD (tcgplayer). Dit is een per-kaart weergavekeuze, los van `valuation`'s latere vraag hoe *meerdere* valuta's worden opgeteld tot één portfoliototaal (die vereist wél een wisselkoers-bron).
- **Rarity-gebaseerde randkleur, geen volledige zeldzaamheidskleurschaal.** DESIGN.md reserveert `--accent-primary` voor precies twee dingen. In plaats van nieuwe kleurtokens te verzinnen zonder visuele review: een grove twee-staps-indeling (common/uncommon = neutraal, al het overige = `--accent-secondary`) met uitsluitend bestaande tokens. Een rijkere schaal is een bewuste vervolgstap die eerst nieuwe, benoemde tokens in DESIGN.md nodig heeft.
- **`nl-NL` als app-locale** (`LOCALE_ID` in `app.config.ts`, `@angular/common/locales/nl` geregistreerd) voor correcte prijsnotatie (`€ 1,23` i.p.v. `$1.23`) — relevant voor zowel deze prijzen als straks `valuation`'s portfoliowaarde.
- **`ThemeService` gebruikt `localStorage` + `prefers-color-scheme` als fallback**, geen server-side/SSR-overweging nodig (geen SSR geconfigureerd).

## Afronding

Verplaats naar `completed/` zodra alle vier domeinen werken, met elkaar samenhangen (niet los te openen schermen) en de app-brede afwerkingsstap is doorlopen. Dit is bewust een groter, minder incrementeel plan dan de eerdere exec-plans — controleer daarom extra goed bij het reviewen, in plaats van te vertrouwen op de kleinere reviewbare stapjes van eerdere plans.
