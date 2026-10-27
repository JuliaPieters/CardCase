import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CardcaseStore } from '../core/store';
import { BinderPage } from '../shared/binder-page';
import { PageTurn } from '../shared/page-turn';

/** Read-only shared binder viewer with a 3D page-flip leaf. */
@Component({
  selector: 'cc-viewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BinderPage, PageTurn],
  template: `
    @let s = v();
    <div class="fixed inset-0 z-[45] bg-bg flex flex-col overflow-auto pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div class="flex flex-wrap items-center gap-[10px] py-3 px-[clamp(14px,3vw,32px)] bg-red border-b-2 border-line text-cream">
        <button
          (click)="s.closeViewer()"
          title="Terug"
          class="w-10 h-10 rounded-[10px] bg-paper text-coal border-2 border-coal shadow-[0_3px_0_var(--coal)] flex items-center justify-center"
        >
          <span class="icon text-[20px]">arrow_back</span>
        </button>
        <div class="font-pixel font-bold text-[18px] leading-none tracking-[.04em]">CARDCASE</div>
        <span class="font-pixel text-[11px] leading-none bg-coal text-lcd px-[7px] py-[5px] rounded-[5px]">ALLEEN-LEZEN</span>
        @if (s.v.link) {
          <div class="ml-auto flex items-center bg-paper border-2 border-coal rounded-[10px] overflow-hidden text-coal max-w-full">
            <span class="px-[10px] py-2 font-mono font-medium text-[12px] leading-none whitespace-nowrap overflow-hidden text-ellipsis">{{ s.v.link }}</span>
            <button (click)="s.copyLink()" class="flex items-center gap-[5px] border-0 border-l-2 border-coal bg-lcd text-lcd-ink px-[10px] py-2 font-black text-[13px]">
              <span class="icon text-[17px]">link</span>Kopieer
            </button>
          </div>
        } @else if (s.v.canEdit) {
          <button (click)="s.copyLink()" class="ml-auto flex items-center gap-[5px] bg-paper text-coal border-2 border-coal rounded-[10px] px-[10px] py-2 font-black text-[13px]">
            <span class="icon text-[17px]">share</span>Delen
          </button>
        }
      </div>
      <div class="flex-1 flex flex-col items-center gap-[18px] pt-6 pb-8 px-[clamp(10px,3vw,32px)]">
        <div class="text-center flex flex-col gap-[6px]">
          <div class="kicker">{{ s.v.by ? 'BINDER VAN ' + s.v.by.toUpperCase() : 'GEDEELDE BINDER' }} · {{ s.v.fmt }}</div>
          <h1 class="m-0 text-[clamp(26px,4vw,36px)] font-black">{{ s.v.name }}</h1>
          @if (s.v.note) {
            <p class="m-0 text-[15px] font-bold text-muted text-pretty max-w-[560px]">{{ s.v.note }}</p>
          }
        </div>
        @if (s.wide) {
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
        } @else {
          <!-- Phone: one page at a time, turned with the arrows. -->
          <div class="w-full max-w-[520px]">
            <cc-page-turn [page]="s.vOne.page" [leaf]="s.vOne.leaf" [angle]="s.vOne.angle" [cover]="s.v.cover" />
          </div>
        }
        <div class="flex items-center gap-3">
          <button
            (click)="s.wide ? s.vPrev() : s.vTurnPrev()"
            title="Vorige pagina"
            class="press-sm w-[52px] h-[52px] rounded-[14px] bg-surface border-2 border-line shadow-[0_4px_0_var(--line)] flex items-center justify-center"
            [style.opacity]="s.wide ? s.vPrevOp : s.vTurnPrevOp"
          >
            <span class="icon text-[28px]">chevron_left</span>
          </button>
          <div class="bg-device border-2 border-line rounded-[9px] p-1">
            <div class="lcd rounded-[5px] px-[14px] py-[9px] text-[15px] leading-none whitespace-nowrap">{{ s.wide ? s.v.label : s.vOne.label }}</div>
          </div>
          <button
            (click)="s.wide ? s.vNext() : s.vTurnNext()"
            title="Volgende pagina"
            class="press-sm w-[52px] h-[52px] rounded-[14px] bg-red text-cream border-2 border-line shadow-[0_4px_0_var(--line)] flex items-center justify-center"
            [style.opacity]="s.wide ? s.vNextOp : s.vTurnNextOp"
          >
            <span class="icon text-[28px]">chevron_right</span>
          </button>
        </div>
        @if (s.v.warns) {
          <div class="flex items-center gap-2 text-[13px] font-bold text-muted text-pretty max-w-[560px]">
            <span class="flex-none bg-amber text-coal border-[1.5px] border-line rounded-[4px] px-[5px] py-[3px] font-pixel text-[10px] leading-none">{{ s.v.warnLabel }}</span
            >Van die Pokémon bestaat deze versie niet, daar staat hun gewone kaart.
          </div>
        }
        @if (s.wide) {
          <div class="text-[12.5px] font-bold text-muted">Gebruik ← → om te bladeren</div>
        }
      </div>
    </div>
  `,
})
export class ViewerOverlay {
  protected readonly v = inject(CardcaseStore).vals;
  protected readonly rings = [0, 1, 2];
}
