# Cardcase

Multi-TCG portfolio tracker. Zoek kaarten op over meerdere TCG's, houd je collectie(s) bij, zie de live waarde van je portfolio en analyseer of een ruil eerlijk is.

Geen kaartherkenning via camera — kaarten worden handmatig gezocht en toegevoegd.

## Starten

1. Lees `CLAUDE.md` voor de architectuurregels en werkwijze.
2. Lees `docs/governance/DESIGN.md` (visuele richting), `docs/governance/QUALITY.md` (test- en mergeconventies), `docs/governance/SECURITY.md` (Firestore-toegangsregels) en `docs/governance/ENVIRONMENTS.md` (emulator vs. het ene productie-project).
3. Voer `docs/exec-plans/active/00-foundation.md` uit om de repo op te zetten.
4. Zie `docs/product-specs/index.md` voor de volledige scope van v1.

## Stack

Angular · Firebase (auth, Firestore, functions) · Vercel (hosting) · Pokémon TCG API · Scryfall (Magic)

## Ontwikkelen

- `npm start` — dev-server
- `npm test` — unit tests (vitest)
- `npm run lint` — ESLint, inclusief de architecturale laag-/provider-grenzen (zie `eslint.config.js`)
- `npm run build` — productiebuild
- `npm run emulators` — Firebase-emulator (Auth + Firestore) lokaal starten
- `npm run test:rules` — Firestore security rules testen tegen de emulator (vereist Java)

### Vereist lokaal

- Node 24, npm.
- Java (voor de Firestore-emulator): `brew install openjdk`. Is keg-only — voeg toe aan `PATH`:
  `export PATH="/usr/local/opt/openjdk/bin:$PATH"`.
- `firebase-tools` (`npm install` zet dit al klaar als devDependency). Bij een npm-cache-fout met
  root-owned bestanden: `sudo chown -R $(id -u):$(id -g) ~/.npm`.

## npm-pakketnaam

Voorstel: `cardcase` (npm-naam was op moment van schrijven vrij — check dit opnieuw voordat je publiceert).
