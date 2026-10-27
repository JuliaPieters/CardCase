# Cardcase · product

Cardcase is een app om een verzameling trading cards bij te houden, binders te plannen en te decoreren, en kaarten te scannen. Het draait als webapp en als PWA (installeerbaar, werkt offline), in het Nederlands.

Tot nu toe ging Cardcase alleen over **Pokémon**. Het wordt uitgebreid naar meerdere trading card games. Eén app, één account, één collectie, maar per spel een eigen **afdeling** met een eigen thema. Dit document beschrijft eerst wat er nu is en daarna waar het naartoe gaat.

---

## Wat er nu is (Pokémon)

| Onderdeel | Wat het doet |
| --- | --- |
| **Dashboard** | Totaal aantal kaarten, verdeling per taal, collectiewaarde met grafiek, recent toegevoegd, voortgang per set. |
| **Kaart scannen** | Camera leest naam en verzamelnummer (OCR, tesseract.js). Als het nummer onleesbaar is, kiest een plaatjesvergelijking (perceptual hash, `card-hashes.bin`) tussen prints met dezelfde naam. Ook een foto kiezen werkt. Talen: EN/DE, JA, ZH. |
| **Binderpagina scannen** | Een hele binderpagina fotograferen en vergelijken met het plan: ontbrekend, verwisseld of verkeerde print. |
| **Zoeken** | De hele catalogus (~60.000 kaarten: Engels, Duits, Japans, Chinees) op naam, set, zeldzaamheid en taal. |
| **Kaartdetail** | Grote foto, gegevens, Cardmarket-prijs met verloop, aantal in bezit per taal, andere versies. |
| **Collectie** | Alles wat je hebt, per set, met filters. Waarde-overzicht per week, maand of jaar. |
| **Binders** | Soorten: setbinder, themabinder, ruilbinder en vrije binder. Daarnaast recepten (slimme binders): Regio-dex, Master set, Eén Pokémon alle versies, Illustrator, Type, Leeg beginnen. Formaten van 4, 9, 12 of 16 pockets. |
| **Binder-editor** | Kaarten slepen of tikken, buffers, kaarten doorschuiven of verplaatsen, ongedaan maken. Ook decoreren: eigen afbeeldingen over meerdere pockets, achtergronden, stickers, templates. |
| **Bekijken** | Binder doorbladeren met een pagina-omslag. |
| **Printen** | Gedecoreerde pagina's op ware grootte printen, om uit te knippen voor een echte binder. |
| **Vrienden** | Gebruikersnaam, vriendschapsverzoeken en uitnodigingslinks. Een vriend ziet je collectie en de binders die je met vrienden deelt. |
| **Delen via link** | Een binder openbaar delen (`?b=<shareId>`), te bekijken zonder account. |
| **Account** | Firebase-login. De collectie wordt gesynchroniseerd via Firestore. Wie niet inlogt, gebruikt de app als gast en de gegevens blijven dan in de browser. |
| **Overig** | Donkere modus, een eigen URL per scherm (de terugknop werkt), offline via service worker, melding bij een nieuwe versie. |

**Prijzen** komen van Cardmarket via TCGdex: trend en gemiddelden over 1, 7 en 30 dagen. De waardegrafiek wordt daar nu uit *teruggerekend*. Er worden nog geen eigen momentopnames opgeslagen, dus verder dan 30 dagen terug is er geen echte geschiedenis.

---

## Waar het naartoe gaat: afdelingen per spel

### Het idee

Eén app, één account, één collectie. Per TCG is er een eigen afdeling met een eigen sfeer:

| Afdeling | Route | Sfeer |
| --- | --- | --- |
| Pokémon | `/pokemon` | De huidige retro handheld-stijl (Pokédex/Game Boy). |
| One Piece | `/one-piece` | Piraten: zeekaart, perkament, goud. |
| Magic: The Gathering | `/magic` | Tovenaars: paars, nachtblauw, zilver. |
| Disney Lorcana | `/lorcana` | Sprookjes: inktblauw, roomwit, goud. |

