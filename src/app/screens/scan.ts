import { afterNextRender, ChangeDetectionStrategy, Component, computed, ElementRef, inject, OnDestroy, signal, viewChild } from '@angular/core';
import { matchCards, type CardMatch } from '../core/card-match';
import { CardHashes } from '../core/card-hash';
import { CARD_RATIO, type CameraError, type ScanLang, ScannerService } from '../core/scanner';
import { CARDS } from '../core/data';
import { CardcaseStore } from '../core/store';
import { Card } from '../shared/card';
import { Led } from '../shared/bits';

/** Full-screen card scanner: reads name and collector number from the camera image and shows the best matches. */
@Component({
  selector: 'cc-scan',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, Led],
  template: `
    @let s = v();
    <div class="fixed inset-0 z-50 bg-[#0B0C0F] flex justify-center">
      <div class="relative w-full max-w-[520px] h-full flex flex-col overflow-hidden bg-[#14161B]">
        <div class="flex items-center gap-3 px-[14px] py-3 text-[#F7F3E8]">
          <button
            (click)="s.closeScan()"
            title="Sluiten"
            class="w-11 h-11 rounded-xl bg-[#2A2D35] text-[#F7F3E8] border-2 border-black shadow-[0_3px_0_#000] flex items-center justify-center"
          >
            <span class="icon text-[22px]">close</span>
          </button>
          <div class="flex flex-col gap-[3px]">
            <div class="font-pixel font-semibold text-[18px] leading-none tracking-[.06em]">SCANNER</div>
            <div class="flex gap-[3px]" role="radiogroup" aria-label="Taal van de kaarten">
              @for (l of langs; track l.key) {
                <button
                  (click)="setLang(l.key)"
                  role="radio"
                  [attr.aria-checked]="lang() === l.key"
                  class="border border-black rounded px-[6px] py-[3px] font-pixel text-[11px] leading-none"
                  [class]="lang() === l.key ? 'bg-lcd text-lcd-ink' : 'bg-[#2A2D35] text-[#A8A497]'"
                >
                  {{ l.label }}
                </button>
              }
            </div>
          </div>
          <div class="ml-auto grid grid-cols-2 gap-[2px] bg-black border-2 border-black rounded-[9px] overflow-hidden">
            <button (click)="s.goScan()" class="border-0 px-[10px] py-[9px] font-pixel text-[12px] leading-none" [style.background]="s.modeCardBg" [style.color]="s.modeCardFg">
              KAART
            </button>
            <button
              (click)="s.goPageScanFromScan()"
              class="border-0 px-[10px] py-[9px] font-pixel text-[12px] leading-none"
              [style.background]="s.modePageBg"
              [style.color]="s.modePageFg"
            >
              PAGINA
            </button>
          </div>
          @if (torchAvail()) {
            <button
              (click)="toggleTorch()"
              title="Flitser"
              class="w-11 h-11 rounded-xl border-2 border-black shadow-[0_3px_0_#000] flex items-center justify-center"
              [class]="torch() ? 'bg-lcd text-lcd-ink' : 'bg-[#2A2D35] text-[#F7F3E8]'"
            >
              <span class="icon text-[22px]">{{ torch() ? 'flash_on' : 'flash_off' }}</span>
            </button>
          }
          <label title="Foto kiezen" class="w-11 h-11 rounded-xl bg-[#2A2D35] text-[#F7F3E8] border-2 border-black shadow-[0_3px_0_#000] flex items-center justify-center cursor-pointer">
            <span class="icon text-[22px]">add_photo_alternate</span>
            <input type="file" accept="image/*" class="hidden" (change)="onPhoto($event)" />
          </label>
        </div>
        <div
          class="relative flex-1 mx-3 rounded-[18px] border-2 border-black overflow-hidden bg-[repeating-linear-gradient(45deg,#1E2128_0_12px,#1A1C22_12px_24px)]"
        >
          <video #video class="absolute inset-0 w-full h-full object-cover" autoplay muted playsinline></video>
          <div #guide class="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 w-[min(62%,280px)] max-h-[80%] aspect-[63/88]">
            @if (s.scanLocked) {
              <div class="absolute inset-[5%] border-2 border-[rgba(155,188,15,.7)] rounded-[10px] bg-[rgba(155,188,15,.14)]"></div>
            }
            <div class="absolute left-0 top-0 w-[24%] h-[18%] border-t-[5px] border-l-[5px] rounded-tl-[14px]" [style.border-color]="s.frameColor"></div>
            <div class="absolute right-0 top-0 w-[24%] h-[18%] border-t-[5px] border-r-[5px] rounded-tr-[14px]" [style.border-color]="s.frameColor"></div>
            <div class="absolute left-0 bottom-0 w-[24%] h-[18%] border-b-[5px] border-l-[5px] rounded-bl-[14px]" [style.border-color]="s.frameColor"></div>
            <div class="absolute right-0 bottom-0 w-[24%] h-[18%] border-b-[5px] border-r-[5px] rounded-br-[14px]" [style.border-color]="s.frameColor"></div>
            @if (s.scanSearching) {
              <div class="absolute left-[6%] right-[6%] h-[3px] top-[4%] bg-lcd shadow-[0_0_14px_3px_rgba(155,188,15,.75)] animate-scan"></div>
            }
          </div>
          <div class="absolute bottom-[18px] left-1/2 -translate-x-1/2 bg-device border-2 border-black rounded-[9px] p-1">
            <div class="lcd flex items-center gap-2 rounded-[5px] px-3 py-[7px] text-[14px] leading-none whitespace-nowrap">
              <cc-led [color]="s.statusDotColor" [blink]="s.statusDotBlink" />{{ status() }}
            </div>
          </div>
        </div>
        <div class="px-5 pt-[14px] pb-5 text-center text-[13px] font-bold text-[#A8A497] text-pretty">{{ hint() }}</div>

        @if (s.scanSheet) {
          <div class="absolute inset-0 bg-[rgba(0,0,0,.45)] pointer-events-none"></div>
          <div
            class="absolute left-0 right-0 bottom-0 max-h-[84%] overflow-auto bg-bg text-ink border-t-2 border-line rounded-t-[22px] px-4 pt-[10px] pb-5 flex flex-col gap-4 animate-up [animation-duration:.35s] [animation-timing-function:cubic-bezier(.2,.9,.3,1)]"
          >
            <div class="w-11 h-[5px] rounded-[3px] bg-muted opacity-50 self-center"></div>
            <div class="flex items-end justify-between gap-[10px]">
              <div>
                <div class="font-pixel text-[12px] leading-none text-muted tracking-[.08em]">{{ s.matchCount === 1 ? 'BESTE MATCH' : 'BESTE ' + s.matchCount + ' MATCHES' }}</div>
                <div class="text-[20px] font-black mt-1">Welke kaart is het?</div>
              </div>
              <button (click)="s.rescan()" class="bg-surface border-2 border-line rounded-[9px] shadow-hard-sm px-[10px] py-[6px] font-extrabold text-[13px]">Opnieuw</button>
            </div>
            <div class="flex flex-col gap-[10px]">
              @for (m of s.matches; track m.key) {
                <button
                  (click)="m.select()"
                  class="flex items-center gap-3 p-[10px] bg-surface border-2 rounded-xl text-left"
                  [style.border-color]="m.bd"
                  [style.box-shadow]="m.sh"
                >
                  <div class="w-[50px] flex-none aspect-[63/88]"><cc-card [card]="m.cv" /></div>
                  <div class="flex-1 min-w-0 flex flex-col gap-[5px]">
                    <div class="text-[15px] font-black whitespace-nowrap overflow-hidden text-ellipsis">{{ m.name }}</div>
                    <div class="text-[12px] font-bold text-muted">{{ m.meta }}</div>
                    <div class="flex items-center gap-2">
                      <div class="flex-1 max-w-[150px] h-[10px] bg-lcd border-2 border-line rounded-[3px] overflow-hidden">
                        <div class="h-full bg-lcd-mid" [style.width.%]="m.conf"></div>
                      </div>
                      <span class="font-pixel font-semibold text-[13px] leading-none">{{ m.conf }}%</span>
                    </div>
                  </div>
                  <span class="w-6 h-6 flex-none rounded-full border-2 border-line bg-bg flex items-center justify-center">
                    <span class="w-3 h-3 rounded-full" [style.background]="m.dot"></span>
                  </span>
                </button>
              }
            </div>
            <div class="flex flex-col gap-2">
              <span class="text-[13px] font-extrabold text-muted">Taal</span>
              <div class="grid grid-cols-4 gap-[2px] bg-line border-2 border-line rounded-[10px] overflow-hidden">
                @for (l of s.langOpts; track l.key) {
                  <button
                    (click)="l.select()"
                    class="border-0 px-1 py-[10px] font-pixel font-semibold text-[15px] leading-none"
                    [style.background]="l.bg"
                    [style.color]="l.fg"
                    [style.opacity]="l.op"
                    [style.text-decoration]="l.deco"
                  >
                    {{ l.code }}
                  </button>
                }
              </div>
            </div>
            <div class="flex flex-col gap-2">
              <span class="text-[13px] font-extrabold text-muted">Conditie</span>
              <div class="flex flex-wrap gap-2">
                @for (c of s.condOpts; track c.key) {
                  <button
                    (click)="c.select()"
                    class="flex items-baseline gap-[6px] border-2 border-line rounded-full px-3 py-[6px]"
                    [style.background]="c.bg"
                    [style.color]="c.fg"
                  >
                    <span class="font-pixel font-semibold text-[14px] leading-none">{{ c.code }}</span><span class="text-[12px] font-bold">{{ c.label }}</span>
                  </button>
                }
              </div>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span class="text-[13px] font-extrabold text-muted">Aantal</span>
              <div class="flex items-center border-2 border-line rounded-[11px] overflow-hidden bg-surface">
                <button (click)="s.qtyDec()" class="w-[46px] h-11 border-0 bg-transparent font-black text-[20px]">−</button>
                <span class="w-9 text-center font-pixel font-semibold text-[20px] leading-none">{{ s.scanQty }}</span>
                <button (click)="s.qtyInc()" class="w-[46px] h-11 border-0 bg-transparent font-black text-[20px]">+</button>
              </div>
            </div>
            <button
              (click)="s.addScan()"
              class="press flex items-center justify-center gap-2 bg-red text-cream border-2 border-line rounded-xl shadow-[0_5px_0_var(--line)] p-[15px] font-black text-[17px]"
            >
              <span class="icon text-[22px]">add</span>Toevoegen
            </button>
          </div>
        }
      </div>
    </div>
  `,
})
export class ScanOverlay implements OnDestroy {
  private readonly store = inject(CardcaseStore);
  private readonly scanner = inject(ScannerService);
  private readonly hashes = inject(CardHashes);
  protected readonly v = this.store.vals;
  private readonly video = viewChild.required<ElementRef<HTMLVideoElement>>('video');
  private readonly guide = viewChild.required<ElementRef<HTMLElement>>('guide');

