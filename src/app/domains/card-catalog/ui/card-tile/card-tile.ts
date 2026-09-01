import { Component, computed, input } from '@angular/core';
import { Card } from '../../types/card';

// Kaart-vormige tegel (DESIGN.md "Layout"): echte TCG-kaartverhouding, geen generieke
// rounded card.
//
// Randkleur: gebaseerd op zeldzaamheid (het enige veld dat nu echt varieert — `variant`
// staat altijd op 'normal', zie docs/exec-plans/tech-debt-tracker.md), maar bewust met
// bestaande tokens i.p.v. een nieuwe kleurschaal: DESIGN.md reserveert --accent-primary voor
// precies twee dingen (holo-sweep + primaire CTA — "niet strooien over badges"). Rarity-
// strings verschillen wild tussen Pokémon ("Rare Holo VMAX") en Magic ("mythic") — een grove
// twee-staps-indeling (gewoon/bijzonder) i.p.v. een volledige, per-TCG-tabel. Een rijkere
// zeldzaamheidskleurschaal is een bewuste vervolgstap die eerst nieuwe tokens in DESIGN.md
// nodig heeft, zie docs/exec-plans/active/02-full-v1-site.md "Beslissingen tijdens
// uitvoering".
@Component({
  imports: [],
  selector: 'app-card-tile',
  styleUrl: './card-tile.scss',
  templateUrl: './card-tile.html',
})
export class CardTile {
  readonly card = input.required<Card>();

  protected readonly isNotableRarity = computed(() => {
    const rarity = this.card().rarity.toLowerCase();
    return !rarity.startsWith('common') && !rarity.startsWith('uncommon');
  });
}
