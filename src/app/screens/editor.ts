import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CardcaseStore } from '../core/store';
import { Card } from '../shared/card';
import { BinderPage } from '../shared/binder-page';
import { PageTurn } from '../shared/page-turn';
import { Pix, Switch } from '../shared/bits';

/** Binder editor: cards, art and stickers onto the pages, from one panel; the rarely needed tools in the ⋯ menu. */
@Component({
  selector: 'cc-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, BinderPage, PageTurn, Pix, Switch],
  template: `
    @let s = v();
    <div class="flex flex-col gap-[14px]">
      <!-- One editor: cards, art and stickers all go onto the same pages, from one panel. -->
      <div class="flex flex-wrap items-center gap-[10px]">
        <button (click)="s.goBinders()" title="Terug" class="btn-icon"><span class="icon text-[20px]">arrow_back</span></button>
        <div class="flex flex-col gap-[3px] min-w-0 mr-auto">
          <div class="kicker">BINDER</div>
          <div class="flex items-center gap-2 min-w-0">
            <div class="font-black text-[22px] leading-[1.1] truncate">{{ s.ed.name }}</div>
            <button (click)="s.toggleEdMenu()" title="Naam en beschrijving aanpassen" class="flex-none w-7 h-7 rounded-md bg-surface border-2 border-line flex items-center justify-center"><span class="icon text-[16px]">edit</span></button>
          </div>
          @if (s.edNote) {
            <div class="text-[13px] font-bold text-muted truncate max-w-[520px]">{{ s.edNote }}</div>
          }
        </div>
        @if (s.edSum.has) {
          <div class="hidden sm:flex flex-col gap-[5px] min-w-[180px]">
            <div class="flex justify-between gap-3 text-[12.5px] font-extrabold">
              <span>{{ s.edSum.owned }}</span><span class="text-muted">{{ s.edSum.need }}</span>
            </div>
            <div class="h-2 rounded-full border-2 border-line bg-bg overflow-hidden"><div class="h-full bg-lcd-mid" [style.width]="s.edSum.pct"></div></div>
          </div>
        }
        <button (click)="s.openViewer()" class="btn"><span class="icon text-[19px]">visibility</span>Bekijk</button>
        <button (click)="s.toggleEdMenu()" title="Meer" class="btn-icon"><span class="icon text-[22px]">more_horiz</span></button>
      </div>
      @if (s.hasSel) {
        <div class="lcd flex items-center gap-[10px] border-2 border-line rounded-[10px] px-3 py-[9px] text-[14px] leading-[1.3]">
          <span class="flex-1">TIK OP EEN VAK OM {{ s.selName }} TE PLAATSEN</span>
          <button (click)="s.clearSel()" class="bg-lcd-ink text-lcd border-0 rounded-md px-[9px] py-[5px] font-pixel text-[13px] leading-none">ANNULEER</button>
        </div>
      }
      <div class="flex flex-wrap gap-5 items-start">
        <div class="flex-[3_1_520px] min-w-0 flex flex-col gap-3">
              <!-- Labels on the cards, switchable. -->
              <div class="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 -mb-1">
                <button (click)="s.toggleShowPrice()" class="flex items-center gap-[8px] bg-transparent border-0 p-0 font-extrabold text-[13px]">
                  <cc-switch [on]="s.showPrice" />Toon prijs
                </button>
                <button (click)="s.toggleShowOwn()" class="flex items-center gap-[8px] bg-transparent border-0 p-0 font-extrabold text-[13px]">
                  <cc-switch [on]="s.showOwn" />Toon bezit
                </button>
              </div>
              @if (s.wide) {
                <div class="flex items-center justify-center gap-[10px]">
                  <button
                    (click)="s.edPrev()"
                  data-turn="-1"
                  (dragover)="s.dragTurn($event, -1)"
                  (dragleave)="s.dragTurnLeave()"
                    title="Vorige pagina"
                    class="w-[38px] h-[38px] bg-surface border-2 border-line rounded-[10px] shadow-hard-sm flex items-center justify-center"
                    [style.opacity]="s.edPrevOp"
                  >
                    <span class="icon text-[22px]">chevron_left</span>
                  </button>
                  <div class="bg-device border-2 border-line rounded-lg p-1">
                    <div class="lcd rounded px-3 py-[6px] text-[14px] leading-none whitespace-nowrap">{{ s.ed.spreadLabel }}</div>
                  </div>
                  <button
                    (click)="s.edNext()"
                  data-turn="1"
                  (dragover)="s.dragTurn($event, 1)"
                  (dragleave)="s.dragTurnLeave()"
                    title="Volgende pagina"
                    class="w-[38px] h-[38px] bg-surface border-2 border-line rounded-[10px] shadow-hard-sm flex items-center justify-center"
                    [style.opacity]="s.edNextOp"
                  >
                    <span class="icon text-[22px]">chevron_right</span>
                  </button>
                </div>
                <div
                  class="w-full mx-auto flex items-stretch border-2 border-line rounded-[14px] p-[clamp(6px,1.3vw,14px)] shadow-[5px_5px_0_var(--line)]"
                  [style.background]="s.ed.cover"
                  [style.max-width]="s.ed.maxW"
                >
                  <div class="flex-[1_1_0] min-w-0 flex flex-col"><cc-binder-page [page]="s.edLeft" /></div>
                  <div class="flex-none w-[clamp(14px,2.4vw,30px)] flex flex-col justify-evenly items-center">
                    @for (r of rings; track r) {
                      <div class="w-4/5 h-[26px] rounded-[7px] border-2 border-coal bg-[linear-gradient(90deg,#8E949C,#EEF1F3_50%,#8E949C)]"></div>
                    }
                  </div>
                  <div class="flex-[1_1_0] min-w-0 flex flex-col"><cc-binder-page [page]="s.edRight" /></div>
                </div>
              } @else {
                <!-- Phone: one page at a time, big enough to recognize the cards; the arrows turn the page. -->
                <div class="flex items-center justify-center gap-[10px]">
                  <button
                    (click)="s.edTurnPrev()"
                  data-turn="-1"
                  (dragover)="s.dragTurn($event, -1)"
                  (dragleave)="s.dragTurnLeave()"
                    title="Vorige pagina"
                    class="w-[38px] h-[38px] bg-surface border-2 border-line rounded-[10px] shadow-hard-sm flex items-center justify-center"
                    [style.opacity]="s.edTurnPrevOp"
                  >
                    <span class="icon text-[22px]">chevron_left</span>
                  </button>
                  <div class="bg-device border-2 border-line rounded-lg p-1">
                    <div class="lcd rounded px-3 py-[6px] text-[14px] leading-none whitespace-nowrap">{{ s.edOne.label }}</div>
                  </div>
                  <button
                    (click)="s.edTurnNext()"
                  data-turn="1"
                  (dragover)="s.dragTurn($event, 1)"
                  (dragleave)="s.dragTurnLeave()"
                    title="Volgende pagina"
                    class="w-[38px] h-[38px] bg-surface border-2 border-line rounded-[10px] shadow-hard-sm flex items-center justify-center"
                    [style.opacity]="s.edTurnNextOp"
                  >
                    <span class="icon text-[22px]">chevron_right</span>
                  </button>
                </div>
                <cc-page-turn [page]="s.edOne.page" [leaf]="s.edOne.leaf" [angle]="s.edOne.angle" [cover]="s.ed.cover" />
              }
          <!-- What's selected, and what you can do with it. -->
          <div data-keep-sel class="min-h-[48px] flex flex-wrap items-center gap-x-[10px] gap-y-2 bg-surface border-2 border-line rounded-xl px-3 py-2">
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
            @if (!s.hasImgSel && !s.hasStkSel) {
              @if (s.edSel; as es) {
                <span class="font-pixel text-[11px] leading-none bg-red text-cream px-[6px] py-[4px] rounded-[4px]">{{ es.where }}</span>
                <span class="font-black text-[14px] mr-auto truncate">{{ es.name }}</span>
                @if (es.isCard) {
                  @if (es.canSwap) {
                    <button (click)="es.swap()" class="chip bg-surface text-ink"><span class="icon text-[16px]">swap_horiz</span>Andere versie</button>
                  }
                  <button (click)="es.remove()" class="chip bg-surface text-red"><span class="icon text-[16px]">delete</span>Uit de binder</button>
                } @else {
                  <span class="text-[12.5px] font-bold text-muted">Kies rechts een voorstel, of sleep er iets op</span>
                }
                <button (click)="es.deselect()" title="Sluiten" class="w-7 h-7 rounded-full bg-surface border-2 border-line flex items-center justify-center"><span class="icon text-[16px]">close</span></button>
              } @else {
                <span class="text-[13px] font-bold text-muted text-pretty">
                  Sleep kaarten, art en stickers uit het paneel op de pagina. Klik iets aan om het te bewerken; Backspace haalt het weg.
                </span>
              }
            }
          </div>
        </div>
        <aside
          data-keep-sel
          (dragover)="s.sideDragOver($event)"
          (dragleave)="s.sideDragLeave()"
          (drop)="s.sideDrop($event)"
          class="panel relative flex-[1_1_300px] md:max-w-[440px] min-w-0 p-[14px] flex flex-col gap-[10px] max-h-[calc(75vh/var(--z))] md:max-h-[calc(100dvh/var(--z)-60px)] md:sticky md:top-4"
        >
          <div class="grid grid-cols-3 gap-[2px] bg-line border-2 border-line rounded-[10px] overflow-hidden flex-none">
            @for (t of s.toolTabs; track t.key) {
              <button (click)="t.select()" class="flex items-center justify-center gap-[6px] border-0 px-2 py-[9px] font-pixel font-semibold text-[14px] leading-none" [class]="t.on ? 'bg-red text-cream' : 'bg-surface text-ink'">
                <span class="icon text-[18px]">{{ t.icon }}</span>{{ t.label }}
              </button>
            }
          </div>
          @if (s.toolCards) {
                @if (s.side; as sp) {
                  <!-- Search every card, always in view: typing shows the results below. -->
                  <label class="flex items-center gap-2 bg-bg border-2 border-line rounded-[10px] px-[10px] flex-none focus-within:shadow-[0_0_0_3px_#9BBC0F]">
                    <span class="icon text-[20px] text-muted">search</span>
                    <input
                      type="search"
                      [value]="s.sideQ"
                      (input)="s.onSideQ($event)"
                      placeholder="Zoek een kaart, bv. Pikachu"
                      aria-label="Zoek een kaart"
                      class="flex-1 min-w-0 border-0 outline-none bg-transparent py-[9px] font-bold text-[14px] [&::-webkit-search-cancel-button]:hidden"
                    />
                    @if (s.sideQ) {
                      <button (click)="s.clearSideQ()" title="Wissen" class="w-6 h-6 rounded-full bg-surface border-2 border-line flex items-center justify-center">
                        <span class="icon text-[15px]">close</span>
                      </button>
                    }
                  </label>
                  <!-- About the open binder: what's missing, what you own that fits, what to choose, or search everything. -->
                  <div class="grid gap-[2px] bg-line border-2 border-line rounded-[10px] overflow-hidden flex-none" [style.grid-template-columns]="'repeat(' + sp.cols + ', minmax(0,1fr))'">
                    @for (t of sp.tabs; track t.key) {
                      <button
                        (click)="t.select()"
                        class="flex flex-col items-center gap-[3px] border-0 px-1 py-[7px] font-extrabold text-[12.5px] leading-none"
                        [class]="t.on ? 'bg-red text-cream' : 'bg-surface text-ink'"
                      >
                        {{ t.label }}
                        @if (t.count) {
                          <span class="font-pixel text-[11px] leading-none" [class]="t.on ? 'text-cream' : 'text-muted'">{{ t.count }}</span>
                        }
                      </button>
                    }
                  </div>
                  @if (sp.isSlot && sp.slot; as sl) {
                    <!-- An empty slot is selected: what could go there. -->
                    <div class="flex items-center gap-2 flex-none">
                      <span class="font-pixel text-[11px] leading-none bg-red text-cream px-[6px] py-[4px] rounded-[4px]">{{ sl.where }}</span>
                      <span class="text-[13px] font-bold text-muted mr-auto">Leeg vak</span>
                      <button (click)="sl.reserve()" class="bg-surface border-2 border-line rounded-[8px] shadow-hard-sm px-[9px] py-[5px] font-extrabold text-[12px]">Reserveer als buffer</button>
                      <button (click)="sl.close()" title="Sluiten" class="bg-surface border-2 border-line rounded-[8px] shadow-hard-sm w-[30px] h-[30px] flex items-center justify-center">
                        <span class="icon text-[17px]">close</span>
                      </button>
                    </div>
                    <div class="flex flex-col gap-3 overflow-auto min-h-0 p-[2px]">
                      @if (sl.empty) {
                        <div class="text-[13px] font-bold text-muted text-pretty">Geen voorstel voor dit vak. Zoek een kaart onder Zoeken en sleep hem hierheen.</div>
                      }
                      @for (g of sl.groups; track g.key) {
                        <div class="flex flex-col gap-[6px]">
                          <div class="font-black text-[13.5px] leading-[1.25]">{{ g.title }}</div>
                          @for (it of g.items; track it.key) {
                            <div
                              draggable="true"
                              (dragstart)="it.onDragStart($event)"
                              (dragend)="it.onDragEnd()"
                              class="flex items-center gap-[10px] bg-bg border-2 border-line rounded-[9px] p-[6px] cursor-grab"
                            >
                              <div class="w-[42px] flex-none aspect-[63/88]"><cc-card [card]="it.cv" /></div>
                              <span class="flex-1 min-w-0 flex flex-col gap-[3px]">
                                <span class="font-black text-[13.5px] leading-[1.2] truncate">{{ it.name }}</span>
                                <span class="text-[11.5px] font-bold text-muted truncate">{{ it.sub }}</span>
                                <span class="text-[11px] font-extrabold truncate" [class]="it.owned ? 'text-lcd-mid' : 'text-muted'">{{ it.owned ? 'In bezit · ' : it.price + ' · ' }}{{ it.reason }}</span>
                              </span>
                              <button (click)="it.place()" class="flex-none bg-lcd text-lcd-ink border-2 border-line rounded-[8px] shadow-hard-sm px-[9px] py-[6px] font-black text-[12px]">Zet erin</button>
                            </div>
                          }
                        </div>
                      }
                    </div>
                  }
                  @if (sp.isNeed) {
                    <div class="flex flex-col gap-2 flex-none">
                      <div class="font-black text-[15px] leading-[1.25]">{{ sp.needHead }}</div>
                      @if (sp.needItems.length) {
                        <div class="flex items-center gap-2 flex-wrap">
                          <div class="grid grid-cols-2 gap-[2px] bg-line border-2 border-line rounded-[8px] overflow-hidden">
                            <button (click)="sp.sortBinder()" class="border-0 px-[9px] py-[6px] font-extrabold text-[12px]" [class]="sp.needSortBinder ? 'bg-lcd text-lcd-ink' : 'bg-surface text-ink'">Binder-volgorde</button>
                            <button (click)="sp.sortPrice()" class="border-0 px-[9px] py-[6px] font-extrabold text-[12px]" [class]="!sp.needSortBinder ? 'bg-lcd text-lcd-ink' : 'bg-surface text-ink'">Duurste eerst</button>
                          </div>
                          <button (click)="sp.copyNeed()" class="ml-auto flex items-center gap-[5px] bg-surface border-2 border-line rounded-[8px] shadow-hard-sm px-[9px] py-[5px] font-extrabold text-[12px]">
                            <span class="icon text-[16px]">content_copy</span>Kopieer lijst
                          </button>
                        </div>
                      }
                    </div>
                    <div class="flex flex-col gap-[6px] overflow-auto min-h-0 p-[2px]">
                      @for (it of sp.needItems; track it.key) {
                        <button (click)="it.jump()" title="Ga naar dit slot" class="flex items-center gap-[10px] bg-bg border-2 border-line rounded-[9px] p-[6px] text-left">
                          <div class="w-[42px] flex-none aspect-[63/88]"><cc-card [card]="it.cv" /></div>
                          <span class="flex-1 min-w-0 flex flex-col gap-[3px]">
                            <span class="font-black text-[13.5px] leading-[1.2] truncate">{{ it.name }}</span>
                            <span class="text-[11.5px] font-bold text-muted truncate">{{ it.sub }}</span>
                            <span class="font-pixel text-[10px] leading-none text-muted">{{ it.where }}</span>
                          </span>
                          <span class="font-pixel font-semibold text-[14px] leading-none flex-none">{{ it.price }}</span>
                        </button>
                      }
                      @if (sp.needMore) {
                        <div class="text-[12px] font-bold text-muted text-center py-1">{{ sp.needMore }}</div>
                      }
                    </div>
                  }
                  @if (sp.isHave) {
                    <div class="text-[13px] font-bold text-muted text-pretty flex-none">{{ sp.haveHead }}</div>
                    <div class="flex flex-col gap-[6px] overflow-auto min-h-0 p-[2px]">
                      @for (it of sp.haveItems; track it.key) {
                        <div
                          draggable="true"
                          (dragstart)="it.onDragStart($event)"
                          (dragend)="it.onDragEnd()"
                          (click)="it.onPick()"
                          class="flex items-center gap-[10px] bg-bg border-2 rounded-[9px] p-[6px] cursor-grab"
                          [class]="it.picked ? 'border-lcd-mid' : 'border-line'"
                        >
                          <div class="w-[42px] flex-none aspect-[63/88]"><cc-card [card]="it.cv" /></div>
                          <span class="flex-1 min-w-0 flex flex-col gap-[3px]">
                            <span class="font-black text-[13.5px] leading-[1.2] truncate">{{ it.name }}</span>
                            <span class="text-[11.5px] font-bold text-muted truncate">{{ it.sub }}</span>
                            <span class="text-[11px] font-extrabold text-muted truncate">{{ it.targetLabel }}</span>
                          </span>
                          @if (it.hasTarget) {
                            <button (click)="it.replace(); $event.stopPropagation()" class="flex-none bg-lcd text-lcd-ink border-2 border-line rounded-[8px] shadow-hard-sm px-[9px] py-[6px] font-black text-[12px]">Zet erin</button>
                          }
                        </div>
                      }
                    </div>
                  }
                  @if (sp.isPick) {
                    <div class="text-[13px] font-bold text-muted flex-none">{{ sp.pickHead }}</div>
                    <div class="flex flex-col gap-3 overflow-auto min-h-0 p-[2px]">
                      @for (g of sp.pickGroups; track g.key) {
                        <div class="flex flex-col gap-[6px]">
                          <div class="font-black text-[13.5px] leading-[1.25]">{{ g.title }}</div>
                          @for (it of g.items; track it.key) {
                            <button (click)="it.open()" class="flex items-center gap-[10px] bg-bg border-2 border-line rounded-[9px] p-[6px] text-left">
                              <div class="w-[42px] flex-none aspect-[63/88]"><cc-card [card]="it.cv" /></div>
                              <span class="flex-1 min-w-0 flex flex-col gap-[3px]">
                                <span class="font-black text-[13.5px] leading-[1.2] truncate">{{ it.name }}</span>
                                <span class="text-[11.5px] font-bold text-muted truncate">{{ it.sub }}</span>
                                <span class="font-pixel text-[10px] leading-none text-muted">{{ it.where }}</span>
                              </span>
                              <span
                                class="flex-none border-[1.5px] border-line rounded-[4px] px-[5px] py-[3px] font-pixel text-[10px] leading-none"
                                [class]="it.isWarn ? 'bg-amber text-coal' : 'bg-lcd text-lcd-ink'"
                                >{{ it.label }}</span
                              >
                            </button>
                          }
                        </div>
                      }
                    </div>
                  }
                  @if (sp.isSearch) {
                    <div class="flex items-baseline justify-end flex-none">
                      <span class="text-[12px] font-extrabold text-muted">{{ s.sideCount }}</span>
                    </div>
                    <!-- Language of the cards found; "pikachu" also finds ピカチュウ. -->
                    <div class="grid grid-cols-5 gap-[2px] bg-line border-2 border-line rounded-[9px] overflow-hidden flex-none">
                      @for (l of s.sideLangChips; track l.key) {
                        <button (click)="l.select()" class="border-0 py-[6px] font-pixel font-semibold text-[13px] leading-none" [class]="l.on ? 'bg-red text-cream' : 'bg-surface text-ink'">{{ l.label }}</button>
                      }
                    </div>
                    <select
                      [value]="s.sideSet"
                      (change)="s.onSideSet($event)"
                      class="appearance-none bg-bg border-2 border-line rounded-[9px] px-[10px] py-[7px] font-extrabold text-[13px] cursor-pointer"
                    >
                      <option value="">Alle sets ▾</option>
                      @for (g of s.setGroups; track g.key) {
                        <optgroup [label]="g.label">
                          @for (o of g.sets; track o.key) {
                            <option [value]="o.code" [selected]="o.code === s.sideSet">{{ o.name }}</option>
                          }
                        </optgroup>
                      }
                    </select>
                    <div class="grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-x-[10px] gap-y-3 overflow-auto p-1 pb-[6px]">
                      @for (it of s.sideItems; track it.key) {
                        <div
                          draggable="true"
                          (dragstart)="it.onDragStart($event)"
                          (dragend)="it.onDragEnd()"
                          (click)="it.onClick()"
                          class="flex flex-col gap-1 cursor-grab outline-[3px] outline-solid outline-offset-2 rounded-[7px]"
                          [style.opacity]="it.op"
                          [style.outline-color]="it.bd"
                        >
                          <div class="aspect-[63/88] pointer-events-none"><cc-card [card]="it.cv" /></div>
                          <div class="flex justify-between gap-1 text-[10.5px] font-extrabold pointer-events-none">
                            <span class="font-pixel font-normal">{{ it.num }}</span><span [style.color]="it.labelColor">{{ it.label }}</span>
                          </div>
                        </div>
                      }
                    </div>
                  }
                }
          }
          @if (s.toolArt) {
            <div class="flex flex-col gap-4 overflow-auto min-h-0 p-[2px]">
              <div class="flex flex-col gap-3">
                <span class="font-pixel font-semibold text-[14px] leading-none">Art in de vakken</span>
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
                      <div class="relative aspect-square border-2 border-line rounded-[7px] bg-cover bg-center shadow-hard-sm" [style.background-image]="i.fill">
                        @if (i.canDelete) {
                          <button (click)="i.remove($event)" title="Verwijder uit je afbeeldingen" class="absolute -top-[7px] -right-[7px] w-6 h-6 rounded-full bg-surface border-2 border-line flex items-center justify-center"><span class="icon text-[14px]">close</span></button>
                        }
                      </div>
                      <span class="text-[11px] font-extrabold whitespace-nowrap overflow-hidden text-ellipsis">{{ i.name }}</span>
                    </div>
                  }
                </div>
                <div class="font-mono font-medium text-[11px] leading-[1.4] text-muted">placeholders · vervang door eigen beeld via upload</div>
              </div>
              </div>
              <div class="flex flex-col gap-3">
                <span class="font-pixel font-semibold text-[14px] leading-none">Achtergrond van de pagina</span>
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
              </div>
              <div class="flex flex-col gap-3">
                <span class="font-pixel font-semibold text-[14px] leading-none">Templates</span>
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
              </div>
            </div>
          }
          @if (s.toolStickers) {
            <div class="overflow-auto min-h-0 p-[2px]">
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
            </div>
          }
              @if (s.isDraggingSlot) {
                <div
                  class="absolute inset-0 rounded-[10px] border-[3px] border-dashed border-red flex items-center justify-center text-center p-5 font-pixel text-[16px] leading-[1.4] text-ink pointer-events-none"
                  [style.background]="s.sideZoneBg"
                >
                  LAAT LOS OM UIT<br />DE BINDER TE HALEN
                </div>
              }
        </aside>
      </div>
    </div>

    <!-- Everything you rarely need: the recipe, page format and pages, filling, and the other tools. -->
    @if (s.edMenu) {
      <div data-keep-sel (click)="s.toggleEdMenu()" class="fixed inset-0 z-[60] bg-[rgba(0,0,0,.45)] flex items-end md:items-start md:justify-end justify-center md:p-6">
        <div
          (click)="$event.stopPropagation()"
          class="w-full max-w-[460px] max-h-[calc(88vh/var(--z))] overflow-auto bg-bg text-ink border-2 border-line rounded-t-[22px] md:rounded-[18px] px-4 pt-4 pb-[calc(20px+env(safe-area-inset-bottom))] flex flex-col gap-4 shadow-[5px_5px_0_var(--line)]"
        >
          <div class="flex items-center justify-between">
            <span class="kicker">{{ s.ed.name }}</span>
            <button (click)="s.toggleEdMenu()" title="Sluiten" class="w-8 h-8 rounded-full bg-surface border-2 border-line flex items-center justify-center"><span class="icon text-[18px]">close</span></button>
          </div>
          <label class="flex flex-col gap-[6px]">
            <span class="text-[13px] font-extrabold text-muted">Naam</span>
            <input [value]="s.ed.name" (change)="s.onEdName($event)" maxlength="40" class="border-2 border-line rounded-[9px] bg-surface px-3 py-2 font-extrabold text-[15px] outline-none focus:shadow-[0_0_0_3px_#9BBC0F]" />
          </label>
          <label class="flex flex-col gap-[6px]">
            <span class="text-[13px] font-extrabold text-muted">Beschrijving</span>
            <textarea
              [value]="s.edNote"
              (change)="s.onEdNote($event)"
              maxlength="140"
              rows="2"
              placeholder="Waar gaat deze binder over? Bv. mijn favoriete Kanto-IR's, op dex-volgorde"
              class="border-2 border-line rounded-[9px] bg-surface px-3 py-2 font-bold text-[14px] outline-none resize-none focus:shadow-[0_0_0_3px_#9BBC0F]"
            ></textarea>
          </label>
          @if (s.hasRecipe) {
            <div class="panel flex flex-col gap-3 px-[14px] py-3">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-[46px] h-[46px] flex-none rounded-[10px] bg-lcd border-2 border-line flex items-center justify-center">
                  <cc-pix [shadow]="s.rcCard.shadow" />
                </div>
                <div class="flex flex-col gap-1 min-w-0">
                  <span class="font-pixel text-[11px] leading-none text-muted tracking-[.1em]">RECEPT</span>
                  <span class="font-pixel font-semibold text-[14px] leading-[1.25]">{{ s.rcCard.label }}</span>
                  <span class="text-[12.5px] font-bold text-muted">{{ s.rcCard.stats }}</span>
                </div>
              </div>
              <button (click)="s.toggleSuggest()" class="flex items-center gap-[10px] bg-transparent border-0 p-0 font-extrabold text-[14px] text-left text-ink">
                <cc-switch [on]="s.sgKnob === '22px'" />Stel nieuwe kaarten voor die passen
              </button>
              @if (s.rcCard.hasNew) {
                <button
                  (click)="s.openNewSug()"
                  class="flex items-center gap-2 bg-surface text-ink border-2 border-line rounded-[10px] shadow-hard-sm py-[7px] pr-3 pl-[7px] font-black text-[13px]"
                >
                  <span
                    class="min-w-6 h-6 px-[6px] rounded-full bg-red text-cream border-2 border-line flex items-center justify-center font-pixel font-semibold text-[13px] leading-none"
                    >{{ s.rcCard.newCount }}</span
                  >{{ s.rcCard.newText }}
                </button>
              }
            </div>
          }
          <div class="flex flex-col gap-2">
            <span class="text-[13px] font-extrabold text-muted">Pagina-formaat</span>
              <div class="grid grid-cols-4 sm:grid-cols-[repeat(4,auto)] gap-[2px] bg-line border-2 border-line rounded-[9px] overflow-hidden">
                @for (f of s.fmtOptions; track f.key) {
                  <button
                    (click)="f.select()"
                    class="border-0 px-[11px] py-[10px] font-pixel font-semibold text-[14px] leading-none whitespace-nowrap"
                    [style.background]="f.bg"
                    [style.color]="f.fg"
                  >
                    {{ f.label }}
                  </button>
                }
              </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <button (click)="s.addPages()" class="btn"><span class="icon text-[19px]">note_add</span>2 pagina's erbij</button>
          </div>
          @if (!s.isRecipeBinder) {
            <div class="flex flex-col gap-2">
              <span class="text-[13px] font-extrabold text-muted">Lege vakken vullen, vanaf de pagina die open staat</span>
                    <select
                      [value]="s.autoSet"
                      (change)="s.onAutoSet($event)"
                      class="appearance-none w-full min-w-0 text-ellipsis bg-bg border-2 border-line rounded-[9px] px-3 py-[9px] font-extrabold text-[13px] cursor-pointer"
                    >
                      <option value="" disabled [selected]="!s.autoSet">Kies waarmee… ▾</option>
                      @for (g of s.setGroups; track g.key) {
                        <optgroup [label]="'Set · ' + g.label">
                          @for (o of g.sets; track o.key) {
                            <option [value]="'set:' + o.code" [selected]="'set:' + o.code === s.autoSet">Set: {{ o.name }}</option>
                          }
                        </optgroup>
                      }
                      <optgroup label="Type">
                        <option value="type:fire">Type: Fire (in bezit)</option>
                        <option value="type:water">Type: Water (in bezit)</option>
                        <option value="type:grass">Type: Grass (in bezit)</option>
                        <option value="type:electric">Type: Lightning (in bezit)</option>
                        <option value="type:psychic">Type: Psychic (in bezit)</option>
                        <option value="type:fighting">Type: Fighting (in bezit)</option>
                        <option value="type:dark">Type: Darkness (in bezit)</option>
                        <option value="type:metal">Type: Metal (in bezit)</option>
                        <option value="type:dragon">Type: Dragon (in bezit)</option>
                        <option value="type:colorless">Type: Colorless (in bezit)</option>
                      </optgroup>
                      <optgroup label="Taal">
                        <option value="lang:EN">Taal: Engels (in bezit)</option>
                        <option value="lang:DE">Taal: Duits (in bezit)</option>
                        <option value="lang:JA">Taal: Japans (in bezit)</option>
                        <option value="lang:ZH">Taal: Chinees (in bezit)</option>
                      </optgroup>
                      <optgroup label="Overig">
                        <option value="top">Meest waardevol (in bezit)</option>
                        <option value="dupes">Dubbelen</option>
                        <option value="want">Wantlist (mist nog)</option>
                      </optgroup>
                    </select>
              <button
                (click)="s.autofill()"
                [disabled]="!s.autoSet"
                class="self-start flex items-center gap-[6px] bg-lcd text-lcd-ink border-2 border-line rounded-[9px] shadow-[0_3px_0_var(--line)] px-3 py-[7px] font-black text-[13px] disabled:opacity-45"
              >
                <span class="icon text-[18px]">auto_awesome</span>Vullen
              </button>
            </div>
          }
          <div class="flex flex-col gap-2">
            @for (a of actions; track a.label) {
              <button (click)="run(a.go(s))" class="btn justify-start py-3 text-[15px]">
                <span class="icon text-[21px]">{{ a.icon }}</span>{{ a.label }}
              </button>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class EditorScreen {
  protected readonly v = inject(CardcaseStore).vals;
  protected readonly rings = [0, 1, 2];
  protected readonly actions = [
    { label: 'Verschuiven', icon: 'low_priority', go: (s: any) => s.goShift },
    { label: 'Pagina scannen', icon: 'document_scanner', go: (s: any) => s.goPageScan },
    { label: 'Printvel voor de art', icon: 'print', go: (s: any) => s.goPrint },
    { label: 'Deel als afbeelding', icon: 'ios_share', go: (s: any) => s.openShare },
    { label: 'Exporteer als afbeelding', icon: 'download', go: (s: any) => s.exportImg },
  ];

  protected run(action: () => void) {
    this.v().toggleEdMenu();
    action();
  }
}
