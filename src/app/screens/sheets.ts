import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CardcaseStore } from '../core/store';
import { Card } from '../shared/card';
import { DecoPage } from '../shared/deco-page';

/** Global bottom sheets and modals: scan fix, share image, version picker, new-card suggestions. */
@Component({
  selector: 'cc-sheets',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, DecoPage],
  template: `
    @let s = v();
    @if (s.hasFix) {
      <div (click)="s.closeFix()" class="fixed inset-0 z-[60] bg-[rgba(0,0,0,.45)] flex items-end justify-center">
        <div (click)="s.stop($event)" [class]="sheet + ' max-w-[560px] max-h-[calc(84vh/var(--z))] pb-[calc(20px+env(safe-area-inset-bottom))] gap-[14px]'">
          <div class="w-11 h-[5px] rounded-[3px] bg-muted opacity-50 self-center"></div>
          <div class="flex items-end justify-between gap-[10px]">
            <div>
              <div class="font-pixel text-[12px] leading-none text-muted tracking-[.08em]">{{ s.fixKicker }}</div>
              <div class="text-[20px] font-black mt-1">Welke kaart zit hier?</div>
            </div>
            <button (click)="s.closeFix()" class="bg-surface border-2 border-line rounded-[9px] shadow-hard-sm px-[10px] py-[6px] font-extrabold text-[13px]">Sluiten</button>
          </div>
          <div class="flex flex-col gap-[10px]">
            @for (m of s.fixMatches; track m.key) {
              <button
                (click)="m.select()"
                class="flex items-center gap-3 p-[10px] bg-surface border-2 border-line rounded-xl text-left hover:border-red hover:shadow-[3px_3px_0_var(--red)]"
              >
                <div class="w-[50px] flex-none aspect-[63/88]"><cc-card [card]="m.cv" /></div>
                <div class="flex-1 min-w-0 flex flex-col gap-[5px]">
                  <div class="text-[15px] font-black whitespace-nowrap overflow-hidden text-ellipsis">{{ m.name }}</div>
                  <div class="text-[12px] font-bold text-muted">{{ m.meta }}</div>
                  <div class="flex items-center gap-2">
                    <div class="flex-1 max-w-[150px] h-[10px] bg-lcd border-2 border-line rounded-[3px] overflow-hidden">
                      <div class="h-full bg-lcd-mid" [style.width.%]="m.conf"></div>
                    </div>
                    <span class="font-pixel font-semibold text-[13px] leading-none">{{ m.conf }}%</span>
                  </div>
                </div>
                <span class="icon text-[22px]">chevron_right</span>
              </button>
            }
          </div>
          <button (click)="s.fixEmpty()" class="btn justify-center p-3">
            <span class="icon text-[19px]">check_box_outline_blank</span>Dit slot is leeg
          </button>
        </div>
      </div>
    }

    @if (s.hasShare) {
      <div (click)="s.closeShare()" class="fixed inset-0 z-[70] bg-[rgba(0,0,0,.5)] flex items-center justify-center p-4">
        <div
          (click)="s.stop($event)"
          class="w-full max-w-[920px] max-h-[calc(92vh/var(--z))] overflow-auto bg-bg text-ink border-2 border-line rounded-2xl shadow-[6px_6px_0_var(--line)] p-[18px] flex flex-col gap-[14px]"
        >
          <div class="flex items-center justify-between gap-[10px]">
            <div>
              <div class="font-pixel text-[12px] leading-none text-muted tracking-[.08em]">DELEN</div>
              <div class="text-[20px] font-black mt-1">Decoratiepagina als afbeelding</div>
            </div>
            <button (click)="s.closeShare()" class="chip bg-surface text-ink">Sluiten</button>
          </div>
          <div class="flex items-stretch gap-[6px] border-2 border-line rounded-[14px] p-3" [style.background]="s.ed.cover">
            <div class="flex-[1_1_0] min-w-0 flex flex-col"><cc-deco-page [pg]="s.shareLeft" /></div>
            <div class="flex-[1_1_0] min-w-0 flex flex-col"><cc-deco-page [pg]="s.shareRight" /></div>
          </div>
          <div class="text-[13px] font-bold text-muted">Dubbele binderpagina · met klein Cardcase-watermerk rechtsboven</div>
          <div class="flex flex-wrap gap-[10px]">
            <button
              (click)="s.downloadPng()"
              class="press-sm flex items-center gap-2 bg-red text-cream border-2 border-line rounded-xl shadow-[0_4px_0_var(--line)] px-4 py-[11px] font-black text-[15px]"
            >
              <span class="icon text-[20px]">download</span>Download afbeelding (PNG)
            </button>
            <button (click)="s.copyLink()" class="btn"><span class="icon text-[19px]">link</span>Kopieer link</button>
          </div>
        </div>
      </div>
    }

    @if (s.hasVerSheet) {
      <div (click)="s.closeVer()" class="fixed inset-0 z-[60] bg-[rgba(0,0,0,.45)] flex items-end justify-center">
        <div (click)="s.stop($event)" [class]="sheet + ' max-w-[860px] max-h-[calc(86vh/var(--z))] pb-[calc(22px+env(safe-area-inset-bottom))] gap-[14px]'">
          <div class="w-11 h-[5px] rounded-[3px] bg-muted opacity-50 self-center"></div>
          <div class="flex items-end justify-between gap-[10px]">
            <div>
              <div class="font-pixel text-[12px] leading-none text-muted tracking-[.08em]">ANDERE VERSIE · {{ s.verHead.sub }}</div>
              <div class="text-[20px] font-black mt-1">{{ s.verHead.title }}</div>
            </div>
            <button (click)="s.closeVer()" class="chip bg-surface text-ink">Sluiten</button>
          </div>
          @if (s.verHead.hasWarn) {
            <div class="flex items-center gap-2 bg-amber text-coal border-2 border-line rounded-[9px] px-[10px] py-2 text-[13px] font-black">
              <span class="font-pixel font-bold text-[14px] leading-none">!</span>{{ s.verHead.warn }}
            </div>
          }
          <div class="flex gap-[14px] overflow-x-auto pt-1 pr-[6px] pb-[10px] pl-[2px]">
            @for (ver of s.verList; track ver.key) {
              <div class="flex-none w-[150px] flex flex-col gap-2 bg-surface border-2 rounded-xl p-[10px]" [style.border-color]="ver.bd" [style.box-shadow]="ver.sh">
                <div class="aspect-[63/88]"><cc-card [card]="ver.cv" /></div>
                <div class="text-[12.5px] font-black leading-[1.25]">{{ ver.set }}</div>
                <div class="text-[11.5px] font-extrabold text-muted">{{ ver.variant }}</div>
                <div class="flex justify-between items-baseline gap-[6px]">
                  <span class="font-pixel font-semibold text-[15px] leading-none">{{ ver.price }}</span>
                  <span class="font-pixel text-[11px] leading-none text-muted">{{ ver.langs }}</span>
                </div>
                <span
                  class="flex items-center gap-1 self-start border-2 border-line rounded-md pl-1 pr-[7px] py-[3px] text-[11.5px] font-black"
                  [style.background]="ver.ownBg"
                  [style.color]="ver.ownFg"
                >
                  <span class="icon text-[14px]">{{ ver.ownIcon }}</span>{{ ver.owned }}
                </span>
                <button (click)="ver.choose()" class="chip justify-center" [style.background]="ver.btnBg" [style.color]="ver.btnFg">{{ ver.btn }}</button>
              </div>
            }
          </div>
        </div>
      </div>
    }

    @if (s.hasNewSheet) {
      <div (click)="s.closeNewSheet()" class="fixed inset-0 z-[60] bg-[rgba(0,0,0,.45)] flex items-end justify-center">
        <div (click)="s.stop($event)" [class]="sheet + ' max-w-[600px] max-h-[calc(84vh/var(--z))] pb-[calc(22px+env(safe-area-inset-bottom))] gap-3'">
          <div class="w-11 h-[5px] rounded-[3px] bg-muted opacity-50 self-center"></div>
          <div class="flex items-end justify-between gap-[10px]">
            <div>
              <div class="font-pixel text-[12px] leading-none text-muted tracking-[.08em]">NIEUW UITGEKOMEN · 20 OKT 2026</div>
              <div class="text-[20px] font-black mt-1">{{ s.rcCard.newText }}</div>
            </div>
            <button (click)="s.closeNewSheet()" class="chip bg-surface text-ink">Sluiten</button>
          </div>
          @for (n of s.newSugList; track n.key) {
            <div class="flex items-center gap-3 p-[10px] bg-surface border-2 border-line rounded-xl">
              <div class="w-[52px] flex-none aspect-[63/88]"><cc-card [card]="n.cv" /></div>
              <div class="flex-1 min-w-0 flex flex-col gap-1">
                <span class="font-black text-[15px]">{{ n.name }}</span>
                <span class="text-[12px] font-bold text-muted">{{ n.meta }}</span>
                <span class="text-[12px] font-extrabold">{{ n.reason }}</span>
              </div>
              <div class="flex flex-col gap-[6px] flex-none">
                <button (click)="n.accept()" class="chip justify-center bg-red text-cream">{{ n.actionLabel }}</button>
                <button (click)="n.dismiss()" class="chip justify-center bg-bg text-ink">Negeer</button>
              </div>
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class Sheets {
  protected readonly v = inject(CardcaseStore).vals;
  /** Shared bottom-sheet body classes; per-sheet max sizes/gaps are appended. */
  protected readonly sheet =
    'w-full overflow-auto bg-bg text-ink border-2 border-b-0 border-line rounded-t-[22px] px-4 pt-[10px] flex flex-col animate-up [animation-duration:.3s] [animation-timing-function:cubic-bezier(.2,.9,.3,1)]';
}
