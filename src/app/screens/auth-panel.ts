import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AuthService, authErrorMessage } from '../core/auth';
import { CardcaseStore } from '../core/store';
import { Leds } from '../shared/bits';

type Mode = 'login' | 'register' | 'reset' | 'account';

/** Account overlay: log in, create an account, reset a password, account details and the first-login import question. */
@Component({
  selector: 'cc-auth-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Leds],
  template: `
    @let mode = store.state.authPanel;
    @let offer = store.state.importOffer;
    @if (mode || offer) {
      <div class="fixed inset-0 z-[80] bg-[rgba(0,0,0,.5)] flex items-center justify-center p-4" (click)="close()">
        <div
          class="w-full max-w-[420px] max-h-[92vh] overflow-auto bg-bg text-ink border-2 border-line rounded-2xl shadow-[6px_6px_0_var(--line)]"
          (click)="$event.stopPropagation()"
        >
          <div class="bg-red border-b-2 border-line px-4 py-3 flex items-center gap-3 rounded-t-[14px]">
            <cc-leds />
            <div class="ml-auto bg-device border-2 border-coal rounded-lg p-1">
              <div class="lcd rounded px-3 py-[6px] text-[14px] leading-none tracking-[.06em]">{{ title() }}</div>
            </div>
            @if (!offer) {
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
            } @else if (mode === 'account' && user()) {
              <div class="flex items-center gap-3">
                <div class="w-14 h-14 flex-none rounded-full bg-device border-2 border-line shadow-[0_3px_0_var(--line)] flex items-center justify-center font-pixel font-semibold text-[22px] text-lcd">
                  {{ initial() }}
                </div>
                <div class="min-w-0">
                  <div class="text-[18px] font-black truncate">{{ user()!.displayName || 'Verzamelaar' }}</div>
                  <div class="text-[13px] font-bold text-muted truncate">{{ user()!.email }}</div>
                </div>
              </div>
              <div class="bg-device border-2 border-line rounded-[9px] p-1">
                <div class="lcd rounded-[5px] px-3 py-[9px] text-[14px] leading-[1.3] flex items-center gap-2">
                  <span class="icon text-[18px]">{{ syncIcon() }}</span>{{ syncText() }}
                </div>
              </div>
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
                    <input class="field" autocomplete="name" [value]="name()" (input)="name.set(val($event))" placeholder="Hoe mogen we je noemen?" />
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
                  <div class="flex items-start gap-2 bg-red text-cream border-2 border-line rounded-[9px] px-3 py-[9px] text-[13px] font-extrabold">
                    <span class="icon text-[18px]">error</span>{{ error() }}
                  </div>
                }
                @if (info()) {
                  <div class="bg-device border-2 border-line rounded-[9px] p-1">
                    <div class="lcd rounded-[5px] px-3 py-[9px] text-[13px] leading-[1.3]">{{ info() }}</div>
                  </div>
                }
                <button
                  type="submit"
                  [disabled]="busy()"
                  class="press flex items-center justify-center gap-2 bg-red text-cream border-2 border-line rounded-xl shadow-[0_5px_0_var(--line)] p-[13px] font-black text-[15px] disabled:opacity-60"
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
              } @else {
                <p class="m-0 text-[12.5px] font-bold text-muted text-center text-pretty">Zonder account blijft je collectie alleen in deze browser bewaard.</p>
              }
            }
          </div>
        </div>
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
  `,
})
export class AuthPanel {
  protected readonly store = inject(CardcaseStore);
  protected readonly auth = inject(AuthService);
  protected readonly user = this.auth.user;

  protected readonly name = signal('');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly info = signal('');

  protected readonly initial = computed(() => (this.user()?.displayName || this.user()?.email || '?').charAt(0).toUpperCase());
  protected readonly title = computed(() => {
    if (this.store.state.importOffer) return 'WELKOM';
    const m = this.store.state.authPanel as Mode;
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
    this.store.setState({ authPanel: mode });
  }

  protected close() {
    if (this.store.state.importOffer) return;
    this.store.setState({ authPanel: null });
  }

  protected async submit() {
    const mode = this.store.state.authPanel as Mode;
    await this.run(async () => {
      if (mode === 'reset') {
        await this.auth.resetPassword(this.email());
        this.info.set('RESETLINK VERSTUURD · CHECK JE MAIL');
        return;
      }
      if (mode === 'register') await this.auth.register(this.name(), this.email(), this.password());
      else await this.auth.login(this.email(), this.password());
      this.password.set('');
      this.store.setState({ authPanel: null });
    });
  }

  protected logout() {
    return this.run(async () => {
      await this.auth.logout();
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
