import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { CatalogService } from '../core/catalog';
import { eur } from '../core/data';
import { CardcaseStore } from '../core/store';
import { GAMES, gameInfo } from '../games/registry';
import type { Game } from '../games/types';

/**
 * The department switcher: the active department's mascot; opens a menu with the other departments you collect (cards
 * and value) and the ones you can add. Like switching workspaces: the app stays, the department changes.
 */
@Component({
  selector: 'cc-game-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative block' },
  template: `
    <button
      (click)="open.set(!open())"
      [title]="'Afdeling: ' + current().name"
      class="flex items-center gap-2 rounded-xl border-2 border-coal bg-paper shadow-[0_3px_0_var(--coal)] pr-2 pl-1 py-1 text-coal"
      [class.w-full]="wide()"
    >
      <img [src]="current().logos.mascot" alt="" class="w-8 h-9 flex-none" />
      @if (wide() || labeled()) {
        <span class="text-left font-extrabold text-[14px] leading-tight" [class.flex-1]="wide()">{{ current().name }}</span>
      }
      <span class="icon text-[20px]">{{ open() ? 'expand_less' : 'expand_more' }}</span>
    </button>
    @if (open()) {
      <div class="fixed inset-0 z-[60]" (click)="open.set(false)"></div>
      <div
        class="absolute z-[61] mt-2 panel p-2 flex flex-col gap-1 text-ink"
        [class]="wide() ? 'left-0 right-0' : 'right-0 w-[min(290px,calc(100vw-24px))]'"
      >
        <div class="kicker px-2 pt-1 pb-[6px]">AFDELINGEN</div>
        @for (g of mine(); track g.game) {
          <button (click)="go(g.game)" class="flex items-center gap-3 rounded-[10px] px-2 py-[7px] text-left hover:bg-soft" [class.bg-soft]="g.active">
            <img [src]="g.mascot" alt="" class="w-9 h-10 flex-none" />
            <span class="flex-1 min-w-0 flex flex-col gap-[2px]">
              <span class="font-extrabold text-[15px]">{{ g.name }}</span>
              <span class="text-[12px] font-bold text-muted">{{ g.stats }}</span>
            </span>
            @if (g.active) {
              <span class="icon text-[20px] text-red">check</span>
            }
          </button>
        }
        <button (click)="overview()" class="flex items-center gap-3 rounded-[10px] px-2 py-[9px] text-left hover:bg-soft font-extrabold text-[14px]">
          <span class="icon text-[22px] w-9 text-center">dashboard</span>Mijn Cardcase · alle afdelingen
        </button>
        @if (more().length) {
          <div class="kicker px-2 pt-2 pb-[6px] border-t-2 border-dashed border-soft mt-1">AFDELING TOEVOEGEN</div>
          @for (g of more(); track g.game) {
            <button (click)="go(g.game)" class="flex items-center gap-3 rounded-[10px] px-2 py-[7px] text-left hover:bg-soft">
              <img [src]="g.mascot" alt="" class="w-9 h-10 flex-none opacity-80" />
              <span class="flex-1 min-w-0 font-extrabold text-[15px]">{{ g.name }}</span>
              <span class="icon text-[20px] text-muted">add</span>
            </button>
          }
        }
      </div>
    }
  `,
})
export class GameSwitcher {
  /** In the sidebar: full width with the department's name. */
  readonly wide = input(false);
  /** Shows the department's name next to the mascot. */
  readonly labeled = input(false);
  protected readonly open = signal(false);
  private readonly store = inject(CardcaseStore);
  private readonly game = inject(CatalogService).game;
  protected readonly current = computed(() => gameInfo(this.game()));

  private readonly rows = computed(() => {
    const st = this.store.state;
    const active = this.game();
    const v = this.store.vals();
    const chosen: string[] = st.games?.length ? st.games : [active];
    return GAMES.filter((g) => g.enabled).map((g) => {
      const sum = g.game === active ? { cards: v.totalCards, value: null } : st.summary?.[g.game];
      const stats = sum ? `${sum.cards} kaarten · ${g.game === active ? v.vTotal : eur(sum.value)}` : 'Nog leeg';
      return { game: g.game, name: g.name, mascot: g.logos.mascot, active: g.game === active, mine: chosen.includes(g.game) || g.game === active, stats };
    });
  });
  protected readonly mine = computed(() => this.rows().filter((r) => r.mine));
  protected readonly more = computed(() => this.rows().filter((r) => !r.mine));

  protected overview() {
    this.open.set(false);
    this.store.go('overview');
  }

  /** Another department loads its own catalog: save what is pending, then open it. */
  protected go(game: Game) {
    this.open.set(false);
    if (game === this.game()) return;
    this.store.switchGame(game);
  }
}
