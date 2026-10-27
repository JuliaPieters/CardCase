import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CatalogService } from '../core/catalog';
import { eur } from '../core/data';
import { CardcaseStore } from '../core/store';
import { GAMES } from '../games/registry';
import type { Game } from '../games/types';

/** "Wat verzamel jij?": pick one or more departments; the first one opens. Shown until someone has chosen. */
@Component({
  selector: 'cc-onboarding',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-6 max-w-[760px] mx-auto">
      <div class="flex flex-col gap-2">
        <div class="kicker">WELKOM BIJ CARDCASE</div>
        <h1 class="m-0 text-[clamp(26px,4vw,38px)] font-black leading-[1.1]">Wat verzamel jij?</h1>
        <p class="m-0 text-[15px] font-bold text-muted text-pretty">
          Kies een of meer kaartspellen. Elk spel krijgt een eigen afdeling met een eigen sfeer; je
          collectie en account blijven één geheel. Later toevoegen kan altijd.
        </p>
      </div>
      <div class="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-4">
        @for (g of games; track g.game) {
          <button
            [disabled]="!g.enabled"
            (click)="toggle(g.game)"
            class="relative press-xy panel p-4 flex items-center gap-4 text-left"
            [style.outline]="picked().includes(g.game) ? '3px solid var(--red)' : 'none'"
            [class.opacity-60]="!g.enabled"
            [class.pointer-events-none]="!g.enabled"
            [attr.aria-pressed]="picked().includes(g.game)"
          >
            <img [src]="g.logos.mascot" alt="" class="w-14 h-16 flex-none" />
            <span class="flex-1 min-w-0 font-black text-[18px]">{{ g.name }}</span>
            @if (!g.enabled) {
              <span
                class="absolute -top-[11px] right-3 font-pixel text-[11px] leading-none tracking-[.08em] bg-surface border-2 border-line rounded-md px-2 py-[5px]"
                >BINNENKORT</span
              >
            } @else {
              <span class="icon text-[26px]" [class.text-red]="picked().includes(g.game)">{{
                picked().includes(g.game) ? 'check_circle' : 'radio_button_unchecked'
              }}</span>
            }
          </button>
        }
      </div>
      <button
        (click)="done()"
        [disabled]="!picked().length"
        class="press self-start flex items-center gap-[10px] bg-red text-cream border-2 border-line rounded-xl shadow-[0_5px_0_var(--line)] py-[13px] px-5 font-pixel font-semibold text-[18px] leading-none disabled:opacity-50"
      >
        Verder<span class="icon text-[22px]">arrow_forward</span>
      </button>
    </div>
  `,
})
export class OnboardingScreen {
  private readonly store = inject(CardcaseStore);
  private readonly game = inject(CatalogService).game;
  /** Every department; the ones not built yet show as "binnenkort". */
  protected readonly games = GAMES;
  /** Starts with the departments you already have (when adding one). */
  protected readonly picked = signal<Game[]>([...(this.store.state.games || [])]);

  protected toggle(g: Game) {
    this.picked.update((l) => (l.includes(g) ? l.filter((x) => x !== g) : [...l, g]));
  }

  protected done() {
    const games = this.picked();
    const before: string[] = this.store.state.games || [];
    this.store.setState({ games });
    // Open the department just added, else the first one.
    const next = games.find((g) => !before.includes(g)) || games[0];
    if (next === this.game()) this.store.go('home');
    else this.store.switchGame(next);
  }
}

/** "Mijn Cardcase": the whole collection over every department, and a tile per department to open it. */
@Component({
  selector: 'cc-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let o = model();
    <div class="flex flex-col gap-6">
      <div class="flex flex-col gap-[6px]">
        <div class="kicker">MIJN CARDCASE</div>
        <h1 class="m-0 text-[clamp(26px,4vw,38px)] font-black leading-[1.1]">Al je kaartspellen</h1>
      </div>
      <div class="panel p-5 flex flex-wrap items-end gap-x-8 gap-y-4">
        <div class="flex flex-col gap-[6px]">
          <div class="kicker">TOTALE WAARDE</div>
          <div class="font-pixel font-bold text-[44px] leading-none">{{ o.value }}</div>
          <div class="text-[13px] font-extrabold text-muted">
            {{ o.cards }} kaarten in {{ o.tiles.length }}
            {{ o.tiles.length === 1 ? 'afdeling' : 'afdelingen' }}
          </div>
        </div>
        <div class="flex-[1_1_240px] flex flex-col gap-2 min-w-0">
          @for (t of o.tiles; track t.game) {
            <div class="flex items-center gap-2 text-[13px] font-extrabold">
              <span class="w-20 flex-none truncate">{{ t.name }}</span>
              <div class="flex-1 h-3 rounded-full bg-soft border-2 border-line overflow-hidden">
                <div class="h-full bg-red" [style.width.%]="t.share"></div>
              </div>
              <span class="w-20 text-right flex-none">{{ t.valueLabel }}</span>
            </div>
          }
        </div>
      </div>
      <div class="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-4">
        @for (t of o.tiles; track t.game) {
          <button
            (click)="open(t.game)"
            class="press-xy panel p-4 flex items-center gap-4 text-left"
            [attr.data-game]="t.game"
          >
            <img [src]="t.mascot" alt="" class="w-14 h-16 flex-none" />
            <span class="flex-1 min-w-0 flex flex-col gap-1">
              <span class="font-black text-[18px]">{{ t.name }}</span>
              <span class="text-[13px] font-bold text-muted"
                >{{ t.cards }} kaarten · {{ t.valueLabel }}</span
              >
            </span>
            <span class="icon text-[22px] text-muted">{{
              t.active ? 'check' : 'chevron_right'
            }}</span>
          </button>
        }
        @if (o.more.length) {
          <button
            (click)="store.go('onboarding')"
            class="press-xy panel p-4 flex items-center gap-4 text-left border-dashed"
          >
            <span class="icon text-[34px] text-muted">add_circle</span>
            <span class="font-black text-[16px]">Afdeling toevoegen</span>
          </button>
        }
      </div>
    </div>
  `,
})
export class OverviewScreen {
  protected readonly store = inject(CardcaseStore);
  private readonly game = inject(CatalogService).game;

  protected readonly model = computed(() => {
    const st = this.store.state;
    const v = this.store.vals();
    const active = this.game();
    const chosen: string[] = st.games?.length ? st.games : [active];
    const rows = GAMES.filter(
      (g) => g.enabled && (chosen.includes(g.game) || g.game === active),
    ).map((g) => {
      const sum =
        g.game === active
          ? { cards: v.totalCards, value: v.totalValue }
          : st.summary?.[g.game] || { cards: 0, value: 0 };
      return {
        game: g.game,
        name: g.name,
        mascot: g.logos.mascot,
        cards: sum.cards,
        value: sum.value || 0,
        active: g.game === active,
      };
    });
    const total = rows.reduce((a, r) => a + r.value, 0);
    return {
      value: eur(total),
      cards: rows.reduce((a, r) => a + r.cards, 0),
      tiles: rows.map((r) => ({
        ...r,
        valueLabel: eur(r.value),
        share: total ? Math.round((r.value / total) * 100) : 0,
      })),
      more: GAMES.filter((g) => g.enabled && !rows.some((r) => r.game === g.game)),
    };
  });

  protected open(game: Game) {
    if (game === this.game()) this.store.go('home');
    else this.store.switchGame(game);
  }
}
