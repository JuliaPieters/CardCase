import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { AuthService, authErrorMessage } from '../core/auth';
import { CARDS, eur, tot } from '../core/data';
import { FriendData, Friendship, FriendsService, Profile } from '../core/friends';
import { binderFromSaved, ownedFromSaved } from '../core/persist';
import { CardcaseStore, copyText } from '../core/store';
import { Card } from '../shared/card';

const PAGE = 60;

/** Friends: your profile and invite link, finding people by username, requests, and a friend's collection and binders. */
@Component({
  selector: 'cc-friends',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card],
  template: `
    @if (!auth.enabled || !auth.user()) {
      <div class="flex flex-col gap-[18px] max-w-[640px]">
        <h1 class="m-0 font-pixel font-semibold text-[30px] leading-[1.1]">Vrienden</h1>
        <div class="panel p-[18px] flex flex-col gap-3">
          <p class="m-0 font-bold text-muted text-pretty">Met een account kun je vrienden toevoegen, elkaars collectie bekijken en binders delen.</p>
          @if (auth.enabled) {
            <button (click)="store.setState({ authPanel: 'login' })" class="btn self-start"><span class="icon text-[19px]">login</span>Inloggen</button>
          }
        </div>
      </div>
    } @else if (store.state.screen === 'friend') {
      @let f = friend();
      <div class="flex flex-col gap-[18px]">
        <div class="flex items-center gap-3">
          <button (click)="store.go('friends')" title="Terug" class="btn-icon"><span class="icon text-[20px]">arrow_back</span></button>
          <div class="flex-1 flex flex-col gap-[3px] min-w-0">
            <div class="kicker">VRIEND · &#64;{{ f?.profile?.username }}</div>
            <h1 class="m-0 text-[clamp(22px,3.4vw,28px)] font-black leading-[1.15] truncate">{{ f?.profile?.name || 'Vriend' }}</h1>
          </div>
          @if (f) {
            <div class="relative flex-none">
              <button (click)="menu.set(!menu())" title="Meer" class="btn-icon"><span class="icon text-[20px]">more_vert</span></button>
              @if (menu()) {
                <div class="fixed inset-0 z-[40]" (click)="menu.set(false); confirmRemove.set(null)"></div>
                <div class="absolute right-0 top-[calc(100%+6px)] z-[41] w-max bg-surface border-2 border-line rounded-xl shadow-[4px_4px_0_var(--line)] p-[6px] flex flex-col">
                  <button (click)="remove(f)" class="flex items-center gap-2 bg-transparent border-0 rounded-lg px-3 py-[10px] font-extrabold text-[14px] text-red text-left hover:bg-soft">
                    <span class="icon text-[19px]">person_remove</span>{{ confirmRemove() === f.id ? 'Zeker weten? Klik nog een keer' : 'Verwijder als vriend' }}
                  </button>
                </div>
              }
            </div>
          }
        </div>
        @if (loading()) {
          <div class="panel p-[18px] font-bold text-muted">Collectie laden…</div>
        } @else if (!data()) {
          <div class="panel p-[18px] font-bold text-muted text-pretty">{{ f?.profile?.name || 'Deze vriend' }} deelt nog niets. Dat gebeurt vanzelf zodra die de app weer opent.</div>
        } @else {
          <div class="self-start grid grid-cols-2 gap-[2px] bg-line border-2 border-line rounded-[10px] overflow-hidden">
            @for (t of tabs; track t.key) {
              <button
                (click)="tab.set(t.key)"
                class="border-0 py-[9px] px-[18px] font-pixel font-semibold text-[15px] leading-none flex items-center justify-center gap-2"
                [class]="tab() === t.key ? 'bg-red text-cream' : 'bg-surface text-ink'"
              >
                {{ t.label }}<span class="font-sans font-extrabold text-[12px] opacity-80">{{ t.key === 'binders' ? binders().length : cards().length }}</span>
              </button>
            }
          </div>
          @if (tab() === 'binders') {
            @if (!binders().length) {
              <div class="text-[14px] font-bold text-muted">{{ f?.profile?.name || 'Deze vriend' }} deelt nog geen binders met vrienden.</div>
            }
            <div class="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
              @for (b of binders(); track b.id) {
                <button (click)="openBinder(b)" class="lift panel flex items-center gap-3 p-3 text-left min-w-0">
                  <span class="w-[22px] h-[30px] flex-none rounded-[4px] border-2 border-line" [style.background]="b.cover"></span>
                  <span class="flex-1 min-w-0 flex flex-col gap-1">
                    <span class="font-black text-[15px] truncate">{{ b.name }}</span>
                    <span class="text-[12px] font-bold text-muted">{{ b.fmt }}-pocket · {{ b.pages }} pagina's</span>
                  </span>
                  <span class="icon text-[20px] text-muted">visibility</span>
                </button>
              }
            </div>
          } @else {
            <div class="font-extrabold text-muted">{{ cards().length }} kaarten · {{ value() }}</div>
            <div class="grid grid-cols-[repeat(auto-fill,minmax(clamp(108px,9vw,170px),1fr))] gap-x-[14px] gap-y-[18px]">
              @for (r of shown(); track r.key) {
                <button (click)="store.openDetail(r.key, null)" class="lift flex flex-col gap-[6px] bg-transparent border-0 p-0 text-left min-w-0">
                  <div class="aspect-[63/88] w-full rounded-lg shadow-[3px_3px_0_var(--line)]"><cc-card [card]="r.cv" /></div>
                  <div class="flex justify-between gap-[6px] text-[12px] font-extrabold">
                    <span class="overflow-hidden text-ellipsis whitespace-nowrap">{{ r.name }}</span><span class="font-pixel font-normal flex-none">×{{ r.n }}</span>
                  </div>
                </button>
              }
            </div>
            @if (shown().length < cards().length) {
              <button (click)="limit.set(limit() + 60)" class="btn self-center"><span class="icon text-[19px]">expand_more</span>Toon meer</button>
            }
          }
        }
      </div>
    } @else {
      @let p = friends.profile();
      <div class="flex flex-col gap-[18px] max-w-[760px]">
        <h1 class="m-0 font-pixel font-semibold text-[30px] leading-[1.1]">Vrienden</h1>

        <div class="panel p-4 flex flex-col gap-3">
          <div class="font-black text-[16px]">Nodig iemand uit</div>
          <p class="m-0 text-[13.5px] font-bold text-muted text-pretty">
            Wie deze link opent en inlogt, is meteen je vriend.
            @if (p) {
              Of laat ze zoeken op <span class="text-ink">&#64;{{ p.username }}</span>.
            }
          </p>
          <div class="flex flex-wrap gap-2">
            <button (click)="invite()" [disabled]="!p" class="press-sm flex items-center gap-2 bg-red text-cream border-2 border-line rounded-xl shadow-[0_4px_0_var(--line)] px-4 py-[11px] font-black text-[15px] disabled:opacity-50">
              <span class="icon text-[20px]">{{ canShare ? 'ios_share' : 'link' }}</span>{{ canShare ? 'Deel uitnodigingslink' : 'Kopieer uitnodigingslink' }}
            </button>
          </div>
        </div>

        <div class="panel p-4 flex flex-col gap-3">
          <div class="font-black text-[16px]">Zoek op gebruikersnaam</div>
          <input
            class="border-2 border-line rounded-[10px] bg-surface px-3 py-[10px] font-extrabold text-[16px] outline-none focus:shadow-[0_0_0_3px_var(--display)]"
            placeholder="@gebruikersnaam"
            autocapitalize="off"
            autocomplete="off"
            spellcheck="false"
            [value]="q()"
            (input)="onSearch($event)"
          />
          @for (r of results(); track r.uid) {
            <div class="flex items-center gap-3">
              <div class="flex-1 min-w-0">
                <div class="font-black text-[15px] truncate">{{ r.name }}</div>
                <div class="text-[12.5px] font-bold text-muted truncate">&#64;{{ r.username }}</div>
              </div>
              @switch (relation(r.uid)) {
                @case ('friend') {
                  <span class="text-[13px] font-extrabold text-muted">Vrienden</span>
                }
                @case ('sent') {
                  <span class="text-[13px] font-extrabold text-muted">Verzoek verstuurd</span>
                }
                @case ('received') {
                  <button (click)="request(r)" class="btn"><span class="icon text-[19px]">check</span>Accepteer</button>
                }
                @default {
                  <button (click)="request(r)" class="btn"><span class="icon text-[19px]">person_add</span>Toevoegen</button>
                }
              }
            </div>
          }
          @if (q().trim().length >= 2 && !searching() && !results().length) {
            <div class="text-[13.5px] font-bold text-muted">Niemand gevonden met die gebruikersnaam.</div>
          }
        </div>

        @if (incoming().length) {
          <div class="panel p-4 flex flex-col gap-3">
            <div class="font-black text-[16px]">Vriendschapsverzoeken</div>
            @for (f of incoming(); track f.id) {
              <div class="flex flex-wrap items-center gap-3">
                <div class="flex-1 min-w-0">
                  <div class="font-black text-[15px] truncate">{{ f.profile?.name || 'Onbekend' }}</div>
                  <div class="text-[12.5px] font-bold text-muted truncate">&#64;{{ f.profile?.username }}</div>
                </div>
                <button (click)="act(friends.accept(f), 'Jullie zijn nu vrienden')" class="btn"><span class="icon text-[19px]">check</span>Accepteer</button>
                <button (click)="act(friends.remove(f), 'Verzoek geweigerd')" class="btn"><span class="icon text-[19px]">close</span>Weiger</button>
              </div>
            }
          </div>
        }

        <div class="flex flex-col gap-[10px]">
          <div class="flex items-baseline gap-3">
            <h2 class="m-0 text-[20px] font-black">Je vrienden</h2>
            <span class="font-extrabold text-muted">{{ accepted().length }}</span>
          </div>
          @if (!accepted().length) {
            <div class="text-[14px] font-bold text-muted">Nog geen vrienden. Deel je uitnodigingslink of zoek iemand op gebruikersnaam.</div>
          }
          <div class="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
            @for (f of accepted(); track f.id) {
              <button (click)="store.go('friend', { friendId: f.other })" class="lift panel flex items-center gap-3 p-3 text-left min-w-0">
                <span class="w-10 h-10 flex-none rounded-full bg-device border-2 border-line flex items-center justify-center font-pixel font-semibold text-[17px] text-lcd">
                  {{ (f.profile?.name || '?').charAt(0).toUpperCase() }}
                </span>
                <span class="flex-1 min-w-0 flex flex-col gap-1">
                  <span class="font-black text-[15px] truncate">{{ f.profile?.name || 'Onbekend' }}</span>
                  <span class="text-[12px] font-bold text-muted truncate">&#64;{{ f.profile?.username }}</span>
                </span>
                <span class="icon text-[20px] text-muted">chevron_right</span>
              </button>
            }
          </div>
        </div>

        @if (outgoing().length) {
          <div class="flex flex-col gap-2">
            <div class="font-black text-[15px] text-muted">Wacht op antwoord</div>
            @for (f of outgoing(); track f.id) {
              <div class="flex items-center gap-3">
                <span class="flex-1 min-w-0 font-bold truncate">{{ f.profile?.name }} · &#64;{{ f.profile?.username }}</span>
                <button (click)="act(friends.remove(f), 'Verzoek ingetrokken')" class="bg-transparent border-0 text-red font-extrabold text-[13px]">Intrekken</button>
              </div>
            }
          </div>
        }
      </div>
    }
  `,
})
export class FriendsScreen {
  protected readonly store = inject(CardcaseStore);
  protected readonly auth = inject(AuthService);
  protected readonly friends = inject(FriendsService);
  protected readonly canShare = typeof navigator !== 'undefined' && !!navigator.share;

