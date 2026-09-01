---
name: architecture-check
description: "Gebruik deze skill vóór het afronden van een PR die code toevoegt of wijzigt in src/app/domains/** of src/app/providers/**. Controleert of de laag- en provider-grenzen uit ARCHITECTURE.md worden gerespecteerd, plus hardcoded waarden en SOLID-schendingen, zolang de mechanische lint-regels daarvoor nog niet volledig staan."
---

# Architecture check

Handmatige controle van de laag- en providergrenzen uit `ARCHITECTURE.md`, te gebruiken vóórdat een PR met wijzigingen in `src/app/domains/**` of `src/app/providers/**` als klaar wordt gemarkeerd. Dit vervangt (nog) mechanische lint-regels — behandel elke afwijking als iets dat expliciet gemeld moet worden, niet stilzwijgend opgelost.

## Checklist

Loop deze punten na op elk gewijzigd of toegevoegd bestand:

- [ ] **Geen import van `service/` in `repo/`.** De repo-laag mag niets weten van de service-laag erboven (afhankelijkheden alleen voorwaarts: `Types → Config → Repo → Service → UI`).
- [ ] **Geen directe import van `repo/` of `providers/` in UI.** UI-componenten praten met de service-laag, nooit rechtstreeks met repo of providers.
- [ ] **Geen cross-domein import zonder expliciete interface.** `card-catalog`, `collection`, `valuation`, `trade-analyzer` mogen elkaars interne types/services niet direct importeren — alleen via een expliciet gedefinieerde interface.
- [ ] **Geen `fetch`/HTTP buiten `providers/`.** Elke externe netwerkcall (Pokémon TCG API, Scryfall, Firebase, etc.) hoort in de providers-laag. Domeinlogica roept nooit rechtstreeks een externe API aan.
- [ ] **Geen TCG-specifiek veld buiten het genormaliseerde `Card`/`DecklistEntry`-model.** Zodra data de provider-laag verlaat, is elk veld generiek. Zoek naar velden die duidelijk provider-specifiek zijn (bv. Scryfall- of Pokémon-TCG-API-naamgeving) die doorlekken naar service/UI.
- [ ] **Geen losse hex/px-waarden of magic numbers.** Kleuren, spacing en typografie komen uit de design tokens (`DESIGN.md`) of uit de Config-laag van het domein — niet hardcoded in componenten of services.
- [ ] **SOLID-check:**
  - Single responsibility: doet elke Service precies één ding? Groeit een service-bestand naar een god-object?
  - Dependency inversion: hangt domeinlogica af van de `CardProvider`/`DeckDataProvider`-interface, niet van een concrete providerimplementatie?

## Bij een afwijking

Los een afwijking niet stilzwijgend op door 'm zomaar te verplaatsen. In plaats daarvan:

1. Meld de afwijking expliciet in de PR-beschrijving (of het exec-plan als het een grotere herstructurering vergt).
2. Leg kort uit waarom de afwijking is ontstaan en wat de opties zijn om 'm op te lossen.
3. Als het een bewuste, tijdelijke shortcut is: noteer 'm in `docs/exec-plans/tech-debt-tracker.md`.