  protected readonly cam = signal<'starting' | 'live' | CameraError>('starting');
  /** The recognition engine: downloading, ready, or failed to load (retried automatically). */
  protected readonly ocr = signal<'loading' | 'ready' | 'error'>('loading');
  /**
   * 'hash' compares the camera image with the photos of all cards (card-hashes.bin); 'ocr' reads name and number
   * as text, the fallback when that index can't be loaded.
   */
  private mode: 'hash' | 'ocr' = 'hash';
  protected readonly reading = signal(false);
  protected readonly torch = signal(false);
  protected readonly torchAvail = signal(false);
  /** Language of the cards: the search is limited to it (and Japanese and Chinese text needs its own OCR model). */
  protected readonly lang = signal<ScanLang>(this.store.scanLang());
  protected readonly langs: { key: ScanLang; label: string }[] = [
    { key: 'EN', label: 'EN·DE' },
    { key: 'JA', label: 'JA' },
    { key: 'ZH', label: 'ZH' },
  ];

  protected readonly status = computed(() => {
    const cam = this.cam();
    if (this.reading()) return 'FOTO LEZEN…';
    if (cam === 'starting') return 'CAMERA STARTEN…';
    if (cam === 'denied') return 'GEEN CAMERA-TOEGANG';
    if (cam !== 'live') return 'GEEN CAMERA GEVONDEN';
    if (this.ocr() === 'error') return 'SCANNER LADEN MISLUKT';
    if (this.ocr() === 'loading' && this.v().scanSearching) return 'SCANNER LADEN…';
    return this.v().statusText;
  });
  protected readonly hint = computed(() => {
    const cam = this.cam();
    if (cam === 'denied') return 'Sta cameratoegang toe in je browser, of kies een foto van de kaart.';
    if (cam === 'unsupported' || cam === 'failed') return 'Deze browser of dit apparaat geeft geen camerabeeld. Kies een foto van de kaart.';
    if (this.ocr() === 'error') return 'De scanner kon niet laden. Controleer je internetverbinding, we proberen het opnieuw.';
    if (this.ocr() === 'loading') return 'De scanner wordt geladen (alleen de eerste keer even wachten).';
    return 'Houd de kaart recht in het kader, zodat hij het kader ongeveer vult. Vermijd reflecties.';
  });

