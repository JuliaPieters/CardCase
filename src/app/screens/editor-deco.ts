import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CardcaseStore } from '../core/store';
import { Card } from '../shared/card';
import { DecoPage } from '../shared/deco-page';
import { Pix } from '../shared/bits';

/** Decoration mode of the binder editor: images, backgrounds, stickers, templates and suggestions. */
@Component({
  selector: 'cc-editor-deco',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, DecoPage, Pix],
  template: `
    @let s = v();
    <div class="flex flex-col gap-[14px]">
      <div class="flex flex-wrap items-center gap-x-4 gap-y-[10px] bg-surface border-2 border-line rounded-xl shadow-hard-md px-3 py-[10px]">
        <div class="flex items-center gap-[6px]">
          <button
            (click)="s.edPrev()"
                  data-turn="-1"
                  (dragover)="s.dragTurn($event, -1)"
                  (dragleave)="s.dragTurnLeave()"
            class="w-[34px] h-[34px] bg-bg border-2 border-line rounded-[9px] flex items-center justify-center"
            [style.opacity]="s.edPrevOp"
          >
            <span class="icon text-[20px]">chevron_left</span>
          </button>
          <div class="bg-device border-2 border-line rounded-[9px] p-1">
            <div class="lcd rounded-[5px] px-3 py-2 text-[14px] leading-[1.3] whitespace-nowrap">{{ s.decoSpreadLabel }}</div>
          </div>
          <button
            (click)="s.edNext()"
                  data-turn="1"
                  (dragover)="s.dragTurn($event, 1)"
                  (dragleave)="s.dragTurnLeave()"
            class="w-[34px] h-[34px] bg-bg border-2 border-line rounded-[9px] flex items-center justify-center"
            [style.opacity]="s.edNextOp"
          >
            <span class="icon text-[20px]">chevron_right</span>
          </button>
        </div>
        @if (s.hasImgSel) {
          <div class="flex flex-wrap items-center gap-[6px]">
            <span class="font-pixel text-[11px] leading-none text-muted tracking-[.08em]">AFBEELDING</span>
            @for (o of s.selSizeOpts; track o.key) {
              <button (click)="o.select()" class="chip" [style.background]="o.bg" [style.color]="o.fg">{{ o.label }}</button>
            }
            <button (click)="s.cropSel()" class="chip bg-surface text-ink"><span class="icon text-[16px]">crop</span>Uitsnijden</button>
            <button
              (click)="s.toggleSelBuf()"
              title="Wordt vervangen als er een nieuwe kaart bij komt."
              class="chip"
              [style.background]="s.selBuf.bg"
              [style.color]="s.selBuf.fg"
            >
              <span class="icon text-[16px]">swap_horiz</span>Mag als buffer dienen
            </button>
            <button (click)="s.removeSel()" title="Verwijder" class="chip bg-surface text-red"><span class="icon text-[16px]">delete</span></button>
          </div>
        }
        @if (s.hasStkSel) {
          <div class="flex flex-wrap items-center gap-[6px]">
            <span class="font-pixel text-[11px] leading-none text-muted tracking-[.08em]">STICKER</span>
            <button (click)="s.rotL()" title="Draai links" class="chip bg-surface text-ink"><span class="icon text-[16px]">rotate_left</span></button>
            <button (click)="s.rotR()" title="Draai rechts" class="chip bg-surface text-ink"><span class="icon text-[16px]">rotate_right</span></button>
            <button (click)="s.removeSel()" title="Verwijder" class="chip bg-surface text-red"><span class="icon text-[16px]">delete</span></button>
          </div>
        }
        @if (s.noDecoSel) {
          <span class="text-[13px] font-bold text-muted">{{ s.activePageLabel }}</span>
        }
        <div class="ml-auto flex flex-wrap gap-2">
          <button (click)="s.goPrint()" class="btn"><span class="icon text-[19px]">print</span>Printvel</button>
          <button
            (click)="s.openShare()"
            class="press-sm flex items-center gap-[6px] bg-red text-cream border-2 border-line rounded-[10px] shadow-[0_4px_0_var(--line)] px-[14px] py-2 font-black text-[14px]"
          >
            <span class="icon text-[19px]">ios_share</span>Deel als afbeelding
          </button>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-[6px] text-[12.5px] font-extrabold text-muted">
        <span class="font-pixel font-normal text-[11px] leading-none tracking-[.1em] mr-1">LAGEN</span>
        <span class="border-2 border-line rounded-md px-2 py-[3px] bg-surface text-ink">1 Achtergrond</span><span class="icon text-[16px]">chevron_right</span>
        <span class="border-2 border-line rounded-md px-2 py-[3px] bg-surface text-ink">2 Afbeeldingen</span><span class="icon text-[16px]">chevron_right</span>
        <span class="border-2 border-line rounded-md px-2 py-[3px] bg-surface text-ink">3 Kaarten</span><span class="icon text-[16px]">chevron_right</span>
        <span class="border-2 border-line rounded-md px-2 py-[3px] bg-surface text-ink">4 Stickers</span>
        <span class="flex items-center gap-[6px] ml-[10px]"
          ><span class="w-5 h-5 rounded-[5px] bg-gold border-2 border-line text-coal flex items-center justify-center"
            ><span class="icon text-[14px]">swap_horiz</span></span
          >Decoratie mag als buffer dienen: wordt vervangen als er een nieuwe kaart bij komt</span
        >
      </div>

      <div class="flex flex-wrap gap-5 items-start">
        <div class="flex-[3_1_520px] min-w-0 flex flex-col gap-3">
          <div class="flex items-stretch border-2 border-line rounded-[14px] p-[clamp(6px,1.3vw,14px)] shadow-[5px_5px_0_var(--line)]" [style.background]="s.ed.cover">
            <div class="flex-[1_1_0] min-w-0 flex flex-col"><cc-deco-page [pg]="s.dLeft" /></div>
            <div class="flex-none w-[clamp(14px,2.4vw,30px)] flex flex-col justify-evenly items-center">
              @for (r of rings; track r) {
                <div class="w-4/5 h-[26px] rounded-[7px] border-2 border-coal bg-[linear-gradient(90deg,#8E949C,#EEF1F3_50%,#8E949C)]"></div>
              }
            </div>
            <div class="flex-[1_1_0] min-w-0 flex flex-col"><cc-deco-page [pg]="s.dRight" /></div>
          </div>
          <div class="text-[13px] text-muted font-bold text-pretty">
            Sleep een afbeelding uit de zijbalk naar een slot. Versleep hem om te verplaatsen, of trek aan de groene hoekgrepen om hem over meer slots
            te laten lopen. Stickers plaats je vrij op de pagina. Klik op een pagina om hem actief te maken.
          </div>
        </div>

        <aside class="panel flex-[1_1_290px] min-w-0 p-3 flex flex-col gap-3 max-h-[700px] overflow-auto">
          <div class="flex flex-wrap gap-[6px]">
            @for (t of s.decoTabs; track t.key) {
              <button (click)="t.select()" class="chip" [style.background]="t.bg" [style.color]="t.fg">
                <span class="icon text-[16px]">{{ t.icon }}</span>{{ t.label }}
              </button>
            }
          </div>

          @if (s.tabImages) {
            <div class="flex flex-col gap-3">
              <div class="flex flex-col gap-[6px]">
                <span class="text-[12.5px] font-extrabold text-muted">Formaat bij plaatsen</span>
                <div class="flex flex-wrap gap-[6px]">
                  @for (o of s.sizeOpts; track o.key) {
                    <button (click)="o.select()" class="chip" [style.background]="o.bg" [style.color]="o.fg">{{ o.label }}</button>
                  }
                </div>
              </div>
              <div class="flex flex-wrap gap-2">
                <input #file type="file" accept="image/*" class="hidden" (change)="s.onUpload($event)" />
                <button (click)="file.click()" class="chip bg-red text-cream"><span class="icon text-[16px]">upload</span>Upload afbeelding</button>
                <button (click)="s.sampleCrop()" class="chip bg-bg text-ink"><span class="icon text-[16px]">crop</span>Uitsnijden met voorbeeld</button>
              </div>
              <div class="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-[10px]">
                @for (i of s.imgThumbs; track i.key) {
                  <div draggable="true" (dragstart)="i.onDragStart($event)" (dragend)="i.onDragEnd()" (click)="i.onClick()" class="flex flex-col gap-1 cursor-grab">
                    <div class="aspect-square border-2 border-line rounded-[7px] bg-cover bg-center shadow-hard-sm" [style.background-image]="i.fill"></div>
                    <span class="text-[11px] font-extrabold whitespace-nowrap overflow-hidden text-ellipsis">{{ i.name }}</span>
                  </div>
                }
              </div>
              <div class="font-mono font-medium text-[11px] leading-[1.4] text-muted">placeholders · vervang door eigen beeld via upload</div>
            </div>
          }

          @if (s.tabBgs) {
            <div class="flex flex-col gap-3">
              <button (click)="s.toggleBgBoth()" class="chip self-start" [style.background]="s.bgBoth.bg" [style.color]="s.bgBoth.fg">
                <span class="icon text-[16px]">auto_stories</span>Op beide pagina's
              </button>
              <div class="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-[10px]">
                @for (g of s.bgThumbs; track g.key) {
                  <button (click)="g.apply()" class="flex flex-col gap-1 bg-transparent border-0 p-0 text-left">
                    <div class="w-full aspect-[3/4] border-2 border-line rounded-[7px] bg-[#FBF8EF] bg-cover shadow-hard-sm" [style.background-image]="g.fill"></div>
                    <span class="text-[11px] font-extrabold">{{ g.name }}</span>
                  </button>
                }
              </div>
            </div>
          }

          @if (s.tabStickers) {
            <div class="flex flex-col gap-3">
              <span class="text-[12.5px] font-extrabold text-muted">Pixel-iconen</span>
              <div class="flex flex-wrap gap-[10px]">
                @for (st of s.stkIcons; track st.key) {
                  <div
                    draggable="true"
                    (dragstart)="st.onDragStart($event)"
                    (dragend)="st.onDragEnd()"
                    (click)="st.onClick()"
                    class="w-[52px] h-[52px] border-2 border-line rounded-[9px] bg-bg flex items-center justify-center cursor-grab shadow-hard-sm"
                  >
                    <cc-pix [shadow]="st.shadow" />
                  </div>
                }
              </div>
              <span class="text-[12.5px] font-extrabold text-muted">Tekstlabels</span>
              <div class="flex flex-wrap gap-2">
                @for (st of s.stkTexts; track st.key) {
                  <div
                    draggable="true"
                    (dragstart)="st.onDragStart($event)"
                    (dragend)="st.onDragEnd()"
                    (click)="st.onClick()"
                    class="border-2 border-coal rounded-[5px] px-[9px] py-[5px] font-pixel text-[13px] leading-none cursor-grab shadow-[2px_2px_0_#1A1C22]"
                    [style.background]="st.bg"
                    [style.color]="st.fg"
                  >
                    {{ st.text }}
                  </div>
                }
              </div>
              <div class="flex gap-[6px]">
                <input
                  [value]="s.stkText"
                  (input)="s.onStkText($event)"
                  placeholder="Eigen label…"
                  class="flex-1 min-w-0 border-2 border-line rounded-[9px] bg-bg px-[10px] py-[7px] font-bold text-[13px] outline-none"
                />
                <button (click)="s.addCustomStk()" class="chip bg-lcd text-lcd-ink"><span class="icon text-[16px]">add</span>Plaats</button>
              </div>
            </div>
          }

          @if (s.tabTemplates) {
            <div class="flex flex-col gap-[10px]">
              <span class="text-[12.5px] font-extrabold text-muted">Voor {{ s.fmtLabel }} · toepassen op de actieve pagina</span>
              <div class="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-3">
                @for (t of s.tpls; track t.key) {
                  <button (click)="t.apply()" class="lift-sm flex flex-col gap-[6px] bg-transparent border-0 p-0 text-left">
                    <div class="border-2 border-line rounded-[7px] p-[5px] shadow-hard-sm" [style.background]="t.frameBg">
                      <div class="grid gap-[3px]" [style.grid-template-columns]="'repeat(' + t.cols + ',1fr)'">
                        @for (c of t.cells; track c.key) {
                          <div class="aspect-[63/88] rounded-[2px] border-[1.5px] border-solid" [style.background]="c.bg" [style.border-color]="c.bd"></div>
                        }
                      </div>
                    </div>
                    <span class="text-[12px] font-black">{{ t.name }}</span>
                  </button>
                }
              </div>
            </div>
          }

          @if (s.tabSuggest) {
            <div class="flex flex-col gap-3">
              <h3 class="m-0 font-pixel font-semibold text-[15px] leading-none">Voorgestelde kaarten</h3>
              @if (s.noEmpties) {
                <div class="text-[13px] font-bold text-muted">Geen lege slots op deze spread. Blader verder of haal een kaart weg.</div>
              }
              @for (c of s.sugCards; track c.key) {
                <div
                  draggable="true"
                  (dragstart)="c.onDragStart($event)"
                  (dragend)="c.onDragEnd()"
                  class="flex items-center gap-[10px] py-2 border-t-2 border-dashed border-soft cursor-grab"
                >
                  <div class="w-10 flex-none aspect-[63/88] pointer-events-none"><cc-card [card]="c.cv" /></div>
                  <div class="flex-1 min-w-0 flex flex-col gap-1">
                    <span class="font-black text-[13.5px] whitespace-nowrap overflow-hidden text-ellipsis"
                      >{{ c.name }} <span class="font-pixel font-normal text-[11px] leading-none text-muted">{{ c.meta }}</span></span
                    >
                    <span class="self-start bg-lcd text-lcd-ink border-[1.5px] border-lcd-mid rounded px-[6px] py-[3px] text-[11px] font-black">{{ c.reason }}</span>
                    <span class="text-[11.5px] font-bold text-muted">{{ c.where }}</span>
                  </div>
                  <button (click)="c.place()" class="chip bg-red text-cream flex-none">Plaats</button>
                </div>
              }
              <h3 class="mt-[6px] mb-0 font-pixel font-semibold text-[15px] leading-none">Voorgestelde achtergronden</h3>
              <span class="text-[12px] font-bold text-muted">Gebaseerd op de kleuren van de kaarten op de actieve pagina.</span>
              <div class="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-3">
                @for (g of s.sugBgs; track g.key) {
                  <button (click)="g.apply()" class="lift-sm flex flex-col gap-[5px] bg-transparent border-0 p-0 text-left">
                    <div
                      class="relative w-full aspect-[3/4] border-2 border-line rounded-[7px] bg-[#FBF8EF] bg-cover shadow-hard-sm"
                      [style.background-image]="g.fill"
                    >
                      @if (g.hasLabel) {
                        <div
                          class="absolute left-1/2 bottom-2 -translate-x-1/2 bg-paper text-coal border-[1.5px] border-coal rounded px-[5px] py-[2px] font-pixel text-[9px] leading-none whitespace-nowrap"
                        >
                          {{ g.label }}
                        </div>
                      }
                    </div>
                    <span class="text-[11.5px] font-extrabold">{{ g.name }}</span>
                  </button>
                }
              </div>
            </div>
          }
        </aside>
      </div>
    </div>
  `,
})
export class EditorDeco {
  protected readonly v = inject(CardcaseStore).vals;
  protected readonly rings = [0, 1, 2];
}