Een gebruiker wisselt nooit van site. Wisselen tussen afdelingen voelt als **wisselen van werkruimte in Slack**: dezelfde app, met een ander thema, een andere catalogus en andere binders.

### Gebruikersreis

1. **Eerste keer:** na het inloggen (of als gast) komt de vraag **"Wat verzamel jij?"**. Je kiest één of meer afdelingen en komt in de eerste.
2. **Daarna:** `/` brengt je naar de afdeling die je het laatst gebruikte.
3. **Wisselen:** de **afdelingswisselaar** in de header toont het mascotte-icoon van de huidige afdeling. Klikken opent een menu met je andere afdelingen (icoon, aantal kaarten, waarde) en **"Afdeling toevoegen"**.
4. **Overzicht:** **"Mijn Cardcase"** (`/overzicht`) staat boven alle afdelingen. Het toont de totale waarde over alle spellen en per afdeling een tegel met aantal kaarten en waarde.

Bestaande gebruikers hebben al een Pokémon-collectie. Zij slaan de onboarding over: Pokémon staat voor hen al aangevinkt.

### Wat per afdeling hetzelfde is

Deze features werken in elke afdeling hetzelfde, met dezelfde componenten:

- dashboard, scannen, collectie, binders (incl. editor, decoratie, printen, bekijken), zoeken, kaartdetail, waarde
- de algemene binder-recepten: **Master set**, **Illustrator**, **Leeg beginnen**
- vrienden en delen (vrienden staan boven de afdelingen; een gedeelde binder opent in het thema van zijn eigen afdeling)

### Wat per afdeling verschilt

Alles wat verschilt staat in het **configuratiebestand van de afdeling**. Componenten bevatten geen `if (spel === …)`.

| | Pokémon | One Piece | Magic | Lorcana |
| --- | --- | --- | --- | --- |
| Filters | type, regio, zeldzaamheid | kleur, leider, kaartsoort | kleurcombinatie, kaartsoort, zeldzaamheid | inkkleur, kaartsoort, zeldzaamheid |
| Eigen recepten | Regio-dex (plus de bestaande Eén Pokémon alle versies, Type) | Per leider, Per kleur | Per kleurcombinatie, Commander-deck | Per inkkleur, Per verhaal |
| Talen | EN, DE, JA, ZH | nog te bepalen | nog te bepalen | nog te bepalen |
| Kaartbron | TCGdex (+ officiële Aziatische databases) | nog te kiezen | nog te kiezen | nog te kiezen |
| Thema | zie [design-systeem.md](design-systeem.md) | | | |

Verder heeft elke afdeling een eigen mascotte, headerlogo en favicon. In het logo blijft **"Card"** altijd signaalrood. **"Case"** krijgt de accentkleur van de afdeling.

### Volgorde van bouwen

1. Datamodel (`game`-veld, kaart-ID's met prefix) en de `CardSource`-interface met de TCGdex-implementatie.
2. Routing per afdeling, `data-game`-thema's en de afdelingsconfiguratie, met alleen Pokémon actief.
3. Afdelingswisselaar, onboarding en "Mijn Cardcase".
4. Daarna de andere afdelingen, één voor één: eerst **Lorcana**, dan **Magic**, dan **One Piece**.

Alles wordt gebouwd op aparte branches. `main` blijft de versie die online staat.

Zie [implementatieplan.md](implementatieplan.md) voor de uitwerking en [voortgang.md](voortgang.md) voor de stand van zaken.

### Bewust (nog) niet

- Kaartbronnen en prijzen voor One Piece, Magic en Lorcana: de API's kiezen we later.
- Scannen buiten Pokémon: de herkenning (OCR van het verzamelnummer, plaatjesindex) is per spel anders en volgt per afdeling.
