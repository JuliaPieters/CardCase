import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CardcaseStore } from '../core/store';
import { Card } from '../shared/card';
import { Led } from '../shared/bits';

/** Full-screen card scanner with the "top 3 matches" sheet. */
@Component({
  selector: 'cc-scan',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, Led],
  template: `
    @let s = v();
    <div class="fixed inset-0 z-50 bg-[#0B0C0F] flex justify-center">
      <div class="relative w-full max-w-[520px] h-full flex flex-col overflow-hidden bg-[#14161B]">
        <div class="flex items-center gap-3 px-[14px] py-3 text-[#F7F3E8]">
          <button
            (click)="s.closeScan()"
            title="Sluiten"
            class="w-11 h-11 rounded-xl bg-[#2A2D35] text-[#F7F3E8] border-2 border-black shadow-[0_3px_0_#000] flex items-center justify-center"
          >
            <span class="icon text-[22px]">close</span>
          </button>
          <div class="flex flex-col gap-[3px]">
            <div class="font-pixel font-semibold text-[18px] leading-none tracking-[.06em]">SCANNER</div>
            <div class="text-[12px] font-bold text-[#A8A497]">Herkent EN · DE · JA · ZH</div>
          </div>
          <div class="ml-auto grid grid-cols-2 gap-[2px] bg-black border-2 border-black rounded-[9px] overflow-hidden">
            <button (click)="s.goScan()" class="border-0 px-[10px] py-[9px] font-pixel text-[12px] leading-none" [style.background]="s.modeCardBg" [style.color]="s.modeCardFg">
              KAART
            </button>
            <button
              (click)="s.goPageScanFromScan()"
              class="border-0 px-[10px] py-[9px] font-pixel text-[12px] leading-none"
              [style.background]="s.modePageBg"
              [style.color]="s.modePageFg"
            >
              PAGINA
            </button>
          </div>
          <button title="Flitser" class="w-11 h-11 rounded-xl bg-[#2A2D35] text-[#F7F3E8] border-2 border-black shadow-[0_3px_0_#000] flex items-center justify-center">
            <span class="icon text-[22px]">flash_on</span>
          </button>
        </div>
        <div
          class="relative flex-1 mx-3 rounded-[18px] border-2 border-black overflow-hidden bg-[repeating-linear-gradient(45deg,#1E2128_0_12px,#1A1C22_12px_24px)]"
        >
          <div class="absolute top-3 left-[14px] font-mono font-medium text-[11px] leading-none text-[#6B6F78]">camerabeeld</div>
          <div class="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 w-[min(62%,280px)] aspect-[63/88]">
            @if (s.scanLocked) {
              <div class="absolute inset-[5%] border-2 border-[rgba(155,188,15,.7)] rounded-[10px] bg-[rgba(155,188,15,.14)]"></div>
            }
            <div class="absolute left-0 top-0 w-[24%] h-[18%] border-t-[5px] border-l-[5px] rounded-tl-[14px]" [style.border-color]="s.frameColor"></div>
            <div class="absolute right-0 top-0 w-[24%] h-[18%] border-t-[5px] border-r-[5px] rounded-tr-[14px]" [style.border-color]="s.frameColor"></div>
            <div class="absolute left-0 bottom-0 w-[24%] h-[18%] border-b-[5px] border-l-[5px] rounded-bl-[14px]" [style.border-color]="s.frameColor"></div>
            <div class="absolute right-0 bottom-0 w-[24%] h-[18%] border-b-[5px] border-r-[5px] rounded-br-[14px]" [style.border-color]="s.frameColor"></div>
            @if (s.scanSearching) {
              <div class="absolute left-[6%] right-[6%] h-[3px] top-[4%] bg-lcd shadow-[0_0_14px_3px_rgba(155,188,15,.75)] animate-scan"></div>
            }
          </div>
          <div class="absolute bottom-[18px] left-1/2 -translate-x-1/2 bg-device border-2 border-black rounded-[9px] p-1">
            <div class="lcd flex items-center gap-2 rounded-[5px] px-3 py-[7px] text-[14px] leading-none whitespace-nowrap">
              <cc-led [color]="s.statusDotColor" [blink]="s.statusDotBlink" />{{ s.statusText }}
            </div>
          </div>
        </div>
        <div class="px-5 pt-[14px] pb-5 text-center text-[13px] font-bold text-[#A8A497]">Leg de kaart plat in het kader en vermijd reflecties.</div>

        @if (s.scanSheet) {
          <div class="absolute inset-0 bg-[rgba(0,0,0,.45)] pointer-events-none"></div>
          <div
            class="absolute left-0 right-0 bottom-0 max-h-[84%] overflow-auto bg-bg text-ink border-t-2 border-line rounded-t-[22px] px-4 pt-[10px] pb-5 flex flex-col gap-4 animate-up [animation-duration:.35s] [animation-timing-function:cubic-bezier(.2,.9,.3,1)]"
          >
            <div class="w-11 h-[5px] rounded-[3px] bg-muted opacity-50 self-center"></div>
            <div class="flex items-end justify-between gap-[10px]">
              <div>
                <div class="font-pixel text-[12px] leading-none text-muted tracking-[.08em]">TOP 3 MATCHES</div>
                <div class="text-[20px] font-black mt-1">Welke kaart is het?</div>
              </div>
              <button (click)="s.rescan()" class="bg-surface border-2 border-line rounded-[9px] shadow-hard-sm px-[10px] py-[6px] font-extrabold text-[13px]">Opnieuw</button>
            </div>
            <div class="flex flex-col gap-[10px]">
              @for (m of s.matches; track m.key) {
                <button
                  (click)="m.select()"
                  class="flex items-center gap-3 p-[10px] bg-surface border-2 rounded-xl text-left"
                  [style.border-color]="m.bd"
                  [style.box-shadow]="m.sh"
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
                  <span class="w-6 h-6 flex-none rounded-full border-2 border-line bg-bg flex items-center justify-center">
                    <span class="w-3 h-3 rounded-full" [style.background]="m.dot"></span>
                  </span>
                </button>
              }
            </div>
            <div class="flex flex-col gap-2">
              <span class="text-[13px] font-extrabold text-muted">Taal</span>
              <div class="grid grid-cols-4 gap-[2px] bg-line border-2 border-line rounded-[10px] overflow-hidden">
                @for (l of s.langOpts; track l.key) {
                  <button
                    (click)="l.select()"
                    class="border-0 px-1 py-[10px] font-pixel font-semibold text-[15px] leading-none"
                    [style.background]="l.bg"
                    [style.color]="l.fg"
                    [style.opacity]="l.op"
                    [style.text-decoration]="l.deco"
                  >
                    {{ l.code }}
                  </button>
                }
              </div>
            </div>
            <div class="flex flex-col gap-2">
              <span class="text-[13px] font-extrabold text-muted">Conditie</span>
              <div class="flex flex-wrap gap-2">
                @for (c of s.condOpts; track c.key) {
                  <button
                    (click)="c.select()"
                    class="flex items-baseline gap-[6px] border-2 border-line rounded-full px-3 py-[6px]"
                    [style.background]="c.bg"
                    [style.color]="c.fg"
                  >
                    <span class="font-pixel font-semibold text-[14px] leading-none">{{ c.code }}</span><span class="text-[12px] font-bold">{{ c.label }}</span>
                  </button>
                }
              </div>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span class="text-[13px] font-extrabold text-muted">Aantal</span>
              <div class="flex items-center border-2 border-line rounded-[11px] overflow-hidden bg-surface">
                <button (click)="s.qtyDec()" class="w-[46px] h-11 border-0 bg-transparent font-black text-[20px]">−</button>
                <span class="w-9 text-center font-pixel font-semibold text-[20px] leading-none">{{ s.scanQty }}</span>
                <button (click)="s.qtyInc()" class="w-[46px] h-11 border-0 bg-transparent font-black text-[20px]">+</button>
              </div>
            </div>
            <button
              (click)="s.addScan()"
              class="press flex items-center justify-center gap-2 bg-red text-cream border-2 border-line rounded-xl shadow-[0_5px_0_var(--line)] p-[15px] font-black text-[17px]"
            >
              <span class="icon text-[22px]">add</span>Toevoegen
            </button>
          </div>
        }
      </div>
    </div>
  `,
})
export class ScanOverlay {
  protected readonly v = inject(CardcaseStore).vals;
}
