import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CardcaseStore } from '../core/store';
import { Card } from '../shared/card';
import { Trend } from '../shared/bits';

@Component({
  selector: 'cc-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, Trend],
  template: `
    @let s = v();
    @let d = s.d;
    @let dv = s.dv;
    <div class="flex flex-col gap-5">
      <button (click)="s.back()" class="btn self-start py-[7px] pr-3 pl-2 text-[16px]">
        <span class="icon text-[20px]">arrow_back</span>Terug
      </button>
      <div class="flex flex-wrap gap-7 items-start">
        <div class="flex-[1_1_260px] max-w-[380px] flex flex-col gap-[14px] mx-auto">
          <div class="grid grid-cols-4 gap-[2px] bg-line border-2 border-line rounded-[10px] overflow-hidden">
            @for (t of s.dTabs; track t.key) {
              <button
                (click)="t.select()"
                class="border-0 pt-2 px-1 pb-[7px] flex flex-col items-center gap-[3px]"
                [style.background]="t.bg"
                [style.color]="t.fg"
              >
                <span class="font-pixel font-semibold text-[16px] leading-none" [style.text-decoration]="t.deco">{{ t.code }}</span
                ><span class="text-[10.5px] font-extrabold opacity-80">{{ t.sub }}</span>
              </button>
            }
          </div>
          <div class="relative aspect-[63/88] w-full rounded-xl shadow-[6px_6px_0_var(--line)]">
            <cc-card [card]="d.cv" glare="loop" />
            @if (d.unavailable) {
              <div
                class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-ink text-bg py-[10px] px-[14px] rounded-lg font-pixel text-[14px] leading-[1.3] text-center whitespace-nowrap"
              >
                NIET UITGEBRACHT<br />IN DEZE TAAL
              </div>
            }
            @if (d.notOwnedLang) {
              <div
                class="absolute left-1/2 bottom-[10%] -translate-x-1/2 bg-ink text-bg py-[7px] px-3 rounded-md font-pixel text-[13px] leading-none whitespace-nowrap"
              >
                NOG NIET IN BEZIT
              </div>
            }
          </div>
        </div>
        <div class="flex-[1.4_1_320px] min-w-0 flex flex-col gap-[18px]">
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-pixel font-semibold text-[13px] leading-none bg-ink text-bg px-[7px] py-[5px] rounded-[5px]">{{ d.set }} {{ d.numStr }}</span
              ><span class="font-extrabold text-muted text-[14px]">{{ d.setName }}</span>
            </div>
            <h1 class="m-0 font-sans text-[clamp(30px,5vw,44px)] font-black leading-[1.1]">{{ d.name }}</h1>
            <div class="flex flex-wrap gap-x-[14px] gap-y-[6px] text-[14px] text-muted font-bold">
              @for (o of d.others; track o.key) {
                <span><span class="font-pixel">{{ o.code }}</span> {{ o.name }}</span>
              }
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <span class="flex items-center gap-[7px] border-2 border-line rounded-full py-[5px] pr-3 pl-[6px] bg-surface font-extrabold text-[13px]"
              ><span class="w-4 h-4 rounded-full border-2 border-line" [style.background]="d.typeColor"></span>{{ d.typeLabel }}</span
            >
            <span class="border-2 border-line rounded-full py-[5px] px-3 bg-surface font-extrabold text-[13px]">{{ d.rarLabel }}</span>
            <span class="border-2 border-line rounded-full py-[5px] px-3 bg-surface font-extrabold text-[13px]">Uitgebracht in {{ d.availLabel }}</span>
            @if (d.released) {
              <span class="flex items-center gap-[6px] border-2 border-line rounded-full py-[5px] pr-3 pl-2 bg-surface font-extrabold text-[13px]"
                ><span class="icon text-[16px]">calendar_month</span>{{ d.released }}</span
              >
            }
          </div>

          @if (d.facts.length) {
            <div class="panel py-[14px] px-4 grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-x-4 gap-y-3">
              @for (f of d.facts; track f.label) {
                <div class="flex flex-col gap-1 min-w-0">
                  <span class="text-[12px] font-extrabold text-muted">{{ f.label }}</span>
                  <span class="flex items-center gap-[6px] font-extrabold text-[15px] leading-tight">
                    @if (f.color) {
                      <span class="w-4 h-4 flex-none rounded-full border-2 border-line" [style.background]="f.color"></span>
                    }
                    {{ f.value }}
                  </span>
                </div>
              }
            </div>
          }
          @if (d.text) {
            <div class="panel py-[14px] px-4 text-[15px] font-semibold leading-[1.45] whitespace-pre-line">{{ d.text }}</div>
          }

          <div class="panel py-[14px] px-4 flex flex-col gap-3">
            <div class="relative flex items-center gap-2">
              <h2 class="m-0 font-pixel font-semibold text-[18px] leading-none">Waarde</h2>
              <button
                (click)="s.toggleTip()"
                title="Over deze prijzen"
                class="tap w-6 h-6 rounded-full border-2 border-line bg-bg p-0 flex items-center justify-center font-pixel font-semibold text-[13px] leading-none"
              >
                i
              </button>
              @if (s.tip) {
                <div
                  class="absolute left-0 top-[34px] z-[5] max-w-[270px] bg-ink text-bg rounded-lg py-[9px] px-[11px] text-[13px] font-bold leading-[1.35] shadow-[3px_3px_0_var(--red)]"
                >
                  Cardmarket-prijzen gelden per kaart, niet per taal.
                </div>
              }
            </div>
            <div class="bg-device border-2 border-line rounded-[10px] p-[6px]">
              <div class="relative lcd rounded-md shadow-[inset_0_0_0_3px_var(--display-edge)] p-[14px] flex flex-col gap-3 overflow-hidden">
                @let pick = picked();
                <div class="flex flex-wrap items-end justify-between gap-[10px]">
                  <div>
                    <div class="text-[12px] leading-none tracking-[.08em]">{{ pick ? pick.when : 'TRENDPRIJS' }}</div>
                    <div class="font-bold text-[46px] leading-[1.05]">{{ pick ? (pick.approx ? '≈ ' : '') + pick.price : dv.trend }}</div>
                  </div>
                  <div class="flex items-center gap-2 rounded-md py-[7px] px-[10px]" [style.background]="dv.bg" [style.color]="dv.fg">
                    <cc-trend [up]="dv.up" />
                    <div class="flex flex-col gap-[3px]">
                      <span class="font-semibold text-[16px] leading-none">{{ dv.chg }}</span
                      ><span class="text-[10px] leading-none">T.O.V. 7 DAGEN</span>
                    </div>
                  </div>
                </div>
                <!-- Hover (or drag a finger) over the bars to read a day's price; only today's is a real price, the rest is interpolated from Cardmarket's averages. -->
                <div
                  class="flex items-end gap-[2px] h-[70px] cursor-crosshair touch-pan-y"
                  (pointermove)="scrub($event, s.dBars.length)"
                  (pointerdown)="scrub($event, s.dBars.length)"
                  (pointerleave)="$event.pointerType === 'mouse' && pickAt.set(null)"
                >
                  @for (b of s.dBars; track b.key; let i = $index) {
                    <div
                      class="flex-1 bg-[repeating-linear-gradient(0deg,transparent_0_4px,color-mix(in_srgb,var(--display)_35%,_transparent)_4px_5px)]"
                      [style.height.%]="b.h"
                      [style.background-color]="pick ? (i === pick.i ? 'var(--display-text)' : '#4E7A2E') : b.bg"
                    ></div>
                  }
                </div>
                <div class="flex justify-between text-[11px] leading-none"><span>30 DAGEN GELEDEN</span><span>{{ pick ? 'GEM. 30 DAGEN ' + dv.avg30 : 'VANDAAG' }}</span></div>
                @if (s.lcdPixels) {
                  <div class="lcd-pixels"></div>
                }
              </div>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <div class="flex flex-col gap-1">
                <span class="text-[12px] font-extrabold text-muted">Laagste</span><span class="font-pixel text-[17px] leading-none">{{ dv.low }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-[12px] font-extrabold text-muted">Gem. 7 dagen</span><span class="font-pixel text-[17px] leading-none">{{ dv.avg7 }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-[12px] font-extrabold text-muted">Gem. 30 dagen</span><span class="font-pixel text-[17px] leading-none">{{ dv.avg30 }}</span>
              </div>
            </div>
            @if (dv.foil) {
              <div class="grid grid-cols-3 gap-[10px] border-t-2 border-dashed border-soft pt-[10px]">
                <div class="flex flex-col gap-1">
                  <span class="text-[12px] font-extrabold text-muted">Foil · trend</span><span class="font-pixel text-[17px] leading-none">{{ dv.foil.trend }}</span>
                </div>
                <div class="flex flex-col gap-1">
                  <span class="text-[12px] font-extrabold text-muted">Foil · laagste</span><span class="font-pixel text-[17px] leading-none">{{ dv.foil.low }}</span>
                </div>
                <div class="flex flex-col gap-1">
                  <span class="text-[12px] font-extrabold text-muted">Foil · 30 dagen</span><span class="font-pixel text-[17px] leading-none">{{ dv.foil.avg30 }}</span>
                </div>
              </div>
            }
            <div class="text-[15px] font-black border-t-2 border-dashed border-soft pt-[10px]">{{ dv.owned }}</div>
            <div class="flex items-center gap-[6px] text-[12.5px] font-bold text-muted">
              <span class="icon text-[16px]">storefront</span>{{ s.priceSource }}
            </div>
          </div>

          <div class="panel py-[14px] px-4 flex flex-col gap-[10px]">
            <div class="flex justify-between items-baseline">
              <h2 class="m-0 font-pixel font-semibold text-[18px] leading-none">In bezit</h2>
              <span class="font-pixel font-semibold text-[22px] leading-none">×{{ d.total }}</span>
            </div>
            @for (o of s.dOwnRows; track o.key) {
              <div class="flex items-center gap-3 py-[6px] border-t-2 border-dashed border-soft">
                <span class="font-pixel font-semibold text-[14px] leading-none w-[30px]">{{ o.code }}</span>
                <span class="flex-1 min-w-0 font-bold text-[14px] overflow-hidden text-ellipsis whitespace-nowrap">{{ o.lname }} · {{ o.name }}</span>
                <div class="flex items-center border-2 border-line rounded-[9px] overflow-hidden bg-bg">
                  <button (click)="o.dec()" class="w-11 h-10 border-0 bg-transparent font-black text-[18px]">−</button>
                  <span class="w-7 text-center font-pixel font-semibold text-[16px] leading-none">{{ o.n }}</span>
                  <button (click)="o.inc()" class="w-11 h-10 border-0 bg-transparent font-black text-[18px]">+</button>
                </div>
              </div>
              @if (o.hasFoil) {
                <div class="flex items-center gap-3 -mt-1 pl-[42px]">
                  <span class="flex-1 font-bold text-[13px] text-muted">waarvan foil</span>
                  <div class="flex items-center border-2 border-line rounded-[9px] overflow-hidden bg-bg">
                    <button (click)="o.foilDec()" class="w-9 h-8 border-0 bg-transparent font-black text-[16px]">−</button>
                    <span class="w-7 text-center font-pixel font-semibold text-[14px] leading-none">{{ o.foil }}</span>
                    <button (click)="o.foilInc()" class="w-9 h-8 border-0 bg-transparent font-black text-[16px]">+</button>
                  </div>
                </div>
              }
            }
          </div>

          <div class="panel py-[14px] px-4 flex flex-col gap-[10px]">
            <h2 class="m-0 font-pixel font-semibold text-[18px] leading-none">In binders</h2>
            @for (b of s.dBinders; track b.key) {
              <div class="flex items-center gap-3">
                <div class="w-7 h-9 border-2 border-line rounded-[3px_6px_6px_3px] flex-none" [style.background]="b.cover"></div>
                <div class="flex-1 min-w-0">
                  <div class="font-black text-[15px]">{{ b.name }}</div>
                  <div class="text-[13px] text-muted font-bold">{{ b.where }}</div>
                </div>
                <button
                  (click)="b.open()"
                  class="bg-bg border-2 border-line rounded-[9px] shadow-[2px_2px_0_var(--line)] py-[6px] px-3 font-extrabold text-[13px]"
                >
                  Openen
                </button>
              </div>
            }
            @if (s.noDBinders) {
              <div class="text-[14px] text-muted font-bold">Deze kaart zit nog in geen enkele binder.</div>
            }
          </div>
        </div>
      </div>

      @if (s.hasDSame) {
        <section class="flex flex-col gap-3 min-w-0">
          <div class="flex items-baseline gap-3">
            <h2 class="m-0 font-pixel font-semibold text-[20px] leading-none">Ook van {{ s.dSameName }}</h2>
            <span class="font-extrabold text-muted text-[14px]">{{ s.dSameCount }} {{ s.dSameCount === 1 ? 'kaart' : 'kaarten' }}</span>
          </div>
          <div class="flex gap-[14px] overflow-x-auto overscroll-x-contain snap-x pb-3 -mx-1 px-1">
            @for (r of s.dSame; track r.key) {
              <button (click)="r.open()" class="lift glare-trigger snap-start flex-none w-[118px] flex flex-col gap-[6px] bg-transparent border-0 p-0 text-left">
                <div class="aspect-[63/88] w-full rounded-lg shadow-[3px_3px_0_var(--line)]"><cc-card [card]="r.cv" glare="hover" /></div>
                <div class="flex justify-between gap-[6px] text-[12px] font-extrabold">
                  <span class="overflow-hidden text-ellipsis whitespace-nowrap">{{ r.name }}</span><span class="font-pixel font-normal flex-none">{{ r.qtyLabel }}</span>
                </div>
                <div class="text-[11.5px] font-bold text-muted leading-none overflow-hidden text-ellipsis whitespace-nowrap">{{ r.meta }}</div>
                <div class="font-pixel text-[12px] leading-none text-muted">{{ r.price }}</div>
              </button>
            }
            @if (s.hasMoreSame) {
              <button (click)="s.moreSame()" class="btn snap-start flex-none self-center flex-col py-4"><span class="icon text-[22px]">arrow_forward</span>Meer</button>
            }
          </div>
        </section>
      }
    </div>
  `,
})
export class DetailScreen {
  private readonly store = inject(CardcaseStore);
  protected readonly v = this.store.vals;
  /** Bar under the pointer in the price chart, remembered per card so it clears when another card opens. */
  protected readonly pickAt = signal<{ id: number; i: number } | null>(null);
  protected readonly picked = computed(() => {
    const p = this.pickAt();
    const b = p && p.id === this.store.state.detailId ? this.v().dBars[p.i] : null;
    return b ? { ...b, i: p!.i } : null;
  });

  protected scrub(e: PointerEvent, n: number) {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const i = Math.min(n - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * n)));
    this.pickAt.set({ id: this.store.state.detailId, i });
  }
}
