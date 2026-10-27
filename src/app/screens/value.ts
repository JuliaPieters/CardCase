import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { CardcaseStore } from '../core/store';
import { Card } from '../shared/card';
import { Led, Trend } from '../shared/bits';

@Component({
  selector: 'cc-value',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, Led, Trend, NgTemplateOutlet],
  template: `
    @let s = v();
    <div class="flex flex-col gap-[26px]">
      <div class="flex items-center gap-3">
        <button (click)="s.back()" title="Terug" class="btn-icon"><span class="icon text-[20px]">arrow_back</span></button>
        <div class="flex flex-col gap-[3px]">
          <div class="kicker">COLLECTIEWAARDE</div>
          <h1 class="m-0 text-[clamp(22px,3.4vw,28px)] font-black leading-[1.15]">Wat je collectie waard is</h1>
        </div>
      </div>

      <div class="bg-device border-2 border-line rounded-[14px_14px_44px_14px] pt-3 px-[14px] pb-[18px] shadow-[4px_4px_0_var(--line)] flex flex-col gap-[10px]">
        <div class="flex items-center gap-2 font-pixel text-[11px] leading-none text-[var(--device-muted)] tracking-[.12em]">
          <cc-led color="#FF5A4E" [size]="9" />POWER<span class="ml-auto">WAARDE-SCHERM</span>
        </div>
        <div class="relative lcd rounded-md shadow-[inset_0_0_0_3px_var(--display-edge)] p-[18px] flex flex-col gap-[14px] overflow-hidden">
          <div class="flex flex-wrap items-end justify-between gap-[14px]">
            <div>
              <div class="text-[13px] leading-none tracking-[.08em]">TOTALE WAARDE</div>
              <div class="font-bold text-[clamp(44px,8vw,68px)] leading-none">{{ s.vTotal }}</div>
              <div class="text-[14px] leading-[1.2] mt-1">{{ s.vCount }}</div>
            </div>
            <div class="flex items-center gap-2 rounded-md py-2 px-[11px]" [style.background]="s.vcl.bg" [style.color]="s.vcl.fg">
              <cc-trend [up]="s.vcl.up" />
              <div class="flex flex-col gap-[3px]">
                <span class="font-semibold text-[18px] leading-none">{{ s.vcl.chg }}</span
                ><span class="text-[10px] leading-none">T.O.V. VORIGE WEEK</span>
              </div>
            </div>
          </div>
          <div class="flex gap-[6px]">
            @for (t of s.vTabs; track t.key) {
              <button
                (click)="t.select()"
                class="border-2 border-lcd-ink rounded-md py-[11px] px-3 font-pixel text-[13px] leading-none"
                [style.background]="t.bg"
                [style.color]="t.fg"
              >
                {{ t.label }}
              </button>
            }
          </div>
          <div class="flex items-end gap-[2px] h-[130px]">
            @for (b of s.vBars; track b.key) {
              <div
                class="flex-1 bg-[repeating-linear-gradient(0deg,transparent_0_4px,color-mix(in_srgb,var(--display)_35%,_transparent)_4px_5px)]"
                [style.height.%]="b.h"
                [style.background-color]="b.bg"
              ></div>
            }
          </div>
          <div class="flex justify-between gap-[10px] text-[11px] leading-none">
            <span>{{ s.vRange.start }}</span><span>{{ s.vRange.chg }}</span><span>VANDAAG</span>
          </div>
          @if (s.lcdPixels) {
            <div class="lcd-pixels"></div>
          }
        </div>
      </div>

      <div class="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5 items-start">
        <div class="panel pt-[6px] px-4 pb-[10px]">
          <h2 class="m-0 pt-3 pb-2 font-pixel font-semibold text-[18px] leading-none">Top 10 meest waardevol</h2>
          @for (t of s.top10; track t.key) {
            <button (click)="t.open()" class="w-full flex items-center gap-[10px] py-2 bg-transparent border-0 border-t-2 border-dashed border-soft text-left">
              <span class="font-pixel text-[13px] leading-none text-muted w-5 flex-none">{{ t.rank }}</span>
              <div class="w-8 flex-none aspect-[63/88]"><cc-card [card]="t.cv" /></div>
              <div class="flex-1 min-w-0 flex flex-col gap-[2px]">
                <span class="font-black text-[14px] whitespace-nowrap overflow-hidden text-ellipsis">{{ t.name }}</span
                ><span class="text-[12px] font-bold text-muted whitespace-nowrap overflow-hidden text-ellipsis">{{ t.meta }}</span>
              </div>
              <span class="font-pixel text-[12px] leading-none text-muted flex-none">{{ t.langs }}</span>
              <span class="font-pixel font-semibold text-[16px] leading-none w-[74px] text-right flex-none">{{ t.price }}</span>
            </button>
          }
        </div>
        <div class="flex flex-col gap-5">
          <div class="panel pt-[6px] px-4 pb-[10px]">
            <h2 class="m-0 pt-3 pb-2 font-pixel font-semibold text-[18px] leading-none">Grootste stijgers deze week</h2>
            @for (m of s.gainers; track m.key) {
              <ng-container *ngTemplateOutlet="mover; context: { $implicit: m }" />
            }
          </div>
          <div class="panel pt-[6px] px-4 pb-[10px]">
            <h2 class="m-0 pt-3 pb-2 font-pixel font-semibold text-[18px] leading-none">Grootste dalers deze week</h2>
            @for (m of s.losers; track m.key) {
              <ng-container *ngTemplateOutlet="mover; context: { $implicit: m }" />
            }
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-3">
        <h2 class="m-0 font-pixel font-semibold text-[20px] leading-[1.2]">Waarde verdeeld</h2>
        <div class="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5 items-start">
          <ng-container *ngTemplateOutlet="split; context: { title: 'PER SET', rows: s.bySet }" />
          <ng-container *ngTemplateOutlet="split; context: { title: s.byTypeTitle, rows: s.byType }" />
          <ng-container *ngTemplateOutlet="split; context: { title: 'PER TAAL', rows: s.byLang }" />
          <ng-container *ngTemplateOutlet="split; context: { title: 'PER BINDER', rows: s.byBinder }" />
        </div>
      </div>

      <div class="flex flex-col gap-1 border-t-2 border-dashed border-soft pt-[14px]">
        <div class="flex items-center gap-[6px] text-[12.5px] font-bold text-muted"><span class="icon text-[16px]">storefront</span>{{ s.priceSource }}</div>
        <div class="text-[12.5px] font-bold text-muted pl-[22px]">
          Waarde = trendprijs × aantal exemplaren. Cardmarket-prijzen gelden per kaart, niet per taal.
        </div>
      </div>
    </div>

    <ng-template #mover let-m>
      <button (click)="m.open()" class="w-full flex items-center gap-[10px] py-2 bg-transparent border-0 border-t-2 border-dashed border-soft text-left">
        <div class="w-[30px] flex-none aspect-[63/88]"><cc-card [card]="m.cv" /></div>
        <div class="flex-1 min-w-0 flex flex-col gap-[2px]">
          <span class="font-black text-[14px] whitespace-nowrap overflow-hidden text-ellipsis">{{ m.name }}</span
          ><span class="text-[12px] font-bold text-muted">{{ m.meta }} · {{ m.price }}</span>
        </div>
        <span
          class="flex items-center gap-[6px] border-2 border-line rounded-md py-1 px-[7px] font-pixel text-[13px] leading-none flex-none"
          [style.background]="m.bg"
          [style.color]="m.fg"
          ><cc-trend [up]="m.up" />{{ m.chg }}</span
        >
      </button>
    </ng-template>

    <ng-template #split let-title="title" let-rows="rows">
      <div class="panel py-[14px] px-4 flex flex-col gap-3">
        <h3 class="m-0 font-pixel font-semibold text-[15px] leading-none text-muted">{{ title }}</h3>
        @for (r of rows; track r.key) {
          <div class="flex flex-col gap-[5px]">
            <div class="flex justify-between gap-2 text-[13px] font-extrabold">
              <span class="overflow-hidden text-ellipsis whitespace-nowrap">{{ r.label }}</span
              ><span class="font-pixel font-normal flex-none">{{ r.value }}</span>
            </div>
            <div class="flex gap-[2px] bg-coal border-2 border-line rounded p-[3px]">
              @for (g of r.segs; track g.key) {
                <div class="flex-1 h-[10px] rounded-[1px]" [style.background]="g.bg"></div>
              }
            </div>
          </div>
        }
      </div>
    </ng-template>
  `,
})
export class ValueScreen {
  protected readonly v = inject(CardcaseStore).vals;
}
