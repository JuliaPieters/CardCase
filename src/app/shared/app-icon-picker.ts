import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CardcaseStore } from '../core/store';
import { APP_ICONS } from '../games/chrome';
import { GAMES } from '../games/registry';
import type { Game } from '../games/types';

/** The home-screen icon to install the app with: the ones made so far, then the other departments as "binnenkort". */
@Component({
  selector: 'cc-app-icon-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-2">
      <div class="kicker">APP-ICOON</div>
      <div class="grid grid-cols-4 gap-2">
        @for (i of icons(); track i.game) {
          <button
            [disabled]="!i.ready"
            (click)="pick(i.game)"
            class="press-xy flex flex-col items-center gap-[6px] text-center"
            [class.opacity-50]="!i.ready"
            [class.pointer-events-none]="!i.ready"
            [attr.aria-pressed]="i.picked"
            [attr.aria-label]="i.ready ? 'App-icoon ' + i.name : i.name + ' · binnenkort'"
          >
            @if (i.ready) {
              <img [src]="i.src" alt="" class="w-14 h-14 rounded-[13px]" [style.outline]="i.picked ? '3px solid var(--red)' : 'none'" [style.outline-offset.px]="3" />
            } @else {
              <span class="w-14 h-14 rounded-[13px] border-2 border-dashed border-line flex items-center justify-center">
                <img [src]="i.mascot" alt="" class="w-8 h-9" />
              </span>
            }
            <span class="text-[11px] font-extrabold leading-tight">{{ i.ready ? i.label : 'Binnenkort' }}</span>
          </button>
        }
      </div>
      <p class="m-0 text-[12px] font-bold text-muted text-pretty">
        Geldt bij het installeren. Al geïnstalleerd? Verwijder de app en voeg hem opnieuw toe.
      </p>
    </div>
  `,
})
export class AppIconPicker {
  private readonly store = inject(CardcaseStore);

  protected readonly icons = computed(() => {
    const picked = APP_ICONS.find((g) => g === this.store.state.appIcon) ?? APP_ICONS[0];
    return [...GAMES]
      .sort((a, b) => +!APP_ICONS.includes(a.game) - +!APP_ICONS.includes(b.game))
      .map((g) => ({
        game: g.game,
        name: g.name,
        label: g.name.split(':')[0],
        mascot: g.logos.mascot,
        src: `icons/${g.game}/icon-192.png`,
        ready: APP_ICONS.includes(g.game),
        picked: g.game === picked,
      }));
  });

  protected pick(game: Game) {
    this.store.setState({ appIcon: game });
  }
}
