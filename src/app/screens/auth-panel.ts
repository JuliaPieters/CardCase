import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AuthService, authErrorMessage } from '../core/auth';
import { FriendsService, USERNAME } from '../core/friends';
import { lastAccount } from '../core/persist';
import { CardcaseStore } from '../core/store';
import { Leds } from '../shared/bits';

type Mode = 'login' | 'register' | 'reset' | 'account' | 'profile';

const GUEST_KEY = 'cc-guest';

/**
 * Account overlay: log in, create an account, reset a password, account details and the first-login import question.
 * Someone who is neither logged in nor chose to continue as guest gets it as a full-screen welcome page instead.
 */
@Component({
  selector: 'cc-auth-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Leds],
  template: `
    @let gate = welcome();
    @let mode = needsProfile() ? 'profile' : store.state.authPanel || (gate ? 'login' : null);
    @let offer = store.state.importOffer;
    @if (mode || offer) {
      <div
        class="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-5 p-4 overflow-auto"
        [class]="gate ? 'bg-bg pt-[calc(16px+env(safe-area-inset-top))] pb-[calc(16px+env(safe-area-inset-bottom))]' : 'bg-[rgba(0,0,0,.5)]'"
        (click)="close()"
      >
        @if (gate) {
          <img [src]="store.state.dark ? 'icons/logo-dark.png' : 'icons/logo-light.png'" alt="CardCase" class="w-[min(70vw,320px)] h-auto block" />
          <p class="m-0 -mt-2 max-w-[420px] text-center text-[15px] font-extrabold text-muted text-pretty">
            Log in of maak een account om je collectie en binders op al je apparaten bij te houden.
          </p>
        }
        <div
          [class.wide-form]="mode === 'register' && !offer"
          class="w-full max-w-[420px] max-h-[calc(92vh/var(--z))] overflow-auto bg-bg text-ink border-2 border-line rounded-2xl shadow-[6px_6px_0_var(--line)]"
          (click)="$event.stopPropagation()"
        >
          <div class="bg-red border-b-2 border-line px-4 py-3 flex items-center gap-3 rounded-t-[14px]">
            <cc-leds />
            <div class="ml-auto bg-device border-2 border-coal rounded-lg p-1">
              <div class="lcd rounded px-3 py-[6px] text-[14px] leading-none tracking-[.06em]">{{ title() }}</div>
            </div>
            @if (!offer && !gate && !needsProfile()) {
              <button (click)="close()" title="Sluiten" class="w-9 h-9 rounded-full bg-device text-[#F7F3E8] border-2 border-coal flex items-center justify-center">
                <span class="icon text-[20px]">close</span>
              </button>
            }
          </div>

          <div class="p-5 flex flex-col gap-4">
            @if (offer) {
              <h2 class="m-0 text-[22px] font-black leading-tight">Collectie meenemen?</h2>
              <p class="m-0 text-[14px] font-bold text-muted text-pretty">
                Op dit apparaat staat een collectie van {{ offer.count }} {{ offer.count === 1 ? 'kaart' : 'kaarten' }} die je als gast hebt gemaakt. Wil je die in je
                account zetten?
              </p>
              <button (click)="store.importGuest(true)" class="press flex items-center justify-center gap-2 bg-red text-cream border-2 border-line rounded-xl shadow-[0_5px_0_var(--line)] p-[13px] font-black text-[15px]">
                <span class="icon text-[20px]">cloud_upload</span>Ja, zet in mijn account
              </button>
              <button (click)="store.importGuest(false)" class="btn justify-center">Nee, begin leeg</button>
            } @else if (!auth.enabled) {
              <h2 class="m-0 text-[22px] font-black leading-tight">Inloggen staat nog uit</h2>
              <p class="m-0 text-[14px] font-bold text-muted text-pretty">
                Vul de Firebase-gegevens in <code class="font-mono text-[12px]">src/app/core/firebase.config.ts</code> in om accounts te gebruiken. Tot die tijd wordt je
                collectie in deze browser bewaard.
              </p>
            } @else if (mode === 'profile' && user()) {
              <h2 class="m-0 text-[22px] font-black leading-tight">{{ friends.profile() ? 'Je profiel' : 'Kies een gebruikersnaam' }}</h2>
              <p class="m-0 text-[14px] font-bold text-muted text-pretty">Hiermee kunnen vrienden je vinden. Je naam is wat ze van je zien.</p>
              <form class="flex flex-col gap-3" (submit)="$event.preventDefault(); saveProfile()">
                @if (friends.profile(); as p) {
                  <div class="flex flex-col gap-[6px]">
                    <span class="text-[13px] font-extrabold text-muted">Gebruikersnaam</span>
                    <div class="field opacity-70 flex items-center gap-2"><span class="icon text-[18px]">lock</span>&#64;{{ p.username }}</div>
                    <span class="text-[12px] font-bold text-muted">Je gebruikersnaam ligt vast.</span>
                  </div>
                } @else {
                  <label class="flex flex-col gap-[6px]">
                    <span class="text-[13px] font-extrabold text-muted">Gebruikersnaam</span>
                    <input class="field" autocapitalize="off" autocomplete="username" spellcheck="false" required [value]="username()" (input)="username.set(val($event).toLowerCase())" placeholder="bijv. pikachu_fan" />
                    <span class="text-[12px] font-bold text-muted">3 tot 20 tekens: letters, cijfers, _ of . · Kies goed: je kunt hem later niet meer wijzigen.</span>
                  </label>
                }
                <label class="flex flex-col gap-[6px]">
                  <span class="text-[13px] font-extrabold text-muted">Naam</span>
                  <input class="field" autocomplete="name" required maxlength="40" [value]="name()" (input)="name.set(val($event))" placeholder="Zoals vrienden je zien" />
                </label>
                @if (error()) {
                  <div class="flex items-start gap-2 bg-red text-cream border-2 border-line rounded-[9px] px-3 py-[9px] text-[13px] font-extrabold">
                    <span class="icon text-[18px]">error</span>{{ error() }}
                  </div>
                }
                <button
                  type="submit"
                  [disabled]="busy()"
                  class="press flex items-center justify-center gap-2 bg-red text-cream border-2 border-line rounded-xl shadow-[0_5px_0_var(--line)] p-[13px] font-black text-[15px] disabled:opacity-60"
                >
                  <span class="icon text-[20px]">badge</span>{{ busy() ? 'Even geduld…' : 'Opslaan' }}
                </button>
              </form>
            } @else if (mode === 'account' && user()) {
              <div class="flex items-center gap-3">
                <div class="w-14 h-14 flex-none rounded-full bg-device border-2 border-line shadow-[0_3px_0_var(--line)] flex items-center justify-center font-pixel font-semibold text-[22px] text-lcd">
                  {{ initial() }}
                </div>
                <div class="min-w-0">
                  <div class="text-[18px] font-black truncate">{{ user()!.displayName || 'Verzamelaar' }}</div>
                  <div class="text-[13px] font-bold text-muted truncate">{{ friends.profile() ? '@' + friends.profile()!.username + ' · ' : '' }}{{ user()!.email }}</div>
                </div>
              </div>
              <div class="bg-device border-2 border-line rounded-[9px] p-1">
                <div class="lcd rounded-[5px] px-3 py-[9px] text-[14px] leading-[1.3] flex items-center gap-2">
                  <span class="icon text-[18px]">{{ syncIcon() }}</span>{{ syncText() }}
                </div>
              </div>
              <button (click)="setMode('profile')" class="btn justify-center"><span class="icon text-[19px]">badge</span>Naam wijzigen</button>
              <button (click)="logout()" [disabled]="busy()" class="btn justify-center"><span class="icon text-[19px]">logout</span>Uitloggen</button>
            } @else {
              @if (mode !== 'reset') {
                <div class="grid grid-cols-2 gap-[2px] bg-line border-2 border-line rounded-[10px] overflow-hidden">
                  <button (click)="setMode('login')" class="border-0 py-[9px] font-pixel font-semibold text-[15px]" [class]="mode === 'login' ? 'bg-red text-cream' : 'bg-surface text-ink'">
                    Inloggen
                  </button>
                  <button (click)="setMode('register')" class="border-0 py-[9px] font-pixel font-semibold text-[15px]" [class]="mode === 'register' ? 'bg-red text-cream' : 'bg-surface text-ink'">
                    Account maken
                  </button>
                </div>
              } @else {
                <h2 class="m-0 text-[22px] font-black leading-tight">Wachtwoord vergeten</h2>
                <p class="m-0 text-[14px] font-bold text-muted">Je krijgt een mail met een link om een nieuw wachtwoord te kiezen.</p>
              }

              <form class="flex flex-col gap-3" (submit)="$event.preventDefault(); submit()">
                @if (mode === 'register') {
                  <label class="flex flex-col gap-[6px]">
                    <span class="text-[13px] font-extrabold text-muted">Naam</span>
                    <input class="field" autocomplete="name" required maxlength="40" [value]="name()" (input)="name.set(val($event))" placeholder="Zoals vrienden je zien" />
                  </label>
                  <label class="flex flex-col gap-[6px]">
                    <span class="text-[13px] font-extrabold text-muted">Gebruikersnaam</span>
                    <input class="field" autocapitalize="off" autocomplete="username" spellcheck="false" required [value]="username()" (input)="username.set(val($event).toLowerCase())" placeholder="bijv. pikachu_fan" />
                    <span class="text-[12px] font-bold text-muted">Hiermee vinden vrienden je · 3 tot 20 tekens: letters, cijfers, _ of . · Later niet te wijzigen.</span>
                  </label>
                }
                <label class="flex flex-col gap-[6px]">
                  <span class="text-[13px] font-extrabold text-muted">E-mailadres</span>
                  <input class="field" type="email" autocomplete="email" required [value]="email()" (input)="email.set(val($event))" />
                </label>
                @if (mode !== 'reset') {
                  <label class="flex flex-col gap-[6px]">
                    <span class="text-[13px] font-extrabold text-muted">Wachtwoord</span>
                    <input
                      class="field"
                      type="password"
                      required
                      minlength="6"
                      [attr.autocomplete]="mode === 'register' ? 'new-password' : 'current-password'"
                      [value]="password()"
                      (input)="password.set(val($event))"
                    />
                  </label>
                }
                @if (error()) {
                  <div class="full flex items-start gap-2 bg-red text-cream border-2 border-line rounded-[9px] px-3 py-[9px] text-[13px] font-extrabold">
                    <span class="icon text-[18px]">error</span>{{ error() }}
                  </div>
                }
                @if (info()) {
                  <div class="full bg-device border-2 border-line rounded-[9px] p-1">
                    <div class="lcd rounded-[5px] px-3 py-[9px] text-[13px] leading-[1.3]">{{ info() }}</div>
                  </div>
                }
                <button
                  type="submit"
                  [disabled]="busy()"
                  class="full press flex items-center justify-center gap-2 bg-red text-cream border-2 border-line rounded-xl shadow-[0_5px_0_var(--line)] p-[13px] font-black text-[15px] disabled:opacity-60"
                >
                  <span class="icon text-[20px]">{{ mode === 'register' ? 'person_add' : mode === 'reset' ? 'mail' : 'login' }}</span>
                  {{ busy() ? 'Even geduld…' : mode === 'register' ? 'Account maken' : mode === 'reset' ? 'Stuur resetlink' : 'Inloggen' }}
                </button>
              </form>

              @if (mode === 'login') {
                <button (click)="setMode('reset')" class="self-center bg-transparent border-0 text-red font-extrabold text-[13px]">Wachtwoord vergeten?</button>
              }
              @if (mode === 'reset') {
                <button (click)="setMode('login')" class="self-center bg-transparent border-0 text-red font-extrabold text-[13px]">← Terug naar inloggen</button>
              } @else if (!gate) {
                <p class="m-0 text-[12.5px] font-bold text-muted text-center text-pretty">Zonder account blijft je collectie alleen in deze browser bewaard.</p>
              }
            }
          </div>
        </div>
        @if (gate && !offer) {
          <div [class.wide-form]="mode === 'register'" class="w-full max-w-[420px] flex flex-col gap-2">
            <button (click)="continueAsGuest()" class="btn justify-center"><span class="icon text-[19px]">travel_explore</span>Doorgaan als gast</button>
            <p class="m-0 text-[12.5px] font-bold text-muted text-center text-pretty">
              Als gast kun je rondkijken; wat je toevoegt wordt niet in een account bewaard. Inloggen kan later altijd nog.
            </p>
          </div>
        }
      </div>
    }
  `,
  styles: `
    .field {
      border: 2px solid var(--line);
      border-radius: 10px;
      background: var(--surface);
      padding: 10px 12px;
      font-weight: 800;
      font-size: 16px;
      outline: none;
    }
    .field:focus {
      box-shadow: 0 0 0 3px #9bbc0f;
    }
    /* Creating an account: on a wide screen the panel is wider and the fields sit two by two, so nothing scrolls. */
    @media (min-width: 700px) {
      .wide-form.wide-form {
        max-width: 640px;
      }
      .wide-form form {
        display: grid;
        grid-template-columns: 1fr 1fr;
        align-items: start;
        column-gap: 14px;
      }
      .wide-form form > .full {
        grid-column: 1 / -1;
      }
    }
  `,
})
export class AuthPanel {
  protected readonly store = inject(CardcaseStore);
  protected readonly auth = inject(AuthService);
  protected readonly friends = inject(FriendsService);
  protected readonly user = this.auth.user;
  /** Logged in without a username yet: choosing one comes first (not while the import question is open). */
  protected readonly needsProfile = computed(() => !!this.user() && this.friends.profile() === null && !this.store.state.importOffer);
  protected readonly username = signal('');

