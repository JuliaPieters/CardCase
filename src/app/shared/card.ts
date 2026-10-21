import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** View model produced by `CardcaseStore.cv()`. */
export interface CardView {
  name: string;
  num: string;
  bg: string;
  typeLabel: string;
  rar: string;
  holo?: boolean;
  missing?: boolean;
  /** Greyed out: only used in binder plans, for planned cards you don't own yet. */
  dim?: boolean;
  /** Real card image (TCGdex); the drawn placeholder shows while it loads or if it fails. */
  img?: string | null;
  /** Second try for `img` (the full-size original when `img` is a resized copy from a proxy). */
  img2?: string | null;
  /** Sprite of the Pokémon, shown in the placeholder's artwork box (for cards TCGdex has no photo of). */
  art?: string | null;
  /** Special rarity shown as a small label on the card, e.g. IR, SAR, CHR. */
  badge?: string | null;
}

const DEMO: CardView = { name: 'Flarekit', num: 'EMB 001/014', bg: 'oklch(0.80 0.11 40)', typeLabel: 'Fire', rar: '●' };

/** Placeholder trading card; scales with its container via container query units. */
@Component({
  selector: 'cc-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full' },
  template: `
    <div
      class="relative w-full aspect-[63/88] [container-type:inline-size] border-2 border-line rounded-[7px] overflow-hidden"
      [style.background]="c().bg"
      [style.filter]="c().dim ? 'grayscale(1)' : 'none'"
      [style.opacity]="c().dim ? 0.38 : 1"
    >
      <div class="absolute inset-0 p-[6cqw] flex flex-col gap-[4cqw]">
        <div class="flex items-center justify-between gap-[3cqw]">
          <div class="font-sans font-extrabold text-[10cqw] leading-[1.15] text-coal whitespace-nowrap overflow-hidden text-ellipsis min-w-0">{{ c().name }}</div>
          <div class="font-pixel text-[9cqw] leading-none text-coal flex-none">{{ c().rar }}</div>
        </div>
        <div
          class="relative flex-1 min-h-0 border-[1.5px] border-[rgba(26,28,34,.65)] rounded-[3cqw] flex items-end p-[3cqw] font-mono font-medium text-[6.5cqw] leading-none text-[rgba(26,28,34,.55)] bg-[repeating-linear-gradient(135deg,rgba(255,255,255,.5)_0_4px,rgba(255,255,255,.18)_4px_8px)]"
        >
          @if (c().art && !c().img) {
            <img
              [src]="c().art"
              alt=""
              loading="lazy"
              decoding="async"
              class="absolute inset-0 w-full h-full object-contain [image-rendering:pixelated]"
              (error)="$any($event.target).style.display = 'none'"
            />
          } @else {
            artwork
          }
        </div>
        <div class="flex flex-col gap-[2.5cqw]">
          <div class="h-[3cqw] w-4/5 rounded-[2cqw] bg-[rgba(26,28,34,.16)]"></div>
          <div class="h-[3cqw] w-[55%] rounded-[2cqw] bg-[rgba(26,28,34,.16)]"></div>
        </div>
        <div class="flex justify-between items-baseline gap-[2cqw] text-coal">
          <span class="font-sans font-bold text-[7cqw] leading-none whitespace-nowrap overflow-hidden text-ellipsis">{{ c().typeLabel }}</span>
          <span class="font-pixel text-[7.5cqw] leading-none whitespace-nowrap">{{ c().num }}</span>
        </div>
      </div>
      @if (c().img) {
        <img
          [src]="c().img"
          [alt]="c().name"
          loading="lazy"
          decoding="async"
          class="absolute inset-0 w-full h-full object-cover"
          (error)="fallback($event)"
        />
      } @else if (c().holo) {
        <div
          class="absolute inset-0 pointer-events-none mix-blend-overlay bg-[linear-gradient(115deg,rgba(255,120,200,.45),rgba(255,230,120,.45)_25%,rgba(120,240,190,.45)_50%,rgba(120,200,255,.45)_75%,rgba(200,150,255,.45))]"
        ></div>
        <div class="absolute inset-0 pointer-events-none bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,.55)_45%,transparent_55%)]"></div>
      }
      @if (glare()) {
        <div class="cc-glare" [class.cc-glare-loop]="glare() === 'loop'"></div>
      }
      @if (c().badge) {
        <div class="absolute left-[4cqw] bottom-[4cqw] bg-coal text-paper border-[1.5px] border-paper rounded-[3cqw] px-[3cqw] py-[1.5cqw] font-pixel text-[max(8px,8cqw)] leading-none pointer-events-none">
          {{ c().badge }}
        </div>
      }
    </div>
  `,
})
export class Card {
  readonly card = input<CardView | null | undefined>(null);
  /** Light sweep over the card: 'hover' plays once when a `.glare-trigger` ancestor is hovered, 'loop' repeats (styles.css). */
  readonly glare = input<'hover' | 'loop' | null>(null);
  protected readonly c = computed(() => this.card() ?? DEMO);

  /** A failed image falls back to `img2` once, then to the drawn placeholder underneath. */
  protected fallback(e: Event) {
    const el = e.target as HTMLImageElement;
    const next = this.c().img2;
    if (next && el.src !== next) el.src = next;
    else el.style.display = 'none';
  }
}
