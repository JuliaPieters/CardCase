import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Card } from './card';

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
  imports: [Card],
  host: { class: 'flex flex-col flex-1' },
  template: `
    <div
      class="w-full h-full bg-page border-2 border-line p-[clamp(6px,1.4vw,14px)] flex flex-col gap-2"
      [style.border-radius]="p().radius"
    >
      <div class="grid gap-[clamp(4px,0.9vw,10px)]" [style.grid-template-columns]="'repeat(' + p().cols + ', minmax(0,1fr))'">
        @for (s of p().slots; track s.key) {
          <div
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
            @if (s.isAct) {
              <div class="absolute -inset-[3px] border-[3px] border-red rounded-[9px] pointer-events-none"></div>
            }
            @if (s.isDeco) {
              <div
                class="absolute inset-0 rounded-[7px] border-2 border-line pointer-events-none"
                [style.background-image]="s.decoFill"
                [style.background-size]="s.decoSize"
                [style.background-position]="s.decoPos"
              ></div>
              <div class="absolute left-1/2 bottom-[8%] -translate-x-1/2 bg-paper text-coal border-[1.5px] border-coal font-pixel text-[9.5cqw] leading-none px-[4cqw] py-[3cqw] rounded-[3px] whitespace-nowrap pointer-events-none">
                DECORATIE
              </div>
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
              <div class="absolute -inset-1 border-[3px] border-lcd rounded-[9px] shadow-[0_0_0_2px_#306230] pointer-events-none"></div>
              <div class="absolute left-1/2 -top-[9px] -translate-x-1/2 bg-lcd text-lcd-ink border-2 border-lcd-ink font-pixel text-[10px] leading-none px-[5px] py-[3px] rounded pointer-events-none">
                NIEUW
              </div>
            }
            @if (s.isTarget) {
              <div class="absolute -inset-[2px] border-2 border-dashed border-lcd-mid rounded-lg bg-[rgba(155,188,15,.12)] pointer-events-none"></div>
            }
            @if (s.isOver) {
              <div
                class="absolute -inset-1 border-[3px] border-lcd rounded-[9px] bg-[rgba(155,188,15,.28)] shadow-[0_0_0_3px_#306230,0_0_18px_rgba(155,188,15,.8)] flex items-center justify-center font-pixel font-semibold text-[30cqw] leading-none text-lcd-ink pointer-events-none"
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
      </div>
      <div class="mt-auto flex font-pixel text-[11px] leading-none text-muted tracking-[.06em]" [style.justify-content]="p().align">{{ p().label }}</div>
    </div>
  `,
})
export class BinderPage {
  readonly page = input<any>(null);
  protected readonly p = computed(() => this.page() ?? DEMO);
}
