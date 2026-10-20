import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CardcaseStore } from '../core/store';
import { Led } from '../shared/bits';

/** Full-screen binder page scanner styled as a dot-matrix camera. */
@Component({
  selector: 'cc-page-scan',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Led],
  template: `
    @let s = v();
    <div class="fixed inset-0 z-50 bg-[#0B0C0F] flex justify-center">
      <div class="relative w-full max-w-[560px] h-full flex flex-col gap-3 overflow-hidden bg-[#14161B] pb-4">
        <div class="flex items-center gap-3 px-[14px] pt-3 text-[#F7F3E8]">
          <button
            (click)="s.closePageScan()"
            title="Sluiten"
            class="w-11 h-11 flex-none rounded-xl bg-[#2A2D35] text-[#F7F3E8] border-2 border-black shadow-[0_3px_0_#000] flex items-center justify-center"
          >
            <span class="icon text-[22px]">close</span>
          </button>
          <div class="flex flex-col gap-[3px] min-w-0">
            <div class="font-pixel font-semibold text-[18px] leading-none tracking-[.06em]">PAGINASCAN</div>
            <div class="text-[12px] font-bold text-[#A8A497] whitespace-nowrap overflow-hidden text-ellipsis">{{ s.psv.sub }}</div>
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
        </div>
        <div class="flex items-center gap-2 mx-[14px] flex-wrap">
          <div class="flex-[1_1_200px] bg-device border-2 border-black rounded-[9px] p-1">
            <div class="lcd rounded-[5px] px-3 py-2 text-[14px] leading-none">CONTROLE: {{ s.psv.title }}</div>
          </div>
          <div class="flex gap-[6px]">
            @for (c of s.psChips; track c.key) {
              <button
                (click)="c.select()"
                class="border-2 border-black rounded-lg px-[10px] py-2 font-pixel text-[13px] leading-none shadow-[0_3px_0_#000]"
                [style.background]="c.bg"
                [style.color]="c.fg"
              >
                {{ c.label }}
              </button>
            }
          </div>
        </div>
        <div
          class="flex-1 min-h-0 mx-[14px] bg-device border-2 border-black rounded-[16px_16px_48px_16px] pt-3 px-[14px] pb-4 flex flex-col gap-[10px] shadow-[0_4px_0_#000]"
        >
          <div class="flex items-center gap-2 font-pixel text-[11px] leading-none text-[#A8A497] tracking-[.12em]">
            <cc-led color="#FF5A4E" [size]="9" />POWER<span class="ml-auto">DOT-MATRIX CAM</span>
          </div>
          <div class="relative flex-1 min-h-0 bg-lcd rounded-md shadow-[inset_0_0_0_3px_#8BAC0F] overflow-hidden">
            <div class="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(48,98,48,.16)_0_10px,transparent_10px_20px)]"></div>
            <div class="absolute top-[10px] left-3 font-mono font-medium text-[11px] leading-none text-lcd-mid">camerabeeld · opengeslagen binderpagina</div>
            <div class="absolute inset-[10%_9%_8%] flex items-center justify-center">
              <div class="relative h-full max-w-full" [style.aspect-ratio]="s.psv.aspect">
                <div
                  class="absolute inset-0 grid gap-[6px]"
                  [style.grid-template-columns]="'repeat(' + s.psv.cols + ',1fr)'"
                  [style.grid-template-rows]="'repeat(' + s.psv.rows + ',1fr)'"
                >
                  @for (c of s.psCells; track c.key) {
                    <div class="rounded px-1 py-[3px] font-pixel text-[11px] leading-none text-lcd-ink" [style.border]="s.psv.cellBorder" [style.background]="s.psv.cellBg">
                      {{ c.n }}
                    </div>
                  }
                </div>
                <div class="absolute -left-[10px] -top-[10px] w-[26px] h-[26px] border-t-4 border-l-4 border-lcd-ink"></div>
                <div class="absolute -right-[10px] -top-[10px] w-[26px] h-[26px] border-t-4 border-r-4 border-lcd-ink"></div>
                <div class="absolute -left-[10px] -bottom-[10px] w-[26px] h-[26px] border-b-4 border-l-4 border-lcd-ink"></div>
                <div class="absolute -right-[10px] -bottom-[10px] w-[26px] h-[26px] border-b-4 border-r-4 border-lcd-ink"></div>
                @if (s.psAlign) {
                  <div class="absolute -left-[4%] -right-[4%] h-[3px] top-[4%] bg-lcd-ink opacity-70 animate-scan-fast"></div>
                }
              </div>
            </div>
            @if (s.lcdPixels) {
              <div class="lcd-pixels"></div>
            }
          </div>
          <div class="lcd self-center flex items-center gap-2 rounded-[5px] px-3 py-[7px] text-[14px] leading-none whitespace-nowrap">
            <cc-led [color]="s.psDotColor" [blink]="s.psAlign" />{{ s.psv.status }}
          </div>
        </div>
        <div class="flex items-center justify-center gap-[26px]">
          <div class="flex flex-col items-center gap-[5px]">
            <button
              (click)="s.closePageScan()"
              class="w-[50px] h-[50px] rounded-full bg-[#2A2D35] text-[#F7F3E8] border-2 border-black shadow-[0_4px_0_#000] font-pixel font-semibold text-[15px] leading-none"
            >
              B
            </button>
            <span class="font-pixel text-[11px] leading-none text-[#A8A497]">TERUG</span>
          </div>
          <div class="flex flex-col items-center gap-[5px]">
            <button
              (click)="s.psCapture()"
              class="w-[74px] h-[74px] rounded-full bg-[#E3350D] text-cream border-[3px] border-black shadow-[0_5px_0_#000] font-pixel font-semibold text-[20px] leading-none active:translate-y-1 active:shadow-[0_1px_0_#000]"
              [style.opacity]="s.psv.capOp"
            >
              A
            </button>
            <span class="font-pixel text-[11px] leading-none text-[#A8A497]">CONTROLEER</span>
          </div>
        </div>
        <div class="text-center text-[13px] font-bold text-[#A8A497] px-5">Leg de binder plat en laat de pagina het raster vullen.</div>
      </div>
    </div>
  `,
})
export class PageScanOverlay {
  protected readonly v = inject(CardcaseStore).vals;
}
