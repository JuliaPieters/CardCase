# Exec-plan: Volledige v1-site

Status: Actief
Domein(en): card-catalog, collection, valuation, trade-analyzer + app-brede afwerking

## Doel

Een complete, samenhangende, visueel afgewerkte v1 van Cardcase — niet losse geïsoleerde schermen per domein, maar één werkende site: kaarten zoeken → toevoegen aan een collectie → portfoliowaarde zien → een ruil analyseren. Dit vervangt het domein-voor-domein-tempo van eerdere exec-plans: alle vier kerndomeinen uit `docs/product-specs/index.md` worden nu in samenhang gebouwd.

Expliciet **buiten** dit plan (ongewijzigd t.o.v. eerdere afspraken): kaartherkenning via camera, marketplace, social features, extra TCG's naast Pokémon/Magic, en de "onderscheidende features" (`deck-insights`, `portability`) — dat blijven latere exec-plans.

## Stappen

### App-shell en navigatie
- [ ] Een echte app-shell bouwen: header met de Cardcase-naam/logo-achtige wordmark (Baloo 2), navigatie tussen Zoeken / Collectie / Trade Analyzer, thema-toggle (licht/donker).
- [ ] Layout-grid conform `DESIGN.md`: content niet los zwevend linksboven, consistente marges (`--space-lg`/`--space-xl`) rondom.

### Card-catalog afwerken (voortbouwend op wat er al staat)
- [ ] Zoekformulier en TCG-dropdown herstijlen met de tokens (`--surface-panel`, `--radius-md`, juiste font-size/spacing) in plaats van browser-defaults.
- [ ] Zoekresultaten tonen als kaart-tegels: echte 2.5:3.5-verhouding, randkleur per variant/zeldzaamheid (zie `DESIGN.md` "Layout").
- [ ] Kaartdetailweergave: alle bekende varianten + prijs per variant.
- [ ] Lege staat ("nog niet gezocht") en foutstaat (API niet bereikbaar) herschreven conform `DESIGN.md` "Lege staten & foutmeldingen" — sturend, niet kaal.

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

<in te vullen tijdens het bouwen>

## Afronding

Verplaats naar `completed/` zodra alle vier domeinen werken, met elkaar samenhangen (niet los te openen schermen) en de app-brede afwerkingsstap is doorlopen. Dit is bewust een groter, minder incrementeel plan dan de eerdere exec-plans — controleer daarom extra goed bij het reviewen, in plaats van te vertrouwen op de kleinere reviewbare stapjes van eerdere plans.
