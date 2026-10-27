import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CatalogService } from '../core/catalog';
import { gameInfo } from '../games/registry';

/**
 * The header logo: the active department's mascot and the word mark "CardCase" (public/logos/<game>/header.svg is the
 * reference). "Card" is always signal red, "Case" takes the department's colour; both have the hard offset shadow.
 */
@Component({
  selector: 'cc-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'cc-logo', '[class.cc-logo-hero]': 'hero()', '[style.--logo-size.px]': 'size()' },
  template: `
    @if (hero()) {
      <span class="cc-logo-hero-row">
        <span class="cc-logo-word" aria-label="CardCase"><span class="cc-logo-card">Card</span><span class="cc-logo-case">Case</span></span>
        <img [src]="mascot()" alt="" class="cc-logo-mascot" />
      </span>
      <span class="cc-logo-tagline">Scan <i></i> Verzamel <i></i> Binder</span>
    } @else {
      <img [src]="mascot()" alt="" class="cc-logo-mascot" /><span class="cc-logo-word" aria-label="CardCase"><span class="cc-logo-card">Card</span><span class="cc-logo-case">Case</span></span>
    }
  `,
})
export class Logo {
  /** Font size of the word mark; the mascot and shadow scale with it. */
  readonly size = input(30);
  /** The big logo (login, splash): word mark with the mascot after it and the tagline, without the background. */
  readonly hero = input(false);
  private readonly game = inject(CatalogService).game;
  protected readonly mascot = computed(() => gameInfo(this.game()).logos.mascot);
}
