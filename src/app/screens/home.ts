import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CardcaseStore } from '../core/store';
import { Card } from '../shared/card';
import { Led, Leds, Trend } from '../shared/bits';

@Component({
  selector: 'cc-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, Led, Leds, Trend],
  template: `
    @let s = v();
    <div class="flex flex-col gap-12 pb-6">
      <div class="flex flex-col gap-[6px]">
        <div class="font-pixel text-[13px] leading-none text-muted tracking-[.1em]">DASHBOARD</div>
        <h1 class="m-0 text-[clamp(26px,4vw,38px)] font-black leading-[1.1] text-pretty">Welkom terug. Je collectie groeit.</h1>
      </div>
      <div class="flex flex-wrap gap-6">
        <div
          class="flex-[2_1_340px] bg-device border-2 border-line rounded-[14px_14px_44px_14px] pt-3 px-[14px] pb-4 shadow-[4px_4px_0_var(--line)] flex flex-col gap-[10px]"
        >
          <div class="flex items-center gap-2 font-pixel text-[11px] leading-none text-[var(--device-muted)] tracking-[.12em]">
            <cc-led color="#FF5A4E" [size]="9" />POWER
          </div>
          <div class="relative lcd rounded-md shadow-[inset_0_0_0_3px_var(--display-edge)] p-[18px] flex flex-wrap gap-x-8 gap-y-5 overflow-hidden">
            <div class="flex flex-col gap-1 min-w-[150px]">
              <div class="text-[13px] leading-none tracking-[.08em]">KAARTEN TOTAAL</div>
              <div class="font-bold text-[68px] leading-none">{{ s.totalCards }}</div>
              <div class="flex flex-wrap gap-x-[14px] gap-y-[6px] text-[14px] leading-[1.2] mt-1">
                <span>{{ s.uniqueCards }} UNIEK</span><span>{{ s.setsDone }} SET VOLTOOID</span>
              </div>
            </div>
            <div class="flex-[1_1_200px] flex flex-col gap-[9px] justify-center">
              @for (l of s.langStats; track l.key) {
                <div class="flex items-center gap-[10px] text-[14px] leading-none">
                  <span class="w-6">{{ l.code }}</span>
                  <div class="flex-1 h-[14px] bg-lcd-edge border-2 border-lcd-mid rounded-[2px] overflow-hidden">
                    <div
                      class="h-full bg-[repeating-linear-gradient(90deg,var(--display-text)_0_6px,var(--display-muted)_6px_8px)]"
                      [style.width.%]="l.pct"
                    ></div>
                  </div>
                  <span class="w-7 text-right">{{ l.n }}</span>
                </div>
              }
            </div>
            @if (s.lcdPixels) {
              <div class="lcd-pixels"></div>
            }
          </div>
          <div class="flex items-center gap-[10px] px-1">
            <div class="w-[34px] h-[10px] rounded-md bg-[#4A4E58] -rotate-20"></div>
            <div class="w-[34px] h-[10px] rounded-md bg-[#4A4E58] -rotate-20"></div>
            <div class="ml-auto w-16 h-4 bg-[repeating-linear-gradient(110deg,transparent_0_6px,var(--coal)_6px_9px)]"></div>
          </div>
        </div>
        <div
          class="flex-[1_1_250px] bg-red border-2 border-line rounded-[14px] shadow-[4px_4px_0_var(--line)] p-5 flex flex-col gap-4 text-cream justify-between"
        >
          <cc-leds />
          <div class="text-[16px] font-bold leading-[1.4] text-pretty">
            Richt je camera op een kaart. Cardcase herkent {{ s.scanLangs }} edities.
          </div>
          <button
            (click)="s.goScan()"
            class="press flex items-center justify-center gap-[10px] bg-lcd text-lcd-ink border-2 border-line rounded-xl shadow-[0_5px_0_var(--line)] py-[15px] px-[18px] font-pixel font-semibold text-[20px] leading-none"
          >
            <span class="icon text-[24px]">photo_camera</span>Scan kaart
          </button>
        </div>
      </div>

      <button
        (click)="s.goValue()"
        class="press-xy flex flex-wrap items-center gap-x-6 gap-y-4 text-left panel py-4 px-[18px]"
      >
        <div class="flex flex-col gap-[6px] min-w-[190px]">
          <div class="font-pixel text-[12px] leading-none text-muted tracking-[.1em]">COLLECTIEWAARDE</div>
          <div class="font-pixel font-bold text-[40px] leading-none">{{ s.vTotal }}</div>
          <div class="flex items-center gap-2">
            <span
              class="flex items-center gap-[6px] border-2 border-line rounded-md px-[7px] py-1 font-pixel text-[13px] leading-none"
              [style.background]="s.vc.bg"
              [style.color]="s.vc.fg"
              ><cc-trend [up]="s.vc.up" />{{ s.vc.chg }}</span
            ><span class="text-[12.5px] font-extrabold text-muted">t.o.v. vorige week</span>
          </div>
        </div>
        <div class="flex-[1_1_220px] min-w-0 bg-lcd border-2 border-line rounded-lg p-[10px]">
          <div class="flex items-end gap-[2px] h-16">
            @for (b of s.monthBars; track b.key) {
              <div
                class="flex-1 bg-[repeating-linear-gradient(0deg,transparent_0_4px,color-mix(in_srgb,var(--display)_35%,_transparent)_4px_5px)]"
                [style.height.%]="b.h"
                [style.background-color]="b.bg"
              ></div>
            }
          </div>
        </div>
        <span class="flex items-center gap-[2px] text-red font-black text-[14px]"
          >Bekijk waarde<span class="icon text-[20px]">chevron_right</span></span
        >
      </button>

      <div class="flex flex-col gap-4">
        <div class="flex items-baseline justify-between gap-3">
          <h2 class="m-0 font-pixel font-semibold text-[20px] leading-[1.2]">Recent toegevoegd</h2>
          <button (click)="s.goColl()" class="tap bg-transparent border-0 py-1 px-0 text-red font-extrabold text-[14px]">Hele collectie →</button>
        </div>
        <div class="flex gap-[14px] overflow-x-auto pt-[2px] pr-1 pb-3 pl-[2px]">
          @for (r of s.recent; track r.key) {
            <button (click)="r.open()" class="lift flex-none w-[112px] flex flex-col gap-[7px] bg-transparent border-0 p-0 text-left">
              <div class="aspect-[63/88] w-full rounded-lg shadow-[3px_3px_0_var(--line)]"><cc-card [card]="r.cv" /></div>
              <div class="text-[12px] font-extrabold text-muted">{{ r.when }}</div>
            </button>
          }
        </div>
      </div>

      <div class="flex flex-col gap-4">
        <h2 class="m-0 font-pixel font-semibold text-[20px] leading-[1.2]">Voortgang per set</h2>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-5">
          @for (x of s.setProgress; track x.key) {
            <button (click)="x.open()" class="press-xy flex flex-col gap-3 text-left panel p-[14px]">
              <div class="flex items-center gap-[10px]">
                <span class="font-pixel font-semibold text-[13px] leading-none bg-ink text-bg px-[7px] py-[5px] rounded-[5px]">{{ x.code }}</span>
                <span class="font-black text-[16px]">{{ x.name }}</span>
                <span class="ml-auto font-pixel font-semibold text-[16px] leading-none">{{ x.label }}</span>
              </div>
              @if (x.notDone) {
                <div class="h-[18px] bg-lcd border-2 border-line rounded p-[2px]">
                  <div
                    class="cc-progress-fill h-full bg-[repeating-linear-gradient(90deg,var(--display-muted)_0_7px,transparent_7px_9px)]"
                    [style.width.%]="x.pct"
                  ></div>
                </div>
              }
              @if (x.done) {
                <div
                  class="h-[18px] border-2 border-line rounded flex items-center justify-center font-pixel font-semibold text-[11px] leading-none text-coal tracking-[.12em] bg-[linear-gradient(110deg,#ffb3d9,#ffe9a3_22%,#b8f5d0_44%,#a9dcff_66%,#d6b8ff_88%,#ffb3d9)]"
                >
                  VOLTOOID
                </div>
              }
              <div class="flex justify-between text-[12px] text-muted font-bold">
                <span>{{ x.langs }}</span><span>{{ x.pct }}%</span>
              </div>
              <div class="flex items-center gap-[6px] text-[12.5px] font-extrabold border-t-2 border-dashed border-soft pt-2">
                <span class="icon text-[16px]">shopping_cart</span>{{ x.needLabel }}
              </div>
            </button>
          }
        </div>
      </div>
    </div>
  `,
})
export class HomeScreen {
  protected readonly v = inject(CardcaseStore).vals;
}