  private stream?: MediaStream;
  private alive = true;
  /** Names of the best match in the last few frames. */
  private recent: { name: string; ms: CardMatch[] }[] = [];
  /**
   * Crops tried in turn (margins for ScannerService.grabGuide): the card exactly in the guide, held closer (up to ~1.6×
   * the guide) and further away (~0.8×), so it doesn't have to fill the guide precisely.
   */
  private readonly crops = [0, 0.15, -0.1, 0.3, 0.07];
  private crop = 0;
  /** The card just shown is ignored for a moment after rescanning, while it is still in view. */
  private skip = { name: '', until: 0 };
  /** Best card of the last few frames, its bit distance and its lead over the runner-up (hash mode). */
  private recentIds: { id: number; d: number; lead: number }[] = [];

  constructor() {
    this.scanner.setLanguage(this.lang());
    afterNextRender(() => {
      void this.start();
      this.warmUp();
    });
  }

  protected setLang(l: ScanLang) {
    if (l === this.lang()) return;
    this.lang.set(l);
    this.store.setScanLang(l);
    this.scanner.setLanguage(l);
    this.recent = [];
    this.recentIds = [];
    if (this.mode === 'hash') return;
    this.ocr.set('loading');
    this.warmUp();
  }

  private async warmUp() {
    if (this.mode === 'hash') {
      if (await this.hashes.load()) return this.ocr.set('ready');
      console.warn('[scan] card-hashes.bin niet beschikbaar, tekstherkenning gebruikt');
      this.mode = 'ocr';
    }
    const lang = this.lang();
    this.scanner.warmUp().then(
      () => lang === this.lang() && this.ocr.set('ready'),
      (err) => {
        console.warn('[scan] tekstherkenning laden mislukt', err);
        this.ocr.set('error');
        if (this.alive) setTimeout(() => this.alive && this.warmUp(), 4000);
      },
    );
  }

