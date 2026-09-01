# Exec-plan: Foundation

Status: Actief
Domein(en): geen (repo-brede setup)

## Doel

Een lege Angular/Firebase-repo met de architecturale grenzen uit `ARCHITECTURE.md` mechanisch afgedwongen, vóórdat er ook maar één domein gebouwd wordt.

## Stappen

- [ ] Angular-project opzetten (standalone components, strict mode aan).
- [ ] Eén Firebase-project aanmaken; environment-config voor `emulator` vs. `production` conform `ENVIRONMENTS.md` — geen los staging-project.
- [ ] Budget-alert instellen op het Firebase-project conform `ENVIRONMENTS.md`.
- [ ] Firebase-project koppelen (auth + Firestore), credentials via environment-config, niet gecommit.
- [ ] Mapstructuur aanmaken: `src/app/domains/{card-catalog,collection,valuation,trade-analyzer}/{types,config,repo,service,ui}` en `src/app/providers/`.
- [ ] Lint-regel: bestanden in `*/repo/**` mogen niets uit `*/service/**` importeren (bv. via `eslint-plugin-boundaries` of een custom rule).
- [ ] Lint-regel: alleen `src/app/providers/**` mag een externe HTTP-client direct aanroepen.
- [ ] `CardProvider`-interface aanmaken in `src/app/providers/card-provider.ts` (zie `core-beliefs.md` voor het `Card`-model).
- [ ] Eén dummy-implementatie (bv. `PokemonTcgProvider`) die één endpoint aanroept, puur om de laag-scheiding te bewijzen werkt.
- [ ] Design-tokens uit `DESIGN.md` opzetten als CSS-variabelen (licht + donker thema), inclusief het self-hosten van Baloo 2 en Manrope (geen Google Fonts CDN-call runtime), nog zonder echte componenten.
- [ ] Firestore security rules opzetten volgens `SECURITY.md`, getest tegen de Firebase-emulator, vóórdat een domein daadwerkelijk data wegschrijft.
- [ ] CI-check tegen gelekte secrets (bv. `gitleaks`) toevoegen.
- [ ] Browser-tooling koppelen zodat Claude Code zelf UI-gedrag kan valideren (bv. een Chrome DevTools/Playwright-MCP-server): agent kan dan zelf een pagina openen, een actie uitvoeren en het resultaat controleren, in plaats van dat jij continu handmatig moet testen. Zie toelichting in `CLAUDE.md` en de skill `.claude/skills/browser-validate/`.
- [ ] CI: build + lint + unit tests op elke PR.

## Beslissingen tijdens uitvoering

<in te vullen tijdens het bouwen>

## Afronding

Verplaats naar `completed/` zodra de lint-regels daadwerkelijk een verkeerde import blokkeren (test dit expres met een fout-geïmporteerd bestand) en de eerste provider werkt end-to-end.
