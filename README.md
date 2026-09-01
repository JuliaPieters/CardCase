# Cardcase

Multi-TCG portfolio tracker. Zoek kaarten op over meerdere TCG's, houd je collectie(s) bij, zie de live waarde van je portfolio en analyseer of een ruil eerlijk is.

Geen kaartherkenning via camera — kaarten worden handmatig gezocht en toegevoegd.

## Starten

1. Lees `CLAUDE.md` voor de architectuurregels en werkwijze.
2. Lees `DESIGN.md` (visuele richting), `QUALITY.md` (test- en mergeconventies), `SECURITY.md` (Firestore-toegangsregels) en `ENVIRONMENTS.md` (emulator vs. het ene productie-project).
3. Voer `docs/exec-plans/active/00-foundation.md` uit om de repo op te zetten.
4. Zie `docs/product-specs/index.md` voor de volledige scope van v1.

## Stack

Angular · Firebase (auth, Firestore) · Pokémon TCG API · Scryfall (Magic)

## npm-pakketnaam

Voorstel: `cardcase` (npm-naam was op moment van schrijven vrij — check dit opnieuw voordat je publiceert). Zie `package.json.suggestie` voor een startpunt.