  protected readonly accepted = computed(() => this.friends.friendships().filter((f) => f.status === 'accepted'));
  protected readonly incoming = computed(() => this.friends.friendships().filter((f) => f.status === 'pending' && f.incoming));
  protected readonly outgoing = computed(() => this.friends.friendships().filter((f) => f.status === 'pending' && !f.incoming));

  protected readonly q = signal('');
  protected readonly results = signal<Profile[]>([]);
  protected readonly searching = signal(false);
  private searchT: ReturnType<typeof setTimeout> | undefined;

  // A friend's page.
  protected readonly friend = computed(() => this.friends.friendships().find((f) => f.other === this.store.state.friendId && f.status === 'accepted') ?? null);
  protected readonly data = signal<FriendData | null>(null);
  protected readonly loading = signal(false);
  protected readonly limit = signal(PAGE);
  protected readonly confirmRemove = signal<string | null>(null);
  protected readonly menu = signal(false);
  protected readonly tabs = [
    { key: 'binders', label: 'Binders' },
    { key: 'collection', label: 'Collectie' },
  ] as const;
  protected readonly tab = signal<'binders' | 'collection'>('binders');
  private readonly owned = computed(() => ownedFromSaved(this.data()?.owned));
  protected readonly binders = computed(() => (this.data()?.binders || []).map(binderFromSaved));
  protected readonly cards = computed(() => {
    const owned = this.owned();
    return CARDS.filter((c) => tot(owned[c.id]) > 0);
  });
  protected readonly value = computed(() => eur(this.cards().reduce((a, c) => a + (c.trend || 0) * tot(this.owned()[c.id]), 0)));
  protected readonly shown = computed(() =>
    this.cards()
      .slice(0, this.limit())
      .map((c) => ({ key: c.id, n: tot(this.owned()[c.id]), name: c.names.EN || c.names[c.avail[0]], cv: this.store.cv(c, 'EN', false) })),
  );

