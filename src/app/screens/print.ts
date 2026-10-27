import { ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core';
import { CardcaseStore } from '../core/store';
import { ArtPiece } from '../shared/art-piece';

/** Print sheet export of decoration pieces at real card size. */
@Component({
  selector: 'cc-print',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArtPiece],
  template: `
    @let s = v();
    <div class="flex flex-col gap-[18px]">
      <div class="flex items-center gap-3">
        <button (click)="s.goEditorDeco()" title="Terug" class="btn-icon"><span class="icon text-[20px]">arrow_back</span></button>
        <div class="flex flex-col gap-[3px] min-w-0">
          <div class="kicker">PRINT-EXPORT</div>
          <h1 class="m-0 text-[clamp(22px,3.4vw,28px)] font-black leading-[1.15] text-pretty">Decoratie printen op kaartformaat</h1>
        </div>
      </div>
      <div class="flex flex-wrap gap-[22px] items-start">
        <div class="flex-[2_1_420px] min-w-0 flex flex-col gap-5 items-center">
          @if (s.noPieces) {
            <div class="panel p-[18px] font-bold text-muted self-stretch">
              Deze binder heeft nog geen decoratieslots. Voeg eerst afbeeldingen toe in de decoratiemodus.
            </div>
          }
          @for (sh of s.printSheets; track sh.key) {
            <div class="w-full max-w-[560px] flex flex-col gap-2">
              <div class="font-pixel text-[12px] leading-none text-muted tracking-[.08em]">{{ sh.label }}</div>
              <div class="relative w-full bg-white border-2 border-line shadow-[5px_5px_0_var(--line)]" [style.aspect-ratio]="s.pr.aspect">
                @for (pc of sh.pieces; track pc.key) {
                  <div class="absolute" [style.left.%]="pc.l" [style.top.%]="pc.t" [style.width.%]="pc.w" [style.height.%]="pc.h">
                    <cc-art-piece [p]="pc.art" />
                    <div class="absolute border border-dashed border-[color-mix(in_srgb,var(--coal)_85%,_transparent)]" [style.inset]="pc.inset">
                      <div class="absolute -left-[9px] -top-px w-[6px] h-px bg-coal" [style.opacity]="pc.tick"></div>
                      <div class="absolute -left-px -top-[9px] w-px h-[6px] bg-coal" [style.opacity]="pc.tick"></div>
                      <div class="absolute -right-[9px] -top-px w-[6px] h-px bg-coal" [style.opacity]="pc.tick"></div>
                      <div class="absolute -right-px -top-[9px] w-px h-[6px] bg-coal" [style.opacity]="pc.tick"></div>
                      <div class="absolute -left-[9px] -bottom-px w-[6px] h-px bg-coal" [style.opacity]="pc.tick"></div>
                      <div class="absolute -left-px -bottom-[9px] w-px h-[6px] bg-coal" [style.opacity]="pc.tick"></div>
                      <div class="absolute -right-[9px] -bottom-px w-[6px] h-px bg-coal" [style.opacity]="pc.tick"></div>
                      <div class="absolute -right-px -bottom-[9px] w-px h-[6px] bg-coal" [style.opacity]="pc.tick"></div>
                      <div class="absolute left-1 bottom-1 bg-[rgba(255,255,255,.85)] text-coal font-pixel text-[9px] leading-none px-[3px] py-[2px] rounded-[2px]">
                        {{ pc.label }}
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
        <div class="flex-[1_1_280px] min-w-0 panel p-4 flex flex-col gap-4">
          <div class="flex flex-col gap-[6px]">
            <span class="text-[12.5px] font-extrabold text-muted">Papierformaat</span>
            <div class="grid grid-cols-2 gap-[2px] bg-line border-2 border-line rounded-[9px] overflow-hidden">
              @for (o of s.paperOpts; track o.key) {
                <button (click)="o.select()" class="border-0 p-3 font-pixel font-semibold text-[14px] leading-none" [style.background]="o.bg" [style.color]="o.fg">
                  {{ o.label }}
                </button>
              }
            </div>
          </div>
          <button (click)="s.toggleBleed()" class="flex items-center gap-[9px] bg-transparent border-0 py-2 px-[2px] font-extrabold text-[13.5px] text-left">
            <span class="relative flex-none w-[46px] h-[26px] rounded-full border-2 border-line" [style.background]="s.bleedTrack">
              <span class="absolute top-[2px] w-[18px] h-[18px] rounded-full bg-surface border-2 border-line transition-[left] duration-150" [style.left]="s.bleedKnob"></span>
            </span>
            Met overloop (3 mm)
          </button>
          <div class="text-[12.5px] font-bold text-muted text-pretty">{{ s.pr.bleedLabel }}</div>
          <div class="bg-device border-2 border-line rounded-[9px] p-1">
            <div class="lcd rounded-[5px] px-3 py-2 text-[14px] leading-[1.3] whitespace-nowrap">{{ s.pr.info }}</div>
          </div>
          <div class="flex flex-col gap-[6px] text-[12.5px] font-extrabold text-muted">
            <span class="flex items-center gap-2"><span class="w-[22px] h-0 border-t-[1.5px] border-dashed border-coal"></span>snijlijn · 63 × 88 mm, echte kaartgrootte</span>
            <span class="flex items-center gap-2">
              <span class="relative w-[22px] h-[10px]">
                <span class="absolute left-0 top-1 w-2 h-[1.5px] bg-coal"></span>
                <span class="absolute left-[10px] top-0 w-[1.5px] h-[10px] bg-coal"></span>
              </span>
              snijtekens
            </span>
          </div>
          <button
            (click)="print()"
            class="press flex items-center justify-center gap-2 bg-red text-cream border-2 border-line rounded-xl shadow-[0_5px_0_var(--line)] p-[13px] font-black text-[15px]"
          >
            <span class="icon text-[20px]">picture_as_pdf</span>Printvel opslaan als PDF
          </button>
          <div class="text-[12.5px] font-bold text-muted text-pretty">
            Kies in het printvenster "Opslaan als PDF" en print daarna op 100% (werkelijke grootte), niet "passend maken".
          </div>
        </div>
      </div>
    </div>
    <!-- The sheets at real size, for printing; print() puts a copy of them on the page on its own. -->
    <div #sheets class="cc-print-sheets">
      @for (sh of s.printSheets; track sh.key) {
        <div class="relative overflow-hidden bg-white" [style.width.mm]="s.pr.wmm" [style.height.mm]="s.pr.hmm">
          @for (pc of sh.pieces; track pc.key) {
            <div class="absolute" [style.left.%]="pc.l" [style.top.%]="pc.t" [style.width.%]="pc.w" [style.height.%]="pc.h">
              <cc-art-piece [p]="pc.art" />
              <div class="absolute border-[0.2mm] border-dashed border-[color-mix(in_srgb,var(--coal)_85%,_transparent)]" [style.inset]="pc.inset"></div>
              @if (s.pr.bleed) {
                <!-- In the bleed, so it's cut off with it. -->
                <div class="absolute left-[3mm] bottom-[0.4mm] bg-white text-black font-pixel text-[5pt] leading-none px-[0.5mm]">{{ pc.label }}</div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class PrintScreen {
  protected readonly v = inject(CardcaseStore).vals;
  private readonly sheets = viewChild.required<ElementRef<HTMLElement>>('sheets');

  /**
   * Opens the print dialog (where "Save as PDF" makes the PDF) with only the sheets on the page, one per sheet of paper
   * at its real size, so the pieces come out at 63 × 88 mm.
   */
  protected print() {
    const { wmm, hmm } = this.v().pr;
    const root = document.createElement('div');
    root.className = 'cc-print-root';
    root.append(this.sheets().nativeElement.cloneNode(true));
    const page = document.createElement('style');
    page.textContent = `@page { size: ${wmm}mm ${hmm}mm; margin: 0; }`;
    document.head.append(page);
    document.body.append(root);
    document.body.classList.add('cc-printing');
    const done = () => {
      document.body.classList.remove('cc-printing');
      root.remove();
      page.remove();
    };
    window.addEventListener('afterprint', done, { once: true });
    window.print();
  }
}
