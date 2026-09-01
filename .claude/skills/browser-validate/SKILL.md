---
name: browser-validate
description: "Gebruik deze skill na een UI-wijziging om het gedrag zelf te valideren via de browser-tooling, in plaats van te vragen of een mens even wil klikken."
---

# Browser validate

Na een UI-wijziging valideer je het gedrag zelf via de browser-MCP-tooling, in plaats van een mens te vragen om even te klikken. Dit is de agent-observability-praktijk uit `CLAUDE.md`: hoe meer de agent zelf kan controleren, hoe minder de schaarse aandacht van de gebruiker de bottleneck wordt.

## Werkwijze

1. **App lokaal starten.** Start de dev-server (Angular) en, indien nodig voor de wijziging, de Firebase-emulator (zie `ENVIRONMENTS.md` — nooit tegen het echte productieproject).

2. **Navigeer naar het gewijzigde scherm.** Ga direct naar de view/component die is aangepast.

3. **Snapshot vóór de actie.** Leg vast hoe het scherm eruitziet/gedraagt vóórdat je de te testen actie uitvoert (bv. via een screenshot of een DOM/tekst-snapshot).

4. **Voer de actie uit** die het gewijzigde gedrag triggert (klik, formulier invullen, navigatie, etc.).

5. **Snapshot ná de actie en vergelijk.** Controleer:
   - juiste data (klopt wat er getoond wordt met wat er verwacht wordt),
   - juiste designtoken (kleuren/typografie/spacing komen uit `DESIGN.md`-tokens, geen losse waarden — zie ook `architecture-check`),
   - geen consolefouten (lees de browserconsole na de actie).

6. **Bij een thema-wijziging:** valideer expliciet in zowel licht als donker thema (`DESIGN.md` vereist beide vanaf v1). Herhaal stap 3–5 voor beide thema's.

7. **Rapporteer het resultaat in de PR-beschrijving.** Beschrijf kort wat gevalideerd is en hoe (welk scherm, welke actie, licht/donker indien van toepassing), niet alleen "werkt".

## Wanneer escaleren

Bij twijfel over *correct* gedrag — niet alleen "geen crash", maar of het gedrag daadwerkelijk is wat bedoeld was — escaleer je naar een mens in plaats van zelf te concluderen dat het goed is. Zelfvalidatie vervangt menselijke review van intentie niet, alleen het handmatige klikwerk.
