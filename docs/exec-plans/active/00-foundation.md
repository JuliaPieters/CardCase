# Exec-plan: Foundation

Status: Actief
Domein(en): geen (repo-brede setup)

## Doel

Een lege Angular/Firebase-repo met de architecturale grenzen uit `docs/governance/ARCHITECTURE.md` mechanisch afgedwongen, vóórdat er ook maar één domein gebouwd wordt.

## Stappen

- [x] Angular-project opzetten (standalone components, strict mode aan).
- [x] Eén Firebase-project aanmaken; environment-config voor `emulator` vs. `production` conform `docs/governance/ENVIRONMENTS.md` — geen los staging-project.
- [ ] Budget-alert instellen op het Firebase-project conform `docs/governance/ENVIRONMENTS.md`. **Nog te doen door Julia** (vereist inloggen in de Google Cloud Console/Billing — zie beslissing hieronder).
- [x] Firebase-project koppelen (auth + Firestore), credentials via environment-config, niet gecommit. Client-webconfig (`apiKey`/`appId`/...) staat nog als placeholder in `src/environments/environment.ts` — geen secret, maar nog niet ingevuld (zie beslissing hieronder).
- [x] Mapstructuur aanmaken: `src/app/domains/{card-catalog,collection,valuation,trade-analyzer}/{types,config,repo,service,ui}` en `src/app/providers/`.
- [x] Lint-regel: bestanden in `*/repo/**` mogen niets uit `*/service/**` importeren (bv. via `eslint-plugin-boundaries` of een custom rule). Uitgebreid naar de volledige voorwaartse laagvolgorde (types→config→repo→service→ui), niet alleen repo→service — zie `eslint.config.js`.
- [x] Lint-regel: alleen `src/app/providers/**` mag een externe HTTP-client direct aanroepen. Dekt zowel import-statements (`@angular/common/http`, `firebase/*`) als het `fetch`/`XMLHttpRequest`-globaal.
- [x] `CardProvider`-interface aanmaken in `src/app/providers/card-provider.ts` (zie `core-beliefs.md` voor het `Card`-model).
- [x] Eén dummy-implementatie (bv. `PokemonTcgProvider`) die één endpoint aanroept, puur om de laag-scheiding te bewijzen werkt. `search()` getest tegen een echte, opgeslagen fixture (`test/fixtures/pokemon-tcg-api/`) + een losse smoke test tegen de live API (`RUN_SMOKE_TESTS=1 npm test`).
- [x] Design-tokens uit `docs/governance/DESIGN.md` opzetten als CSS-variabelen (licht + donker thema), inclusief het self-hosten van Baloo 2 en Manrope (geen Google Fonts CDN-call runtime), nog zonder echte componenten.
- [x] Firestore security rules opzetten volgens `docs/governance/SECURITY.md`, getest tegen de Firebase-emulator, vóórdat een domein daadwerkelijk data wegschrijft. Draai met `npm run test:rules` (vereist Java, zie beslissing hieronder).
- [x] CI-check tegen gelekte secrets (bv. `gitleaks`) toevoegen. Lokaal geverifieerd (`gitleaks detect`, geen leaks) + als stap in `.github/workflows/ci.yml`.
- [x] Browser-tooling koppelen zodat Claude Code zelf UI-gedrag kan valideren. Al beschikbaar via de `claude-in-chrome`-MCP-server in deze sessie; workflow vastgelegd in `.claude/skills/browser-validate/`. Nog niets om te valideren zolang er geen UI-componenten bestaan.
- [x] CI: build + lint + unit tests op elke PR. `.github/workflows/ci.yml`: `npm ci` → lint → build → unit tests → Firestore-rules-tests (met Java) → gitleaks.

## Beslissingen tijdens uitvoering