  protected readonly name = signal('');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly busy = signal(false);
  /** Chose "continue as guest" on this device (remembered until logging out). */
  private readonly guest = signal(readGuest());
  /** Someone was logged in on this device last time: their session is probably restored once Firebase has loaded. */
  private readonly hadAccount = !!lastAccount();
  /**
   * Not logged in and no guest choice yet: show the welcome page. It doesn't wait for Firebase (which loads after the
   * app) when nobody was logged in here, so the app doesn't flash by before it.
   */
  protected readonly welcome = computed(
    () => this.auth.enabled && (this.auth.ready() || !this.hadAccount) && !this.user() && !this.guest() && !this.store.state.foreign && !this.store.state.linkLoading,
  );
  protected readonly error = signal('');
  protected readonly info = signal('');

  protected readonly initial = computed(() => (this.user()?.displayName || this.user()?.email || '?').charAt(0).toUpperCase());
  protected readonly title = computed(() => {
    if (this.store.state.importOffer) return 'WELKOM';
    const m = (this.store.state.authPanel || 'login') as Mode;
    if (this.needsProfile() || m === 'profile') return 'PROFIEL';
    return m === 'account' ? 'ACCOUNT' : m === 'register' ? 'NIEUW ACCOUNT' : m === 'reset' ? 'RESET' : 'INLOGGEN';
  });
  protected readonly syncText = computed(
    () =>
      ({
        guest: 'ALLEEN OP DIT APPARAAT',
        loading: 'COLLECTIE LADEN…',
        saving: 'OPSLAAN…',
        saved: 'OPGESLAGEN IN JE ACCOUNT',
        error: 'NIET OPGESLAGEN · GEEN VERBINDING?',
      })[this.auth.syncStatus()],
  );
  protected readonly syncIcon = computed(
    () => ({ guest: 'smartphone', loading: 'cloud_sync', saving: 'cloud_sync', saved: 'cloud_done', error: 'cloud_off' })[this.auth.syncStatus()],
  );