  ngOnDestroy() {
    this.alive = false;
    this.scanner.stopCamera(this.stream);
  }

  private async start() {
    try {
      const stream = await this.scanner.startCamera(this.video().nativeElement);
      if (!this.alive) return this.scanner.stopCamera(stream);
      this.stream = stream;
      this.torchAvail.set(this.scanner.hasTorch(stream));
      this.cam.set('live');
      void this.loop();
    } catch (err) {
      this.cam.set(typeof err === 'string' ? (err as CameraError) : 'failed');
    }
  }

  /** Reads the card in the frame over and over while the scanner is searching. */
  private async loop() {
    let wasSearching = true;
    while (this.alive) {
      const searching = this.store.state.scan.phase === 'search';
      if (searching && !wasSearching) this.skip.until = Date.now() + 2500;
      wasSearching = searching;
      if (searching && !this.reading() && this.ocr() === 'ready' && this.mode === 'hash') {
        this.hashFrame();
        await sleep(120);
        continue;
      }
      const frame = searching && !this.reading() && this.ocr() === 'ready' && this.scanner.grabGuide(this.video().nativeElement, this.guide().nativeElement, this.crops[this.crop++ % this.crops.length]);
      if (frame) {
        try {
          const { text, numText } = await this.scanner.readCard(frame);
          const ms = matchCards(text, { numText, lang: this.lang() });
          if (DEBUG) console.debug('[scan]', frame.width + '×' + frame.height, JSON.stringify(text), ms.map((m) => `${CARDS[m.id].names.EN} ${CARDS[m.id].set} ${m.conf}%`));
          if (this.alive && this.store.state.scan.phase === 'search') this.consider(ms);
        } catch (err) {
          console.warn('[scan] tekstherkenning mislukt', err);
          await sleep(1000);
        }
      }
      await sleep(frame ? 50 : 300);
    }
  }

