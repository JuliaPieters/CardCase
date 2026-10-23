import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AuthService } from '../core/auth';
import { FriendsService, randomCode } from '../core/friends';
import { CardcaseStore, copyText, shareUrl } from '../core/store';
import { Switch } from '../shared/bits';

/** Who can see a binder: friends (a setting per binder) and anyone with its link (no account needed). */
@Component({
  selector: 'cc-share',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Switch],
  template: `
    @if (b(); as b) {
      <div data-keep-sel (click)="close()" class="fixed inset-0 z-[70] bg-[rgba(0,0,0,.5)] flex items-center justify-center p-4">
        <div
          (click)="$event.stopPropagation()"
          class="w-full max-w-[460px] max-h-[calc(92vh/var(--z))] overflow-auto bg-bg text-ink border-2 border-line rounded-2xl shadow-[6px_6px_0_var(--line)] p-[18px] flex flex-col gap-4"
        >
          <div class="flex items-center justify-between gap-[10px]">
            <div class="min-w-0">
              <div class="font-pixel text-[12px] leading-none text-muted tracking-[.08em]">DELEN</div>
              <div class="text-[20px] font-black mt-1 truncate">{{ b.name }}</div>
            </div>
            <button (click)="close()" class="chip bg-surface text-ink">Sluiten</button>
          </div>
          @if (!auth.user()) {
            <p class="m-0 font-bold text-muted text-pretty">Log in om binders met vrienden of via een link te delen.</p>
            <button (click)="store.setState({ shareB: null, authPanel: 'login' })" class="btn self-start"><span class="icon text-[19px]">login</span>Inloggen</button>
          } @else {
            <button (click)="toggle('friends')" class="flex items-center gap-3 bg-transparent border-0 p-0 text-left">
              <cc-switch [on]="!!b.friends" />
              <span class="flex-1 min-w-0 flex flex-col gap-[3px]">
                <span class="font-extrabold text-[15px]">Zichtbaar voor vrienden</span>
                <span class="text-[12.5px] font-bold text-muted text-pretty">Je vrienden zien deze binder bij je collectie.</span>
              </span>
            </button>
            <button (click)="toggle('link')" class="flex items-center gap-3 bg-transparent border-0 p-0 text-left">
              <cc-switch [on]="!!b.shareId" />
              <span class="flex-1 min-w-0 flex flex-col gap-[3px]">
                <span class="font-extrabold text-[15px]">Delen via link</span>
                <span class="text-[12.5px] font-bold text-muted text-pretty">Iedereen met de link kan alleen deze binder bekijken, ook zonder account.</span>
              </span>
            </button>
            @if (b.shareId) {
              <div class="flex items-center bg-surface border-2 border-line rounded-[10px] overflow-hidden">
                <span class="flex-1 min-w-0 px-[10px] py-[10px] font-mono text-[12px] leading-none truncate">{{ link() }}</span>
                <button (click)="copy()" class="flex items-center gap-[5px] border-0 border-l-2 border-line bg-lcd text-lcd-ink px-[12px] py-[10px] font-black text-[13px]">
                  <span class="icon text-[17px]">{{ canShare ? 'ios_share' : 'link' }}</span>{{ canShare ? 'Deel' : 'Kopieer' }}
                </button>
              </div>
              <p class="m-0 text-[12px] font-bold text-muted text-pretty">Zet je delen via link uit, dan werkt de link niet meer. Zet je het later weer aan, dan krijgt de binder een nieuwe link.</p>
            }
            @if (!friends.profile()) {
              <p class="m-0 text-[12.5px] font-bold text-muted text-pretty">Kies eerst een gebruikersnaam, dan kunnen vrienden je vinden.</p>
            }
          }
        </div>
      </div>
    }
  `,
})
export class ShareSheet {
  protected readonly store = inject(CardcaseStore);
  protected readonly auth = inject(AuthService);
  protected readonly friends = inject(FriendsService);
  protected readonly canShare = typeof navigator !== 'undefined' && !!navigator.share;
  protected readonly b = computed(() => {
    const id = this.store.state.shareB;
    return id ? (this.store.state.binders.find((x: any) => x.id === id) ?? null) : null;
  });
  protected readonly link = computed(() => {
    const id = this.b()?.shareId;
    return id ? shareUrl(id) : '';
  });

  protected close() {
    this.store.setState({ shareB: null });
  }

  protected toggle(what: 'friends' | 'link') {
    const b = this.b();
    if (!b) return;
    this.store.updB(b.id, (nb: any) =>
      what === 'friends' ? { ...nb, friends: !nb.friends } : { ...nb, shareId: nb.shareId ? null : randomCode(10) },
    );
  }

  protected async copy() {
    const url = this.link();
    if (this.canShare) await navigator.share({ title: this.b()?.name, url }).catch(() => {});
    else this.store.toast((await copyText(url)) ? 'Link gekopieerd' : url);
  }
}