  constructor() {
    effect(() => {
      const id = this.store.state.screen === 'friend' ? this.store.state.friendId : null;
      untracked(() => this.loadFriend(id));
    });
  }

  private loaded: string | null = null;
  private async loadFriend(uid: string | null) {
    if (uid === this.loaded) return;
    this.loaded = uid;
    this.data.set(null);
    this.limit.set(PAGE);
    this.confirmRemove.set(null);
    this.menu.set(false);
    this.tab.set('binders');
    if (!uid) return;
    this.loading.set(true);
    try {
      const d = await this.friends.friendData(uid);
      if (this.loaded === uid) this.data.set(d);
    } catch (err) {
      console.warn('[friends]', err);
      if (this.loaded === uid) this.store.toast('Kon de collectie niet laden · ' + authErrorMessage(err));
    } finally {
      if (this.loaded === uid) this.loading.set(false);
    }
  }

  protected openBinder(b: any) {
    const f = this.friend();
    this.friends.loadImages([b]).catch((err) => console.warn('[friends]', err));
    this.store.openForeign({ binder: b, owned: this.owned(), by: f?.profile?.name || '' }, { screen: 'friend', extra: { friendId: f?.other } });
  }

  protected relation(uid: string): 'friend' | 'sent' | 'received' | null {
    const f = this.friends.friendships().find((x) => x.other === uid);
    if (!f) return null;
    return f.status === 'accepted' ? 'friend' : f.incoming ? 'received' : 'sent';
  }

