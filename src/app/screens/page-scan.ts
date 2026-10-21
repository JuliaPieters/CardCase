import { afterNextRender, ChangeDetectionStrategy, Component, computed, ElementRef, inject, OnDestroy, signal, viewChild } from '@angular/core';
import { CardHashes } from '../core/card-hash';
import { matchCards, norm } from '../core/card-match';
import { COLS, isCard } from '../core/data';
import { type CameraError, ScannerService } from '../core/scanner';
import { CardcaseStore } from '../core/store';
import { Led } from '../shared/bits';

/** Full-screen binder page scanner styled as a dot-matrix camera: reads every slot of the page and checks it against the binder plan. */
@Component({
  selector: 'cc-page-scan',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Led],
  template: `
    @let s = v();
    <div class="fixed inset-0 z-50 bg-[#0B0C0F] flex justify-center pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div class="relative w-full max-w-[560px] h-full flex flex-col gap-3 overflow-hidden bg-[#14161B] pb-4">
        <div class="flex items-center gap-3 px-[14px] pt-3 text-[#F7F3E8]">
          <button
            (click)="s.closePageScan()"
            title="Sluiten"
            class="w-11 h-11 flex-none rounded-xl bg-[#2A2D35] text-[#F7F3E8] border-2 border-black shadow-[0_3px_0_#000] flex items-center justify-center"
          >
            <span class="icon text-[22px]">close</span>
          </button>
          <div class="flex flex-col gap-[3px] min-w-0">
            <div class="font-pixel font-semibold text-[18px] leading-none tracking-[.06em]">PAGINASCAN</div>
            <div class="text-[12px] font-bold text-[#A8A497] whitespace-nowrap overflow-hidden text-ellipsis">{{ s.psv.sub }}</div>
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
        </div>
        <div class="flex items-center gap-2 mx-[14px] flex-wrap">
          <div class="flex-[1_1_200px] bg-device border-2 border-black rounded-[9px] p-1">
            <div class="lcd rounded-[5px] px-3 py-2 text-[14px] leading-none">CONTROLE: {{ s.psv.title }}</div>
          </div>
          <div class="flex gap-[6px]">
            @for (c of s.psChips; track c.key) {
              <button
                (click)="c.select()"
                class="border-2 border-black rounded-lg px-[10px] py-2 font-pixel text-[13px] leading-none shadow-[0_3px_0_#000]"
                [style.background]="c.bg"
                [style.color]="c.fg"
              >
                {{ c.label }}
              </button>
            }
          </div>
        </div>
        <div
          class="flex-1 min-h-0 mx-[14px] bg-device border-2 border-black rounded-[16px_16px_48px_16px] pt-3 px-[14px] pb-4 flex flex-col gap-[10px] shadow-[0_4px_0_#000]"
        >
          <div class="flex items-center gap-2 font-pixel text-[11px] leading-none text-[#A8A497] tracking-[.12em]">
            <cc-led color="#FF5A4E" [size]="9" />POWER<span class="ml-auto">DOT-MATRIX CAM</span>
          </div>
          <div class="relative flex-1 min-h-0 bg-lcd rounded-md shadow-[inset_0_0_0_3px_#8BAC0F] overflow-hidden">
            <div class="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(48,98,48,.16)_0_10px,transparent_10px_20px)]"></div>
            <video #video class="absolute inset-0 w-full h-full object-cover" autoplay muted playsinline></video>
            <div class="absolute inset-[6%_5%] flex items-center justify-center">
              <div #grid class="relative max-h-full max-w-full" [style.aspect-ratio]="s.psv.aspect" [style.height]="'100%'">
                <div
                  class="absolute inset-0 grid gap-[6px]"
                  [style.grid-template-columns]="'repeat(' + s.psv.cols + ',1fr)'"
                  [style.grid-template-rows]="'repeat(' + s.psv.rows + ',1fr)'"
                >
                  @for (c of s.psCells; track c.key) {
                    <div class="rounded px-1 py-[3px] font-pixel text-[11px] leading-none text-lcd-ink" [style.border]="s.psv.cellBorder" [style.background]="s.psv.cellBg">
                      {{ c.n }}
                    </div>
                  }
                </div>
                <div class="absolute -left-[10px] -top-[10px] w-[26px] h-[26px] border-t-4 border-l-4 border-lcd-ink"></div>
                <div class="absolute -right-[10px] -top-[10px] w-[26px] h-[26px] border-t-4 border-r-4 border-lcd-ink"></div>
                <div class="absolute -left-[10px] -bottom-[10px] w-[26px] h-[26px] border-b-4 border-l-4 border-lcd-ink"></div>
                <div class="absolute -right-[10px] -bottom-[10px] w-[26px] h-[26px] border-b-4 border-r-4 border-lcd-ink"></div>
                @if (s.psAlign) {
                  <div class="absolute -left-[4%] -right-[4%] h-[3px] top-[4%] bg-lcd-ink opacity-70 animate-scan-fast"></div>
                }
              </div>
            </div>
            @if (s.lcdPixels) {
              <div class="lcd-pixels"></div>
            }
          </div>
          <div class="lcd self-center flex items-center gap-2 rounded-[5px] px-3 py-[7px] text-[14px] leading-none whitespace-nowrap">
            <cc-led [color]="s.psDotColor" [blink]="s.psAlign" />{{ status() }}
          </div>
        </div>
        <div class="flex items-center justify-center gap-[26px]">
          <div class="flex flex-col items-center gap-[5px]">
            <button
              (click)="s.closePageScan()"
              class="w-[50px] h-[50px] rounded-full bg-[#2A2D35] text-[#F7F3E8] border-2 border-black shadow-[0_4px_0_#000] font-pixel font-semibold text-[15px] leading-none"
            >
              B
            </button>
            <span class="font-pixel text-[11px] leading-none text-[#A8A497]">TERUG</span>
          </div>
          <div class="flex flex-col items-center gap-[5px]">
            <button
              (click)="capture()"
              [disabled]="s.psv.capOp < 1"
              class="w-[74px] h-[74px] rounded-full bg-[#E3350D] text-cream border-[3px] border-black shadow-[0_5px_0_#000] font-pixel font-semibold text-[20px] leading-none active:translate-y-1 active:shadow-[0_1px_0_#000]"
              [style.opacity]="s.psv.capOp"
            >
              A
            </button>
            <span class="font-pixel text-[11px] leading-none text-[#A8A497]">CONTROLEER</span>
          </div>
          <div class="flex flex-col items-center gap-[5px]">
            <label
              class="w-[50px] h-[50px] rounded-full bg-[#2A2D35] text-[#F7F3E8] border-2 border-black shadow-[0_4px_0_#000] flex items-center justify-center cursor-pointer"
              [style.opacity]="reading() ? 0.6 : 1"
            >
              <span class="icon text-[22px]">add_photo_alternate</span>
              <input type="file" accept="image/*" class="hidden" [disabled]="reading()" (change)="onPhoto($event)" />
            </label>
            <span class="font-pixel text-[11px] leading-none text-[#A8A497]">FOTO</span>
          </div>
        </div>
        <div class="text-center text-[13px] font-bold text-[#A8A497] px-5 text-pretty">{{ hint() }}</div>
      </div>
    </div>
  `,
})
export class PageScanOverlay implements OnDestroy {
  private readonly store = inject(CardcaseStore);
  private readonly scanner = inject(ScannerService);
  private readonly hashes = inject(CardHashes);
  protected readonly v = this.store.vals;
  private readonly video = viewChild.required<ElementRef<HTMLVideoElement>>('video');
  private readonly grid = viewChild.required<ElementRef<HTMLElement>>('grid');

