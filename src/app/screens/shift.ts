import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CardcaseStore } from '../core/store';
import { Card } from '../shared/card';
import { BinderPage } from '../shared/binder-page';

/** Preview of inserting a missing card into a full binder (shift vs. use buffer). */
@Component({
  selector: 'cc-shift',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, BinderPage],
  template: `
    @let s = v();
    <div class="flex flex-col gap-[18px]">
      <div class="flex items-center gap-3">
        <button (click)="s.goEditor()" title="Terug" class="btn-icon"><span class="icon text-[20px]">arrow_back</span></button>
        <div class="flex flex-col gap-[3px] min-w-0">
          <div class="kicker">VERSCHUIF-PREVIEW</div>
          <h1 class="m-0 text-[clamp(22px,3.4vw,28px)] font-black leading-[1.15] text-pretty">Kaart invoegen in een volle binder</h1>
        </div>
      </div>
      @if (s.noShift) {
        <div class="panel p-[18px] font-bold text-muted">Alle kaarten van de sets in deze binder hebben al een plek. Er valt niets te verschuiven.</div>
      }
      @if (s.hasShift) {
        <div class="flex flex-col gap-[18px]">
          <div class="panel p-[14px] flex items-center gap-[14px]">
            <div class="w-[62px] flex-none aspect-[63/88] rounded-lg shadow-hard-md"><cc-card [card]="s.sh.cv" /></div>
            <div class="flex flex-col gap-[5px] min-w-0">
              <div class="font-pixel text-[12px] leading-none text-muted tracking-[.08em]">NIEUWE KAART</div>
              <div class="text-[20px] font-black">
                {{ s.sh.name }} <span class="font-pixel font-normal text-[15px] leading-none text-muted">{{ s.sh.num }}</span>
              </div>
              <div class="text-[14px] font-bold text-muted text-pretty">{{ s.sh.where }}</div>
            </div>
          </div>
          <div class="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
            @for (o of s.shOpts; track o.key) {
              <div
                (click)="o.preview()"
                class="bg-surface border-2 rounded-xl p-4 flex flex-col gap-[10px] cursor-pointer"
                [style.border-color]="o.bd"
                [style.box-shadow]="o.sh"
              >
                <div class="flex items-center gap-[10px]">
                  <span class="w-[22px] h-[22px] flex-none rounded-full border-2 border-line bg-bg flex items-center justify-center">
                    <span class="w-[11px] h-[11px] rounded-full" [style.background]="o.dot"></span>
                  </span>
                  <span class="text-[16px] font-black">{{ o.title }}</span>
                </div>
                <div class="flex items-baseline gap-2 flex-wrap">
                  <span class="font-pixel font-semibold text-[32px] leading-none">{{ o.stat }}</span>
                  <span class="text-[14px] font-extrabold text-muted">{{ o.sub }}</span>
                </div>
                <div class="text-[13px] font-bold text-muted text-pretty">{{ o.note }}</div>
                <button
                  (click)="o.confirm($event)"
                  class="press-sm mt-auto flex items-center justify-center gap-[6px] border-2 border-line rounded-[10px] shadow-[0_4px_0_var(--line)] p-[11px] font-black text-[15px]"
                  [style.background]="o.btnBg"
                  [style.color]="o.btnFg"
                >
                  <span class="icon text-[19px]">{{ o.icon }}</span>{{ o.title }}
                </button>
              </div>
            }
          </div>
          <div class="flex flex-wrap items-center gap-x-[18px] gap-y-[10px]">
            <div class="bg-device border-2 border-line rounded-[9px] p-1">
              <div class="lcd rounded-[5px] px-3 py-[9px] text-[14px] leading-[1.3]">{{ s.sh.summary }}</div>
            </div>
            <div class="flex flex-wrap gap-x-[14px] gap-y-2 text-[12.5px] font-extrabold text-muted">
              <span class="flex items-center gap-[6px]">
                <span class="w-5 h-5 rounded-[5px] bg-amber border-2 border-line text-coal flex items-center justify-center"><span class="icon text-[14px]">arrow_forward</span></span>één slot op
              </span>
              <span class="flex items-center gap-[6px]">
                <span class="w-5 h-5 rounded-[5px] bg-amber border-2 border-line text-coal flex items-center justify-center"><span class="icon text-[14px]">subdirectory_arrow_right</span></span>naar volgende rij
              </span>
              <span class="flex items-center gap-[6px]">
                <span class="w-5 h-5 rounded-[5px] bg-amber border-2 border-line text-coal flex items-center justify-center"><span class="icon text-[14px]">redo</span></span>naar volgende pagina
              </span>
              <span class="flex items-center gap-[6px]">
                <span class="font-pixel text-[10px] leading-none bg-lcd text-lcd-ink border-2 border-lcd-ink px-[5px] py-[3px] rounded">NIEUW</span>nieuwe kaart
              </span>
            </div>
          </div>
          <div class="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-4">
            @for (pg of s.shPages; track $index) {
              <div class="flex flex-col"><cc-binder-page [page]="pg" /></div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class ShiftScreen {
  protected readonly v = inject(CardcaseStore).vals;
}
