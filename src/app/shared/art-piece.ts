import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** One pocket's part of a piece of art, as made by `artPiece()` in core/data. Fills its (relative) container. */
@Component({
  selector: 'cc-art-piece',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none' },
  template: `
    @if (p(); as a) {
      <div
        class="absolute bg-cover bg-no-repeat"
        [style.left]="a.l"
        [style.top]="a.t"
        [style.width]="a.w"
        [style.height]="a.h"
        [style.background-image]="a.fill"
        [style.background-position]="a.pos"
        [style.transform]="'scale(' + a.zoom + ')'"
        [style.transform-origin]="a.pos"
      ></div>
    }
  `,
})
export class ArtPiece {
  readonly p = input<any>(null);
}