- **Styling**: SCSS + CSS custom properties (niet Tailwind) — sluit direct aan op het tokensysteem van `docs/governance/DESIGN.md`, dat al puur CSS-variabelen is. Vastgelegd in `docs/governance/FRONTEND.md`.
- **Firebase-project**: `cardcase-549a7`, handmatig door Julia aangemaakt (niet via CLI — vereist interactieve Google-login). `.firebaserc` wijst hiernaar.
- **Budget-alert**: Julia wil geen enkele betaalde uitgave ("gratis, ik ga niet betalen"). Belangrijke nuance: Cloud Functions (nodig voor de periodieke prijs-/decklist-ververs-taken uit `docs/governance/SECURITY.md`) vereisen het Blaze-plan (pay-as-you-go) om zelfs maar in te schakelen, óók als het gebruik binnen de gratis quota blijft. Zolang het project op het gratis Spark-plan staat (geen Blaze/billing account), is er geen budget-alert mogelijk (die vereist een gekoppeld billing-account) — maar er kan dan ook helemaal niets afgerekend worden. Concreet advies voor als Julia later Cloud Functions nodig heeft: Blaze inschakelen mét een budget-alert op een laag bedrag (bv. €1) vóórdat de eerste Cloud Function gedeployed wordt, niet erna.
- **Git-hosting**: GitHub-repo (`JuliaPieters/CardCase`) door Julia zelf aangemaakt; agent heeft de eerste commit gepusht.
- **Card/PriceSnapshot-locatie**: in `src/app/domains/card-catalog/types/card.ts`, niet in `providers/`. Redenering: card-catalog's rol is expliciet "normaliseren over alle TCG's heen" (`docs/governance/ARCHITECTURE.md`), en `core-beliefs.md` noemt `Card` letterlijk "het expliciete gedeelde model tussen domeinen" — dat is precies de uitzondering die `docs/governance/ARCHITECTURE.md`'s "geen cross-domein import zonder expliciete interface"-regel toestaat. `providers/card-provider.ts` importeert dit type dus vanuit card-catalog, niet andersom.
- **Firebase-toegang**: rechtstreeks de `firebase`-npm-SDK (modulair, v9+) in `src/app/providers/firebase/`, geen AngularFire. AngularFire's DI-abstractie is grotendeels overlappend met de abstractie die de Providers-laag hier al biedt.
- **Firestore rules-veldnamen**: `ownerId` (portfolios, tradeAnalyses) en `portfolioId` (collectionEntries) zijn een aanname vooruitlopend op de echte schema's van `collection`/`trade-analyzer` — zie `docs/exec-plans/tech-debt-tracker.md`.
- **Lokale prerequisites die nog open staan op deze machine** (geen projectbeslissing, wel relevant voor volgende sessies): `firebase-tools` kon niet via de normale `npm install` geïnstalleerd worden door root-owned bestanden in `~/.npm` — opgelost met een tijdelijke alternatieve npm-cache (`npm install --cache /tmp/... `); permanente fix is `sudo chown -R 501:20 ~/.npm` (niet zelf uitgevoerd, vereist expliciete toestemming). De Firestore-emulator vereist Java — via `brew install openjdk` geïnstalleerd, keg-only (niet symlinked naar `/usr/local`); voeg `/usr/local/opt/openjdk/bin` toe aan `PATH` om `java`/`npm run test:rules` lokaal te draaien.
- **Firestore rules nog niet gedeployed**: het echte Firebase-project staat nog op de default `allow read, write: if false;`. De rules in `firestore.rules` zijn lokaal tegen de emulator getest maar bewust niet gedeployed door de agent (`firebase deploy --only firestore:rules` raakt het echte, enige productieproject — dat is een bewuste actie voor Julia, niet iets om automatisch te doen vanuit een foundation-exec-plan).

## Afronding

Verplaats naar `completed/` zodra de lint-regels daadwerkelijk een verkeerde import blokkeren (test dit expres met een fout-geïmporteerd bestand) en de eerste provider werkt end-to-end.

Beide mechanische criteria zijn gehaald (zie hierboven). Nog niet verplaatst omdat de budget-alert nog niet ingesteld is door Julia — dat is bewust een menselijke actie (Google Cloud Console/billing), niet iets wat de agent zelfstandig doet. Verplaats naar `completed/` zodra dat is gedaan.
