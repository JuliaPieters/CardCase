import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CardcaseStore } from '../core/store';
import { Card } from '../shared/card';

/** Step-by-step move list after inserting a card into a binder. */
@Component({
  selector: 'cc-moves',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card],
  template: `
    @let s = v();
    <div class="flex flex-col gap-[18px] max-w-[760px]">
      <div class="flex items-center gap-3">
        <button (click)="s.goEditor()" title="Terug" class="btn-icon"><span class="icon text-[20px]">arrow_back</span></button>
        <div class="flex flex-col gap-[3px] min-w-0">
          <div class="kicker">VERPLAATSLIJST</div>
          <h1 class="m-0 text-[clamp(22px,3.4vw,28px)] font-black leading-[1.15] text-pretty">{{ s.jobTitle }}</h1>
        </div>
      </div>
      @if (s.noJob) {
        <div class="panel p-[18px] font-bold text-muted">Geen openstaande verplaatsingen.</div>
      }
      @if (s.hasJob) {
        <div class="flex flex-col gap-[18px]">
          <div class="bg-device border-2 border-line rounded-xl shadow-hard px-[14px] py-3 flex flex-col gap-2 text-lcd">
            <div class="flex justify-between font-pixel text-[13px] leading-none tracking-[.08em]"><span>VOORTGANG</span><span>{{ s.jobDone }}</span></div>
            <div class="flex items-center gap-2">
              <span class="font-pixel font-semibold text-[13px] leading-none bg-amber text-coal px-[5px] py-[3px] rounded-[3px]">HP</span>
              <div class="flex-1 flex gap-[3px] bg-coal border-2 border-black rounded p-[3px]">
                @for (g of s.hpSegs; track g.key) {
                  <div class="flex-1 h-[14px] rounded-[1px]" [style.background]="g.bg"></div>
                }
              </div>
            </div>
          </div>
          <div class="text-[14px] font-bold text-muted text-pretty">Begin achteraan en werk naar voren. Zo schuift elke kaart naar een vak dat al vrij is.</div>
          @for (g of s.moveGroups; track g.key) {
            <div class="panel px-4 pt-[6px] pb-2">
              <div class="flex justify-between items-baseline pt-[10px] pb-2">
                <h2 class="m-0 font-pixel font-semibold text-[18px] leading-none">{{ g.title }}</h2>
                <span class="text-[12.5px] font-extrabold text-muted">{{ g.count }}</span>
              </div>
              @for (st of g.steps; track st.key) {
                <button
                  (click)="st.toggle()"
                  class="w-full flex items-center gap-3 py-[10px] bg-transparent border-0 border-t-2 border-dashed border-soft text-left"
                  [style.opacity]="st.op"
                >
                  <span class="w-7 h-7 flex-none border-2 border-line rounded-md flex items-center justify-center text-lcd-ink" [style.background]="st.checkBg">
                    <span class="icon text-[20px]">{{ st.checkIcon }}</span>
                  </span>
                  <span class="font-pixel text-[12px] leading-none text-muted w-[22px] flex-none">{{ st.no }}</span>
                  <div class="w-8 flex-none aspect-[63/88]"><cc-card [card]="st.cv" /></div>
                  <div class="flex flex-col gap-[3px] min-w-0">
                    <span class="font-black text-[14.5px]" [style.text-decoration]="st.deco">{{ st.text }}</span>
                    <span class="text-[12px] font-bold text-muted">{{ st.name }}</span>
                  </div>
                </button>
              }
            </div>
          }
          <button
            (click)="s.scanAdjusted()"
            class="press flex items-center justify-center gap-[10px] bg-lcd text-lcd-ink border-2 border-line rounded-xl shadow-[0_5px_0_var(--line)] p-[15px] font-pixel font-semibold text-[18px] leading-[1.2]"
          >
            <span class="icon text-[22px]">document_scanner</span>Scan aangepaste pagina's ter controle
          </button>
          <div class="text-[13px] font-bold text-muted text-center">{{ s.jobPagesLabel }}</div>
        </div>
      }
    </div>
  `,
})
export class MovesScreen {
  protected readonly v = inject(CardcaseStore).vals;
}
