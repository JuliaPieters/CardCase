import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CardcaseStore } from '../core/store';
import { Card } from '../shared/card';

/** Result of scanning a binder page: per-slot verdicts and issues to correct. */
@Component({
  selector: 'cc-page-result',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card],
  template: `
    @let s = v();
    <div class="flex flex-col gap-[18px]">
      <div class="flex items-center gap-3">
        <button (click)="s.goEditor()" title="Terug" class="btn-icon"><span class="icon text-[20px]">arrow_back</span></button>
        <div class="flex flex-col gap-[3px] min-w-0">
          <div class="kicker">PAGINASCAN · RESULTAAT</div>
          <h1 class="m-0 text-[clamp(22px,3.4vw,28px)] font-black leading-[1.15] text-pretty">{{ s.rs.title }}</h1>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-x-4 gap-y-[10px]">
        <div class="bg-device border-2 border-line rounded-[9px] p-1">
          <div class="lcd rounded-[5px] px-3 py-[9px] text-[14px] leading-[1.3]">{{ s.rs.summary }}</div>
        </div>
        <div class="flex flex-wrap gap-2">
          <span class="flex items-center gap-[5px] bg-lcd-mid text-[#F7F3E8] border-2 border-line rounded-full py-1 pl-[6px] pr-[10px] text-[12px] font-black">
            <span class="icon text-[15px]">check</span>Klopt
          </span>
          <span class="flex items-center gap-[5px] bg-amber text-coal border-2 border-line rounded-full py-1 pl-[6px] pr-[10px] text-[12px] font-black">
            <span class="icon text-[15px]">question_mark</span>Twijfel
          </span>
          <span class="flex items-center gap-[5px] bg-[#E3350D] text-cream border-2 border-line rounded-full py-1 pl-[6px] pr-[10px] text-[12px] font-black">
            <span class="icon text-[15px]">close</span>Fout of leeg
          </span>
        </div>
      </div>
      <div class="flex flex-wrap gap-5 items-start">
        <div class="flex-[2_1_420px] min-w-0 bg-page border-2 border-line rounded-xl shadow-hard p-[clamp(10px,1.8vw,18px)]">
          <div class="grid gap-[clamp(10px,1.6vw,18px)]" [style.grid-template-columns]="'repeat(' + s.rs.cols + ', minmax(0,1fr))'">
            @for (r of s.rsSlots; track r.key) {
              <button
                (click)="r.open()"
                class="relative p-0 border-0 bg-transparent flex flex-col rounded-lg outline-[3px] outline-solid outline-offset-[3px]"
                [style.outline-color]="r.ring"
              >
                <div class="relative w-full aspect-[63/88] bg-pocket rounded-t-lg">
                  @if (r.hasCard) {
                    <div class="absolute inset-0"><cc-card [card]="r.cv" /></div>
                  }
                  @if (r.isEmpty) {
                    <div class="absolute inset-[6%] border-2 border-dashed border-muted rounded-md opacity-55"></div>
                  }
                  <div
                    class="absolute -top-[9px] -right-[9px] w-7 h-7 rounded-full border-2 border-line flex items-center justify-center"
                    [style.background]="r.bg"
                    [style.color]="r.fg"
                  >
                    <span class="icon text-[18px] !font-bold">{{ r.icon }}</span>
                  </div>
                </div>
                <div
                  class="flex items-center justify-center gap-1 border-2 border-line rounded-b-lg -mt-[2px] px-[3px] py-[5px] text-[11.5px] font-black whitespace-nowrap overflow-hidden"
                  [style.background]="r.bg"
                  [style.color]="r.fg"
                >
                  <span class="icon text-[14px]">{{ r.icon }}</span>{{ r.text }}
                </div>
              </button>
            }
          </div>
        </div>
        <div class="flex-[1_1_260px] min-w-0 panel p-4 flex flex-col gap-3">
          <h2 class="m-0 font-pixel font-semibold text-[18px] leading-none">Aandachtspunten</h2>
          @for (i of s.rsIssues; track i.key) {
            <div class="flex items-center gap-[10px]">
              <span class="w-[26px] h-[26px] flex-none rounded-full border-2 border-line flex items-center justify-center" [style.background]="i.bg" [style.color]="i.fg">
                <span class="icon text-[16px]">{{ i.icon }}</span>
              </span>
              <span class="flex-1 min-w-0 font-extrabold text-[14px]">{{ i.text }}</span>
              <button (click)="i.open()" class="bg-bg border-2 border-line rounded-[9px] shadow-hard-sm px-[10px] py-[5px] font-extrabold text-[13px]">Corrigeer</button>
            </div>
          }
          @if (s.noIssues) {
            <div class="font-bold text-muted">Alles klopt met je binderplan.</div>
          }
          <div class="text-[12.5px] font-bold text-muted">Tik op een slot om de herkenning te corrigeren.</div>
          <button
            (click)="s.confirmAll()"
            class="press flex items-center justify-center gap-2 bg-red text-cream border-2 border-line rounded-xl shadow-[0_5px_0_var(--line)] p-[13px] font-black text-[15px]"
          >
            <span class="icon text-[20px]">done_all</span>{{ s.rs.confirmLabel }}
          </button>
          <button (click)="s.rescanPage()" class="btn justify-center"><span class="icon text-[19px]">document_scanner</span>Opnieuw scannen</button>
        </div>
      </div>
    </div>
  `,
})
export class PageResultScreen {
  protected readonly v = inject(CardcaseStore).vals;
}