  protected onSearch(e: Event) {
    const q = (e.target as HTMLInputElement).value;
    this.q.set(q);
    clearTimeout(this.searchT);
    if (q.trim().length < 2) {
      this.results.set([]);
      return;
    }
    this.searching.set(true);
    this.searchT = setTimeout(async () => {
      try {
        const r = await this.friends.search(q);
        if (this.q() === q) this.results.set(r);
      } catch (err) {
        console.warn('[friends]', err);
      } finally {
        if (this.q() === q) this.searching.set(false);
      }
    }, 300);
  }

  protected request(p: Profile) {
    const received = this.relation(p.uid) === 'received';
    this.act(this.friends.request(p.uid), received ? 'Jullie zijn nu vrienden' : 'Verzoek verstuurd naar ' + p.name);
  }

  protected remove(f: Friendship) {
    if (this.confirmRemove() !== f.id) {
      this.confirmRemove.set(f.id);
      return;
    }
    this.act(this.friends.remove(f), (f.profile?.name || 'Vriend') + ' is geen vriend meer').then(() => this.store.go('friends'));
  }

  protected async invite() {
    try {
      const url = await this.friends.inviteLink();
      const name = this.friends.profile()?.name;
      if (this.canShare) {
        await navigator.share({ title: 'CardCase', text: (name ? name + ' nodigt je uit' : 'Word vrienden') + ' op CardCase', url }).catch(() => {});
      } else this.store.toast((await copyText(url)) ? 'Uitnodigingslink gekopieerd' : url);
    } catch (err) {
      this.store.toast('Kon geen uitnodiging maken · ' + authErrorMessage(err));
    }
  }

  protected act(p: Promise<unknown>, done: string) {
    return p.then(
      () => this.store.toast(done),
      (err) => this.store.toast('Mislukt · ' + authErrorMessage(err)),
    );
  }
}