  protected readonly cam = signal<'starting' | 'live' | CameraError>('starting');
  protected readonly reading = computed(() => this.store.state.ps.phase === 'reading');
  protected readonly status = computed(() => {
    const cam = this.cam();
    if (this.reading() || cam === 'live') return this.v().psv.status;
    if (cam === 'starting') return 'CAMERA STARTEN…';
    return cam === 'denied' ? 'GEEN CAMERA-TOEGANG' : 'GEEN CAMERA GEVONDEN';
  });
  protected readonly hint = computed(() =>
    this.cam() === 'live' || this.cam() === 'starting'
      ? 'Leg de binder plat, laat de pagina precies het raster vullen en vermijd glans op de hoesjes.'
      : 'Geen camerabeeld: kies een foto waarop de binderpagina het hele beeld vult.',
  );

  private stream?: MediaStream;
  private alive = true;

  constructor() {
    this.scanner.setLanguage(this.store.scanLang());
    afterNextRender(() => {
      void this.start();
      // Load the card index while the page is being lined up; without it, fall back to text recognition.
      void this.hashes.load().then((ok) => ok || this.scanner.warmUp().catch(() => {}));
    });
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
      this.cam.set('live');
      this.store.setPs({ phase: 'locked' });
    } catch (err) {
      this.cam.set(typeof err === 'string' ? (err as CameraError) : 'failed');
      // Without a camera the photo button still works.
      this.store.setPs({ phase: 'locked' });
    }
  }

  protected capture() {
    if (this.cam() !== 'live') return;
    const frame = this.scanner.grabGuide(this.video().nativeElement, this.grid().nativeElement);
    if (frame) void this.read(frame);
  }

  protected async onPhoto(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) void this.read(await this.scanner.fileToCanvas(file, 4000));
  }

  /** Splits the page image into the binder's grid and recognises the card in every slot. */
  private async read(page: HTMLCanvasElement) {
    const { b, idxs, expect } = this.store.pageScanTarget();
    const cols: number = (COLS as Record<number, number>)[b.fmt];
    const rows = b.fmt / cols;
    const cw = page.width / cols;
    const ch = page.height / rows;
    // Cards in the rest of the binder are likely too (e.g. two slots swapped across pages).
    const prefer = new Set<number>(b.slots.filter(isCard));
    const res: Record<number, { got: number | null; conf: number; cands: { id: number; conf: number }[] }> = {};
    this.store.setPs({ phase: 'reading', done: 0 });
    const byImage = await this.hashes.load();
    try {
      for (const [k, i] of idxs.entries()) {
        // Trim the gap between pockets so the crop starts at the card edge.
        const r = { x: (k % cols) * cw + cw * 0.03, y: Math.floor(k / cols) * ch + ch * 0.02, w: cw * 0.94, h: ch * 0.96 };
        let cands;
        if (byImage) {
          // Compare with all card photos; cards of this binder, and above all the planned one, get a head start.
          cands = this.hashes.search(this.scanner.hashCard(page, page.width, page.height, r), { prefer, expect: expect(i) }).filter((m) => m.conf >= 35);
          await sleep(0);
        } else {
          const { text, numText } = await this.scanner.readCard(page, r.x, r.y, r.w, r.h);
          cands = norm(text).length >= 3 ? matchCards(text, { numText, prefer, expect: expect(i) }) : [];
        }
        if (!this.alive) return;
        res[i] = { got: cands[0]?.id ?? null, conf: cands[0]?.conf ?? 0, cands: cands.map(({ id, conf }) => ({ id, conf })) };
        this.store.setPs({ done: k + 1 });
      }
      this.store.pageScanned(res);
    } catch (err) {
      console.warn('[pagescan] tekstherkenning mislukt', err);
      if (!this.alive) return;
      this.store.setPs({ phase: 'locked' });
      this.store.toast('Herkennen mislukt · controleer je verbinding');
    }
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