  protected val(e: Event) {
    return (e.target as HTMLInputElement).value;
  }

  protected setMode(mode: Mode) {
    this.error.set('');
    this.info.set('');
    if (mode === 'profile') {
      const p = this.friends.profile();
      this.username.set(p?.username ?? '');
      this.name.set(p?.name ?? this.user()?.displayName ?? '');
    }
    this.store.setState({ authPanel: mode });
  }

  protected close() {
    if (this.store.state.importOffer || this.welcome() || this.needsProfile()) return;
    this.store.setState({ authPanel: null });
  }

  protected continueAsGuest() {
    writeGuest(true);
    this.guest.set(true);
    this.store.setState({ authPanel: null });
  }

  protected async submit() {
    const mode = (this.store.state.authPanel || 'login') as Mode;
    await this.run(async () => {
      if (mode === 'reset') {
        await this.auth.resetPassword(this.email());
        this.info.set('RESETLINK VERSTUURD · CHECK JE MAIL');
        return;
      }
      if (mode === 'register') {
        const username = this.username().trim();
        if (!this.name().trim()) throw new Error('Vul je naam in.');
        if (!USERNAME.test(username)) throw new Error('Een gebruikersnaam heeft 3 tot 20 tekens: letters, cijfers, _ of .');
        if (!(await this.friends.usernameFree(username))) throw new Error('Die gebruikersnaam is al bezet.');
        await this.auth.register(this.name(), this.email(), this.password());
        await this.friends.whenProfileKnown();
        await this.friends.saveProfile(username, this.name()).catch(() => {});
      } else await this.auth.login(this.email(), this.password());
      this.password.set('');
      this.store.setState({ authPanel: null });
    });
  }

  protected logout() {
    return this.run(async () => {
      await this.store.flushSave();
      await this.auth.logout();
      // Back to the welcome page, as on a first visit.
      writeGuest(false);
      this.guest.set(false);
      this.store.setState({ authPanel: null });
    });
  }

  protected saveProfile() {
    return this.run(async () => {
      await this.friends.saveProfile(this.username(), this.name());
      this.store.setState({ authPanel: null });
    });
  }

  private async run(fn: () => Promise<void>) {
    this.busy.set(true);
    this.error.set('');
    this.info.set('');
    try {
      await fn();
    } catch (err) {
      this.error.set(authErrorMessage(err));
    } finally {
      this.busy.set(false);
    }
  }
}

function readGuest() {
  try {
    return localStorage.getItem(GUEST_KEY) === '1';
  } catch {
    return false;
  }
}

function writeGuest(on: boolean) {
  try {
    if (on) localStorage.setItem(GUEST_KEY, '1');
    else localStorage.removeItem(GUEST_KEY);
  } catch {}
}