  /** Hash mode: compares the card in the guide with all card photos of the chosen language. */
  private hashFrame() {
    const video = this.video().nativeElement;
    const r = this.scanner.guideRect(video, this.guide().nativeElement);
    if (!r) return;
    const ms = this.hashes.search(this.scanner.hashCard(video, video.videoWidth, video.videoHeight, r), { langs: LANG_SETS[this.lang()] });
    if (DEBUG) console.debug('[scan] ' + ms.map((m) => `${CARDS[m.id].names.EN} ${CARDS[m.id].set} ${CARDS[m.id].numStr} d=${m.d} ${m.conf}%`).join(' | '));
    const best = ms[0];
    let id = best ? best.id : -1;
    if (id >= 0 && String(id) === this.skip.name && Date.now() < this.skip.until) id = -1;
    this.recentIds = [...this.recentIds.slice(-4), { id, d: best?.d ?? 999, lead: ms[1] ? ms[1].d - best.d : 99 }];
    const wins = (maxD: number, minLead: number) => this.recentIds.filter((r) => r.id === id && r.d <= maxD && r.lead >= minLead).length;
    // A near-identical image is accepted at once; a weaker one when it keeps winning: a random card is the best match
    // of a frame now and then, but not frame after frame with a lead over the rest.
    if (id >= 0 && (best.conf >= 80 || wins(26, 0) >= 2 || wins(31, 3) >= 3)) {
      this.skip = { name: String(id), until: Infinity };
      this.recentIds = [];
      this.store.scanFound(ms);
    }
  }

  /**
   * Accepts a clear match (name and number) at once. When only the name could be read, the same name has to come back
   * in two of the last six frames (one round of crops); the sheet then lets you pick the right print.
   * A frame that read more of the name counts too, and wins: "リザードン" over the half-read "リザード".
   */
  private consider(ms: CardMatch[]) {
    const best = ms[0];
    let name = best && best.conf >= 35 ? CARDS[best.id].names.EN : '';
    if (name === this.skip.name && Date.now() < this.skip.until) name = '';
    this.recent = [...this.recent.slice(-5), { name, ms }];
    if (!name) return;
    const votes = this.recent.filter((r) => r.name && r.name.includes(name));
    if (best.conf >= 70 || votes.length >= 2) {
      const pick = best.conf >= 70 ? { name, ms } : votes.reduce((a, r) => (r.name.length > a.name.length ? r : a));
      this.skip = { name: pick.name, until: Infinity };
      this.recent = [];
      this.store.scanFound(pick.ms);
    }
  }

  protected async onPhoto(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.reading.set(true);
    try {
      const photo = await this.scanner.fileToCanvas(file, 2000);
      let ms: CardMatch[] = this.mode === 'hash' && (await this.hashes.load()) ? this.hashPhoto(photo) : [];
      if (!ms.length || ms[0].conf < 50) ms = matchCards(await this.scanner.readAll(photo), { lang: this.lang() });
      if (!ms.length) return this.store.toast('Geen kaart herkend · probeer een scherpere foto');
      this.store.startScan();
      this.store.scanFound(ms);
    } catch (err) {
      console.warn('[scan] foto lezen mislukt', err);
      this.store.toast('Foto lezen mislukt · controleer je verbinding');
    } finally {
      this.reading.set(false);
    }
  }

  /** The card in a photo is somewhere around the middle, filling most of it: tries a range of centred sizes. */
  private hashPhoto(photo: HTMLCanvasElement) {
    const full = Math.min(photo.width, photo.height * CARD_RATIO);
    const parts = [0.95, 0.85, 0.75, 0.65, 0.55].map((s) => {
      const w = full * s;
      const h = w / CARD_RATIO;
      return this.scanner.hashCard(photo, photo.width, photo.height, { x: (photo.width - w) / 2, y: (photo.height - h) / 2, w, h });
    });
    const all = new Uint32Array(parts.reduce((n, p) => n + p.length, 0));
    parts.reduce((o, p) => (all.set(p, o), o + p.length), 0);
    return this.hashes.search(all, { langs: LANG_SETS[this.lang()] });
  }

  protected async toggleTorch() {
    if (!this.stream) return;
    const on = !this.torch();
    try {
      await this.scanner.setTorch(this.stream, on);
      this.torch.set(on);
    } catch {
      this.torchAvail.set(false);
    }
  }
}

const LANG_SETS: Record<ScanLang, ReadonlySet<string>> = { EN: new Set(['EN']), JA: new Set(['JA']), ZH: new Set(['ZH']) };

/** `localStorage['cc-scan-debug'] = 1` logs what the scanner reads in every frame. */
const DEBUG = (() => {
  try {
    return !!localStorage.getItem('cc-scan-debug');
  } catch {
    return false;
  }
})();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
