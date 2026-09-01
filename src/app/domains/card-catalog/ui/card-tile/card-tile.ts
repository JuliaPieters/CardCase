import { Component, input } from '@angular/core';
import { Card } from '../../types/card';

// Kaart-vormige tegel (DESIGN.md "Layout"): echte TCG-kaartverhouding, geen generieke
// rounded card. Randkleur per variant is bewust neutraal zolang providers alleen 'normal'
// normaliseren (zie docs/exec-plans/tech-debt-tracker.md) — DESIGN.md reserveert
// --accent-primary voor precies twee dingen (holo-sweep + primaire CTA), dus die kleur hoort
// hier niet als algemene variant-badge.
@Component({
  imports: [],
  selector: 'app-card-tile',
  styleUrl: './card-tile.scss',
  templateUrl: './card-tile.html',
})
export class CardTile {
  readonly card = input.required<Card>();
}
