import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ArtPiece } from './art-piece';
import { Card } from './card';
import { Pix } from './bits';

const DEMO = {
  cols: 3,
  radius: '10px',
  align: 'flex-start',
  label: 'PAGINA 1',
  slots: Array.from({ length: 9 }, (_, i) => ({ key: i, n: i + 1, isEmpty: true, cursor: 'default' })),
};

/** One binder page with its pocket slots. `page` is a view model from `CardcaseStore.pageModel()`. */
@Component({
  selector: 'cc-binder-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArtPiece, Card, Pix],
  host: { class: 'flex flex-col flex-1' },
  template: `
    @let dc = p().deco;
    <div
      data-page="1"
      [attr.data-pn]="dc?.pn"
      class="relative w-full h-full bg-page border-2 border-line p-[clamp(6px,1.4vw,14px)] flex flex-col gap-2 overflow-hidden"
      [style.border-radius]="p().radius"
      (pointerdown)="dc?.onPageDown?.()"
      (dragover)="dc?.onPageDragOver?.($event)"
      (drop)="dc?.onPageDrop?.($event)"
    >
      @if (dc && dc.bg !== 'none') {
        <div class="absolute inset-0 bg-cover bg-center pointer-events-none" [style.background-image]="dc.bg"></div>
      }
      <!-- The gap is fixed (8px): moving and resizing art measures pockets with it. -->
      <div
        data-grid="1"
        class="relative grid [--g:8px] gap-[var(--g)]"
        [style.grid-template-columns]="'repeat(' + p().cols + ', minmax(0,1fr))'"
        (dragover)="dc?.onGridDragOver?.($event)"
        (drop)="dc?.onGridDrop?.($event)"
      >
        @for (s of p().slots; track s.key) {
          <div
            data-sel
            class="group relative aspect-[63/88] rounded-[7px] bg-pocket shadow-[inset_0_2px_0_rgba(0,0,0,.08)] [container-type:inline-size]"
            [attr.draggable]="s.draggable ? 'true' : null"
            [style.cursor]="s.cursor"
            (dragstart)="s.onDragStart?.($event)"
            (dragover)="s.onDragOver?.($event)"
            (dragleave)="s.onDragLeave?.($event)"
            (drop)="s.onDrop?.($event)"
            (dragend)="s.onDragEnd?.($event)"
            (click)="s.onClick?.($event)"
          >
            @if (s.isEmpty) {
              <div class="absolute inset-[5%] border-2 border-dashed border-muted rounded-md opacity-45 flex flex-col p-[8%] gap-[8%] pointer-events-none">
                <div class="h-[8%] w-3/5 rounded-[2px] bg-muted opacity-50"></div>
                <div class="flex-1 border-[1.5px] border-dashed border-muted rounded"></div>
                <div class="font-pixel text-[14cqw] leading-none text-muted text-right">{{ s.n }}</div>
              </div>
            }
            @if (s.hasCard) {
              <div class="absolute inset-0 pointer-events-none"><cc-card [card]="s.card" /></div>
            }
            @if (s.isOwned) {
              <!-- Owned: a check mark, so every card keeps its colours and the page can be judged as a whole. -->
              <div title="In bezit" class="absolute top-[4%] right-[4%] z-[3] w-[max(18px,17cqw)] h-[max(18px,17cqw)] rounded-full bg-lcd-mid text-cream border-[1.5px] border-line flex items-center justify-center shadow-[0_2px_0_var(--line)] pointer-events-none">
                <span class="icon text-[max(13px,12cqw)]">check</span>
              </div>
            }
            @if (s.isWanted) {
              <!-- While editing: not in the collection yet. -->
              <div class="absolute left-1/2 bottom-[17%] -translate-x-1/2 z-[3] bg-ink text-bg font-pixel text-[max(8px,7.5cqw)] leading-none px-[4cqw] py-[2.5cqw] rounded-[3px] whitespace-nowrap shadow-[0_2px_0_rgba(0,0,0,.25)] pointer-events-none">
                NIET IN BEZIT
              </div>
            }
            @if (s.isAct) {
              <div class="absolute -inset-[3px] border-[3px] border-red rounded-[9px] pointer-events-none"></div>
            }
            @if (s.isDeco) {
              <div class="absolute inset-0 rounded-[7px] border-2 border-line overflow-hidden pointer-events-none"><cc-art-piece [p]="s.decoArt" /></div>
              @if (s.decoBuf) {
                <div
                  title="Wordt vervangen als er een nieuwe kaart bij komt."
                  class="absolute top-[5%] right-[5%] w-[22cqw] h-[22cqw] min-w-4 min-h-4 rounded bg-gold border-[1.5px] border-coal text-coal flex items-center justify-center"
                >
                  <span class="icon text-[14px]">swap_horiz</span>
                </div>
              }
            }
            @if (s.showPrice) {
              <div
                class="absolute left-1/2 top-[30%] -translate-x-1/2 bg-surface text-ink border-[1.5px] border-line font-pixel text-[10cqw] leading-none px-[4cqw] py-[3cqw] rounded-[3px] whitespace-nowrap pointer-events-none"
                [style.border-style]="s.priceBorder"
              >
                {{ s.priceLabel }}
              </div>
            }
            @if (s.isReserved) {
              <div
                class="absolute inset-[4%] border-2 border-dashed border-ink rounded-md flex flex-col items-center justify-center gap-[7cqw] pointer-events-none opacity-85 bg-[repeating-linear-gradient(135deg,rgba(127,120,100,.16)_0_6px,transparent_6px_12px)]"
              >
                <div class="flex flex-col items-center">
                  <div class="w-[22cqw] h-[13cqw] border-[5cqw] border-b-0 border-ink"></div>
                  <div class="w-[36cqw] h-[26cqw] bg-ink flex items-center justify-center"><div class="w-[6cqw] h-[10cqw] bg-page"></div></div>
                </div>
                <div class="font-pixel text-[10cqw] leading-[1.1] text-ink text-center px-[6cqw]">{{ s.resLabel }}</div>
              </div>
            }
            @if (s.isMoved) {
              <div class="absolute -inset-[2px] border-2 border-amber rounded-lg pointer-events-none"></div>
              <div class="absolute -top-[7px] -left-[7px] w-[22px] h-[22px] rounded-md bg-amber border-2 border-line flex items-center justify-center pointer-events-none">
                <span class="icon text-[15px] text-coal">{{ s.moveIcon }}</span>
              </div>
            }
            @if (s.isNew) {
              <div class="absolute -inset-1 border-[3px] border-lcd rounded-[9px] shadow-[0_0_0_2px_var(--display-muted)] pointer-events-none"></div>
              <div class="absolute left-1/2 -top-[9px] -translate-x-1/2 bg-lcd text-lcd-ink border-2 border-lcd-ink font-pixel text-[10px] leading-none px-[5px] py-[3px] rounded pointer-events-none">
                NIEUW
              </div>
            }
            @if (s.isDropOver) {
              <div class="absolute -inset-1 z-[3] border-[3px] border-lcd rounded-[9px] bg-[color-mix(in_srgb,var(--display)_35%,_transparent)] shadow-[0_0_0_2px_var(--display-muted)] pointer-events-none"></div>
            }
            @if (s.isTarget) {
              <div class="absolute -inset-[2px] border-2 border-dashed border-lcd-mid rounded-lg bg-[color-mix(in_srgb,var(--display)_12%,_transparent)] pointer-events-none"></div>
            }
            @if (s.isOver) {
              <div
                class="absolute -inset-1 border-[3px] border-lcd rounded-[9px] bg-[color-mix(in_srgb,var(--display)_28%,_transparent)] shadow-[0_0_0_3px_var(--display-muted),0_0_18px_color-mix(in_srgb,var(--display)_80%,_transparent)] flex items-center justify-center font-pixel font-semibold text-[30cqw] leading-none text-lcd-ink pointer-events-none"
              >
                +
              </div>
            }
            @if (s.isDragging) {
              <div class="absolute inset-0 rounded-[7px] pointer-events-none bg-[repeating-linear-gradient(135deg,rgba(0,0,0,.18)_0_5px,transparent_5px_10px)]"></div>
            }
            @if (s.hasWarn) {
              <!-- The recipe's version doesn't exist for this Pokémon (e.g. no IR): its regular card stands in. -->
              <div
                [title]="s.warnText"
                class="absolute top-[4%] left-1/2 -translate-x-1/2 z-[3] bg-amber text-coal border-[1.5px] border-line rounded-[4px] px-[5cqw] py-[3cqw] font-pixel text-[max(9px,9cqw)] leading-none whitespace-nowrap shadow-[0_2px_0_var(--line)] pointer-events-none"
              >
                {{ s.warnShort }}
              </div>
            }
            @if (s.verLabel) {
              <!-- The version this slot is for (a master set with every version): foil, reverse holo… -->
              <div
                [title]="s.verLabel"
                class="absolute bottom-[4%] left-[4%] max-w-[92%] overflow-hidden text-ellipsis z-[3] bg-paper text-coal border-[1.5px] border-line rounded-[4px] px-[4cqw] py-[3cqw] font-pixel text-[max(9px,8.5cqw)] leading-none whitespace-nowrap shadow-[0_2px_0_var(--line)] uppercase"
              >
                {{ s.verLabel }}
              </div>
            }
            @if (s.hasAlts) {
              <!-- Several cards fit the recipe (e.g. four IRs): tap to pick another one. -->
              <button
                (click)="s.onAlts($event)"
                [title]="s.canPickAlt ? 'Kies een andere' : ''"
                class="absolute bottom-[4%] right-[4%] z-[3] bg-lcd text-lcd-ink border-[1.5px] border-line rounded-[4px] px-[4cqw] py-[3cqw] font-pixel text-[max(9px,8.5cqw)] leading-none whitespace-nowrap shadow-[0_2px_0_var(--line)]"
                [style.cursor]="s.canPickAlt ? 'pointer' : 'default'"
                [style.pointer-events]="s.canPickAlt ? 'auto' : 'none'"
              >
                {{ s.altsLabel }}
              </button>
            }
            @if (s.canSwap) {
              <button
                (click)="s.onSwap($event)"
                title="Andere versie"
                class="absolute -right-[7px] -bottom-[7px] z-[3] w-7 h-7 rounded-full border-2 border-line bg-lcd text-lcd-ink p-0 hidden group-hover:flex items-center justify-center"
                [style.display]="s.isAct ? 'flex' : null"
              >
                <span class="icon text-[17px]">swap_horiz</span>
              </button>
            }
            @if (s.canRemove) {
              <button
                (click)="s.onRemove($event)"
                title="Uit slot halen"
                class="absolute -top-[6px] -right-[6px] w-7 h-7 z-[3] rounded-full border-2 border-line bg-surface text-ink font-sans font-bold text-[15px] leading-none p-0 hidden group-hover:flex items-center justify-center"
                [style.display]="s.isAct ? 'flex' : null"
              >
                ×
              </button>
            }
          </div>
        }
        @for (im of dc?.images || []; track im.key) {
          <!-- Art: select, move and resize; its picture is drawn in the pockets underneath. -->
          <div
            data-sel
            class="absolute z-[4] rounded-[7px] touch-none cursor-move"
            [style.left]="'calc(' + im.l + ')'"
            [style.top]="'calc(' + im.t + ')'"
            [style.width]="'calc(' + im.w + ')'"
            [style.height]="'calc(' + im.h + ')'"
            [style.outline]="im.selected ? '3px solid var(--display)' : 'none'"
            [style.outline-offset]="'2px'"
            (pointerdown)="im.onDown($event)"
          >
            @if (im.buffer) {
              <div title="Wordt vervangen als er een nieuwe kaart bij komt." class="absolute right-[5px] bottom-[5px] w-[22px] h-[22px] rounded-[5px] bg-gold border-2 border-coal text-coal flex items-center justify-center pointer-events-none">
                <span class="icon text-[15px]">swap_horiz</span>
              </div>
            }
            @if (im.selected) {
              <div class="absolute left-[6px] top-[6px] bg-lcd-ink text-lcd rounded px-[6px] py-1 font-pixel text-[11px] leading-none whitespace-nowrap pointer-events-none">{{ im.sizeLabel }}</div>
              <div (pointerdown)="im.hTL($event)" class="absolute -left-[9px] -top-[9px] w-4 h-4 bg-lcd border-2 border-lcd-ink cursor-nwse-resize touch-none"></div>
              <div (pointerdown)="im.hTR($event)" class="absolute -right-[9px] -top-[9px] w-4 h-4 bg-lcd border-2 border-lcd-ink cursor-nesw-resize touch-none"></div>
              <div (pointerdown)="im.hBL($event)" class="absolute -left-[9px] -bottom-[9px] w-4 h-4 bg-lcd border-2 border-lcd-ink cursor-nesw-resize touch-none"></div>
              <div (pointerdown)="im.hBR($event)" class="absolute -right-[9px] -bottom-[9px] w-4 h-4 bg-lcd border-2 border-lcd-ink cursor-nwse-resize touch-none"></div>
            }
          </div>
        }
      </div>
      <div class="mt-auto flex font-pixel text-[11px] leading-none text-muted tracking-[.06em]" [style.justify-content]="p().align">{{ p().label }}</div>
      @if (dc?.bgLabel) {
        <div class="absolute left-1/2 bottom-[7px] -translate-x-1/2 z-[2] bg-paper text-coal border-2 border-coal rounded-[5px] px-2 py-[3px] font-pixel text-[12px] leading-none whitespace-nowrap pointer-events-none">{{ dc?.bgLabel }}</div>
      }
      <div class="absolute inset-0 z-[5] pointer-events-none">
        @for (st of dc?.stickers || []; track st.key) {
          <div
            data-sel
            class="absolute touch-none rounded outline-offset-4"
            [style.left.%]="st.x"
            [style.top.%]="st.y"
            [style.transform]="'translate(-50%,-50%) rotate(' + st.rot + 'deg)'"
            [style.pointer-events]="st.pe"
            [style.cursor]="st.cursor"
            [style.outline]="st.selected ? '2px dashed var(--display-muted)' : 'none'"
            (pointerdown)="st.onDown?.($event)"
          >
            @if (st.isPixel) {
              <cc-pix [shadow]="st.shadow" class="drop-shadow-[2px_2px_0_color-mix(in_srgb,var(--coal)_55%,_transparent)]" />
            }
            @if (st.isText) {
              <div class="border-2 border-coal rounded-[5px] px-2 py-1 font-pixel text-[13px] leading-none whitespace-nowrap shadow-[2px_2px_0_var(--coal)]" [style.background]="st.bg" [style.color]="st.fg">{{ st.text }}</div>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class BinderPage {
  readonly page = input<any>(null);
  protected readonly p = computed(() => this.page() ?? DEMO);
}
