import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CardcaseStore } from '../core/store';
import { Card } from '../shared/card';

/** Overview of all binders as covers with progress and value. */
@Component({
  selector: 'cc-binders',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card],
  template: `
    @let s = v();
    <div class="flex flex-col gap-[22px]">
      <div class="flex items-center gap-3 flex-wrap">
        <h1 class="m-0 font-pixel font-semibold text-[30px] leading-[1.1] mr-auto">Binders</h1>
        <button
          (click)="s.newBinder()"
          class="press-sm flex items-center gap-[6px] bg-red text-cream border-2 border-line rounded-xl shadow-[0_4px_0_var(--line)] px-4 py-[10px] font-black text-[15px]"
        >
          <span class="icon text-[20px]">add</span>Nieuwe binder
        </button>
      </div>
      <div class="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-x-5 gap-y-[26px]">
        @for (b of s.binderCards; track b.key) {
          <div class="flex flex-col gap-3">
            <button
              (click)="b.edit()"
              class="relative aspect-[5/6] border-2 border-line rounded-[6px_16px_16px_6px] shadow-[5px_5px_0_var(--line)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[3px_3px_0_var(--line)] overflow-hidden p-0"
              [style.background]="b.cover"
            >
              <div class="absolute left-0 top-0 bottom-0 w-[22px] bg-[rgba(0,0,0,.28)] border-r-2 border-line"></div>
              <div class="absolute left-[34px] right-[14px] top-[14px] flex justify-between items-center">
                <span class="flex gap-[6px] items-center">
                  <span class="font-pixel font-semibold text-[12px] leading-none bg-coal text-[#F7F3E8] px-[7px] py-[5px] rounded-[5px]">{{ b.fmt }}</span>
                  @if (b.hasNewSug) {
                    <span
                      title="Nieuwe kaarten passen bij dit recept"
                      class="min-w-[22px] h-[22px] px-[5px] rounded-full bg-paper text-[#E3350D] border-2 border-coal flex items-center justify-center font-pixel font-semibold text-[12px] leading-none"
                      >{{ b.newCount }}</span
                    >
                  }
                </span>
                @if (b.complete) {
                  <span
                    class="font-pixel font-semibold text-[11px] leading-none text-coal px-[7px] py-[5px] rounded-[5px] border-2 border-coal bg-[linear-gradient(110deg,#ffb3d9,#ffe9a3_22%,#b8f5d0_44%,#a9dcff_66%,#d6b8ff_88%,#ffb3d9)]"
                    >ALLES IN BEZIT</span
                  >
                }
              </div>
              <div class="absolute left-[34px] right-[14px] top-[44px] bottom-[76px]">
                @for (p of b.preview; track p.key) {
                  <div
                    class="absolute top-[6%] w-[42%] aspect-[63/88] rounded-[7px] shadow-[2px_2px_0_rgba(0,0,0,.5)]"
                    [style.left.%]="p.left"
                    [style.transform]="'rotate(' + p.rot + 'deg)'"
                  >
                    <cc-card [card]="p.cv" />
                  </div>
                }
              </div>
              <div class="absolute left-[34px] right-[14px] bottom-[14px] bg-paper border-2 border-coal rounded-lg px-[10px] py-[9px] text-left text-coal">
                <div class="font-pixel text-[10px] leading-[1.2] text-[#6A6558] tracking-[.06em] whitespace-nowrap overflow-hidden text-ellipsis">{{ b.kindLabel }}</div>
                <div class="font-black text-[15px] whitespace-nowrap overflow-hidden text-ellipsis">{{ b.name }}</div>
                @if (b.note) {
                  <div class="text-[11.5px] font-bold text-[#6A6558] whitespace-nowrap overflow-hidden text-ellipsis">{{ b.note }}</div>
                }
                <div class="text-[11.5px] font-bold text-[#6A6558]">{{ b.stats }}</div>
              </div>
            </button>
            <div class="flex items-center gap-[10px]">
              <div class="flex-1 h-4 bg-lcd border-2 border-line rounded p-[2px]">
                <div class="h-full bg-[repeating-linear-gradient(90deg,#306230_0_6px,transparent_6px_8px)]" [style.width.%]="b.pct"></div>
              </div>
              <span class="font-pixel font-semibold text-[14px] leading-none w-[38px] text-right">{{ b.pct }}%</span>
            </div>
            <div class="flex justify-between items-baseline gap-2">
              <span class="font-pixel font-semibold text-[16px] leading-none whitespace-nowrap">{{ b.value }}</span>
              <span class="text-[12px] font-extrabold text-muted whitespace-nowrap overflow-hidden text-ellipsis">{{ b.missLabel }}</span>
            </div>
            <div class="flex flex-col">
              <div class="flex gap-[6px]">
                <button (click)="b.edit()" class="flex-1 min-w-0 bg-surface border-2 border-line rounded-[9px] shadow-hard-sm px-2 py-[10px] font-extrabold text-[13px]">Bewerk</button>
                <button (click)="b.view()" class="flex-1 min-w-0 bg-surface border-2 border-line rounded-[9px] shadow-hard-sm px-2 py-[10px] font-extrabold text-[13px]">Bekijk</button>
                <button
                  (click)="b.share()"
                  [title]="b.shared ? 'Gedeeld · wijzig wie meekijkt' : 'Delen met vrienden of via link'"
                  class="flex-none border-2 border-line rounded-[9px] shadow-hard-sm w-[42px] flex items-center justify-center"
                  [class]="b.shared ? 'bg-lcd text-lcd-ink' : 'bg-surface'"
                >
                  <span class="icon text-[19px]">share</span>
                </button>
                <button
                  (click)="b.del()"
                  title="Binder verwijderen"
                  class="flex-none bg-surface border-2 border-line rounded-[9px] shadow-hard-sm w-[42px] flex items-center justify-center text-red"
                >
                  <span class="icon text-[19px]">delete</span>
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    </div>

    @if (s.delAsk; as d) {
      <div (click)="s.cancelDelete()" class="fixed inset-0 z-[60] bg-[rgba(0,0,0,.45)] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div
          (click)="$event.stopPropagation()"
          role="dialog"
          aria-modal="true"
          class="w-full max-w-[440px] bg-bg text-ink border-2 border-line rounded-t-[22px] sm:rounded-[18px] px-5 pt-5 pb-[calc(20px+env(safe-area-inset-bottom))] flex flex-col gap-3 shadow-[5px_5px_0_var(--line)]"
        >
          <div class="kicker">BINDER VERWIJDEREN</div>
          <div class="font-black text-[20px] leading-[1.2]">{{ d.name }} verwijderen?</div>
          <div class="text-[14px] font-bold text-muted text-pretty">
            De binder met zijn indeling en decoratie verdwijnt. De {{ d.cards }} kaarten erin blijven gewoon in je collectie.
          </div>
          <div class="flex gap-[10px] justify-end mt-1">
            <button (click)="s.cancelDelete()" class="btn">Annuleer</button>
            <button
              (click)="s.confirmDelete()"
              class="press-sm flex items-center gap-[6px] bg-red text-cream border-2 border-line rounded-[10px] shadow-[0_4px_0_var(--line)] px-4 py-2 font-black text-[14px]"
            >
              <span class="icon text-[19px]">delete</span>Verwijder
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class BindersScreen {
  protected readonly v = inject(CardcaseStore).vals;
}
