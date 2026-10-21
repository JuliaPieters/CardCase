import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Card } from './card';
import { Pix } from './bits';

const DEMO = {
  cols: 3,
  bg: 'linear-gradient(160deg,#D8F5A2,#9BBC0F)',
  radius: '10px',
  outline: 'none',
  align: 'flex-start',
  num: 'PAGINA 1',
  cells: Array.from({ length: 9 }, (_, i) => ({ key: i, border: '1.5px dashed rgba(106,101,88,.55)', pocket: 'rgba(255,255,255,.22)' })),
  images: [],
  stickers: [],
};

/** Binder page in decoration mode: background, spanning images, card cells and free stickers. */
@Component({
  selector: 'cc-deco-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, Pix],
  host: { class: 'flex flex-col flex-1' },
  template: `
    <div
      data-page="1"
      [attr.data-pn]="p().pn"
      class="relative w-full h-full border-2 border-line overflow-hidden bg-page outline-offset-[3px]"
      [style.border-radius]="p().radius"
      [style.outline]="p().outline"
      (pointerdown)="p().onPageDown?.($event)"
      (dragover)="p().onPageDragOver?.($event)"
      (drop)="p().onPageDrop?.($event)"
    >
      <div class="absolute inset-0 bg-cover bg-center pointer-events-none" [style.background-image]="p().bg"></div>
      <div class="relative p-[clamp(6px,1.4vw,14px)] pb-8">
        <div
          data-grid="1"
          class="relative grid gap-2"
          [style.grid-template-columns]="'repeat(' + p().cols + ', minmax(0,1fr))'"
          (dragover)="p().onGridDragOver?.($event)"
          (drop)="p().onGridDrop?.($event)"
        >
          @for (im of p().images; track im.key) {
            <div
              class="absolute z-[1] rounded-md border-2 border-line touch-none outline-offset-2"
              [style.left]="'calc(' + im.l + ')'"
              [style.top]="'calc(' + im.t + ')'"
              [style.width]="'calc(' + im.w + ')'"
              [style.height]="'calc(' + im.h + ')'"
              [style.cursor]="im.cursor"
              [style.outline]="im.outline"
              (pointerdown)="im.onDown?.($event)"
            >
              <div class="absolute inset-0 rounded overflow-hidden pointer-events-none">
                <div
                  class="absolute inset-0 bg-cover"
                  [style.background-image]="im.fill"
                  [style.background-position]="im.pos"
                  [style.transform]="'scale(' + im.zoom + ')'"
                  [style.transform-origin]="im.pos"
                ></div>
              </div>
              @if (im.buffer) {
                <div
                  title="Wordt vervangen als er een nieuwe kaart bij komt."
                  class="absolute right-[5px] bottom-[5px] z-[3] w-[22px] h-[22px] rounded-[5px] bg-gold border-2 border-coal text-coal flex items-center justify-center"
                >
                  <span class="icon text-[15px]">swap_horiz</span>
                </div>
              }
              @if (im.selected) {
                <div class="absolute left-[6px] top-[6px] z-[3] bg-lcd-ink text-lcd rounded px-[6px] py-1 font-pixel text-[11px] leading-none whitespace-nowrap pointer-events-none">
                  {{ im.sizeLabel }}
                </div>
                <div (pointerdown)="im.hTL($event)" class="absolute -left-[9px] -top-[9px] z-[4] w-4 h-4 bg-lcd border-2 border-lcd-ink cursor-nwse-resize touch-none"></div>
                <div (pointerdown)="im.hTR($event)" class="absolute -right-[9px] -top-[9px] z-[4] w-4 h-4 bg-lcd border-2 border-lcd-ink cursor-nesw-resize touch-none"></div>
                <div (pointerdown)="im.hBL($event)" class="absolute -left-[9px] -bottom-[9px] z-[4] w-4 h-4 bg-lcd border-2 border-lcd-ink cursor-nesw-resize touch-none"></div>
                <div (pointerdown)="im.hBR($event)" class="absolute -right-[9px] -bottom-[9px] z-[4] w-4 h-4 bg-lcd border-2 border-lcd-ink cursor-nwse-resize touch-none"></div>
              }
            </div>
          }
          @for (c of p().cells; track c.key) {
            <div class="relative z-[2] aspect-[63/88] rounded-md pointer-events-none" [style.border]="c.border" [style.background]="c.pocket">
              @if (c.hasCard) {
                <div class="absolute inset-0"><cc-card [card]="c.cv" /></div>
              }
              @if (c.isOver) {
                <div class="absolute -inset-1 border-[3px] border-lcd rounded-lg bg-[rgba(155,188,15,.35)] shadow-[0_0_0_2px_#306230]"></div>
              }
            </div>
          }
        </div>
      </div>
      @if (p().hasLabel) {
        <div class="absolute left-1/2 bottom-[7px] -translate-x-1/2 z-[2] bg-paper text-coal border-2 border-coal rounded-[5px] px-2 py-[3px] font-pixel text-[12px] leading-none whitespace-nowrap pointer-events-none">
          {{ p().label }}
        </div>
      }
      <div class="absolute left-[10px] right-[10px] bottom-[10px] flex font-pixel text-[10px] leading-none text-muted pointer-events-none" [style.justify-content]="p().align">
        {{ p().num }}
      </div>
      <div class="absolute inset-0 z-[3] pointer-events-none">
        @for (s of p().stickers; track s.key) {
          <div
            class="absolute touch-none outline-offset-4 rounded"
            [style.left.%]="s.x"
            [style.top.%]="s.y"
            [style.transform]="'translate(-50%,-50%) rotate(' + s.rot + 'deg)'"
            [style.pointer-events]="s.pe"
            [style.cursor]="s.cursor"
            [style.outline]="s.outline"
            (pointerdown)="s.onDown?.($event)"
          >
            @if (s.isPixel) {
              <cc-pix [shadow]="s.shadow" class="drop-shadow-[2px_2px_0_rgba(26,28,34,.55)]" />
            }
            @if (s.isText) {
              <div
                class="border-2 border-coal rounded-[5px] px-2 py-1 font-pixel text-[13px] leading-none whitespace-nowrap shadow-[2px_2px_0_#1A1C22]"
                [style.background]="s.bg"
                [style.color]="s.fg"
              >
                {{ s.text }}
              </div>
            }
            @if (s.selected) {
              <button
                (pointerdown)="s.onRemove($event)"
                title="Verwijder"
                class="absolute -top-[13px] -right-[13px] w-5 h-5 rounded-full border-2 border-coal bg-paper text-coal font-sans font-bold text-[12px] leading-none p-0"
              >
                ×
              </button>
            }
          </div>
        }
      </div>
      @if (p().watermark) {
        <div class="absolute right-2 top-2 z-[4] bg-lcd text-lcd-ink border-2 border-lcd-ink rounded px-[6px] py-[3px] font-pixel font-semibold text-[11px] leading-none tracking-[.04em]">
          CARDCASE
        </div>
      }
    </div>
  `,
})
export class DecoPage {
  readonly pg = input<any>(null);
  protected readonly p = computed(() => this.pg() ?? DEMO);
}
