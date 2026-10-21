import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { BinderPage } from './binder-page';

/**
 * One binder page at a time (phones), on the cover with the rings along the left edge. While turning, `leaf` is the
 * page that swings around the rings over `page`: at 0° it lies flat, at -180° it's folded away to the left.
 */
@Component({
  selector: 'cc-page-turn',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BinderPage],
  template: `
    <div class="flex items-stretch border-2 border-line rounded-[14px] p-[6px] pl-0 shadow-[5px_5px_0_var(--line)]" [style.background]="cover()">
      <div class="flex-none w-[16px] flex flex-col justify-evenly items-center">
        @for (r of rings; track r) {
          <div class="w-[22px] h-[10px] -mr-[10px] z-[6] rounded-full border-2 border-coal bg-[linear-gradient(180deg,#8E949C,#EEF1F3_50%,#8E949C)]"></div>
        }
      </div>
      <div class="relative flex-1 min-w-0 flex flex-col [perspective:1800px]">
        <cc-binder-page [page]="page()" />
        @if (leaf()) {
          <div
            class="absolute inset-0 z-[4] flex flex-col origin-left [transform-style:preserve-3d] transition-transform duration-[600ms] ease-[cubic-bezier(.35,.1,.25,1)]"
            [style.transform]="'rotateY(' + angle() + 'deg)'"
          >
            <div class="flex-1 flex flex-col [backface-visibility:hidden] shadow-[0_0_24px_rgba(0,0,0,.28)]"><cc-binder-page [page]="leaf()" /></div>
          </div>
        }
      </div>
    </div>
  `,
})
export class PageTurn {
  readonly page = input<any>(null);
  readonly leaf = input<any>(null);
  readonly angle = input(0);
  readonly cover = input('');
  protected readonly rings = [0, 1, 2, 3, 4];
}
