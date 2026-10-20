import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CardcaseStore } from '../core/store';
import { BinderPage } from '../shared/binder-page';

/** Read-only shared binder viewer with a 3D page-flip leaf. */
@Component({
  selector: 'cc-viewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BinderPage],
  template: `
    @let s = v();
    <div class="fixed inset-0 z-[45] bg-bg flex flex-col overflow-auto">
      <div class="flex flex-wrap items-center gap-[10px] py-3 px-[clamp(14px,3vw,32px)] bg-red border-b-2 border-line text-cream">
        <button
          (click)="s.closeViewer()"
          title="Terug"
          class="w-10 h-10 rounded-[10px] bg-paper text-coal border-2 border-coal shadow-[0_3px_0_#1A1C22] flex items-center justify-center"
        >
          <span class="icon text-[20px]">arrow_back</span>
        </button>
        <div class="font-pixel font-bold text-[18px] leading-none tracking-[.04em]">CARDCASE</div>
        <span class="font-pixel text-[11px] leading-none bg-coal text-lcd px-[7px] py-[5px] rounded-[5px]">ALLEEN-LEZEN</span>
        <div class="ml-auto flex items-center bg-paper border-2 border-coal rounded-[10px] overflow-hidden text-coal max-w-full">
          <span class="px-[10px] py-2 font-mono font-medium text-[12px] leading-none whitespace-nowrap overflow-hidden text-ellipsis">{{ s.v.link }}</span>
          <button (click)="s.copyLink()" class="flex items-center gap-[5px] border-0 border-l-2 border-coal bg-lcd text-lcd-ink px-[10px] py-2 font-black text-[13px]">
            <span class="icon text-[17px]">link</span>Kopieer
          </button>
        </div>
      </div>
      <div class="flex-1 flex flex-col items-center gap-[18px] pt-6 pb-8 px-[clamp(10px,3vw,32px)]">
        <div class="text-center flex flex-col gap-[6px]">
          <div class="kicker">GEDEELDE BINDER · {{ s.v.fmt }}</div>
          <h1 class="m-0 text-[clamp(26px,4vw,36px)] font-black">{{ s.v.name }}</h1>
        </div>
        <div
          class="w-full max-w-[1000px] border-2 border-line rounded-[14px] p-[clamp(6px,1.3vw,14px)] shadow-[6px_6px_0_var(--line)]"
          [style.background]="s.v.cover"
        >
          <div class="relative flex items-stretch [perspective:2400px]">
            <div class="flex-[1_1_0] min-w-0 flex flex-col"><cc-binder-page [page]="s.vLeft" /></div>
            <div class="flex-[1_1_0] min-w-0 flex flex-col"><cc-binder-page [page]="s.vRight" /></div>
            @if (s.flipping) {
              <div
                class="absolute top-0 bottom-0 w-1/2 z-[3] [transform-style:preserve-3d] transition-transform duration-[750ms] ease-[cubic-bezier(.35,.1,.25,1)]"
                [style.left]="s.leafLeft"
                [style.transform-origin]="s.leafOrigin"
                [style.transform]="'rotateY(' + s.leafAngle + 'deg)'"
              >
                <div class="absolute inset-0 [backface-visibility:hidden] flex shadow-[0_0_24px_rgba(0,0,0,.25)]">
                  <div class="flex-1 min-w-0 flex flex-col"><cc-binder-page [page]="s.leafFront" /></div>
                </div>
                <div class="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] flex shadow-[0_0_24px_rgba(0,0,0,.25)]">
                  <div class="flex-1 min-w-0 flex flex-col"><cc-binder-page [page]="s.leafBack" /></div>
                </div>
              </div>
            }
            <div
              class="absolute left-1/2 top-[6%] bottom-[6%] -translate-x-1/2 w-[clamp(10px,1.8vw,22px)] flex flex-col justify-evenly z-[5] pointer-events-none"
            >
              @for (r of rings; track r) {
                <div class="h-6 rounded-[7px] border-2 border-coal bg-[linear-gradient(90deg,#8E949C,#EEF1F3_50%,#8E949C)]"></div>
              }
            </div>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <button
            (click)="s.vPrev()"
            class="press-sm w-[52px] h-[52px] rounded-[14px] bg-surface border-2 border-line shadow-[0_4px_0_var(--line)] flex items-center justify-center"
            [style.opacity]="s.vPrevOp"
          >
            <span class="icon text-[28px]">chevron_left</span>
          </button>
          <div class="bg-device border-2 border-line rounded-[9px] p-1">
            <div class="lcd rounded-[5px] px-[14px] py-[9px] text-[15px] leading-none whitespace-nowrap">{{ s.v.label }}</div>
          </div>
          <button
            (click)="s.vNext()"
            class="press-sm w-[52px] h-[52px] rounded-[14px] bg-red text-cream border-2 border-line shadow-[0_4px_0_var(--line)] flex items-center justify-center"
            [style.opacity]="s.vNextOp"
          >
            <span class="icon text-[28px]">chevron_right</span>
          </button>
        </div>
        <div class="text-[12.5px] font-bold text-muted">Gebruik ← → om te bladeren</div>
      </div>
    </div>
  `,
})
export class ViewerOverlay {
  protected readonly v = inject(CardcaseStore).vals;
  protected readonly rings = [0, 1, 2];
}
