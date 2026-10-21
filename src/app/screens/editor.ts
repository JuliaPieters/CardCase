import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CardcaseStore } from '../core/store';
import { Card } from '../shared/card';
import { BinderPage } from '../shared/binder-page';
import { PageTurn } from '../shared/page-turn';
import { Pix, Switch } from '../shared/bits';
import { EditorDeco } from './editor-deco';

/** Binder editor: plan cards into slots (cards mode) or decorate pages (deco mode). */
@Component({
  selector: 'cc-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, BinderPage, PageTurn, Pix, Switch, EditorDeco],
  template: `
    @let s = v();
    <div class="flex flex-col gap-[14px]">
      <div class="flex flex-wrap items-center gap-[10px]">
        <button (click)="s.goBinders()" title="Terug" class="btn-icon"><span class="icon text-[20px]">arrow_back</span></button>
        <div class="flex flex-col gap-[3px] min-w-0 mr-auto">
          <div class="kicker">BINDER-EDITOR</div>
          <div class="font-black text-[22px] leading-[1.1]">{{ s.ed.name }}</div>
        </div>
        @if (s.wide) {
          <button (click)="s.goShift()" class="btn"><span class="icon text-[19px]">low_priority</span>Verschuiven</button>
          <button (click)="s.goPageScan()" class="btn"><span class="icon text-[19px]">document_scanner</span>Pagina scannen</button>
          <button (click)="s.goCreate()" class="btn"><span class="icon text-[19px]">add</span>Binder aanmaken</button>
          <button (click)="s.openViewer()" class="btn"><span class="icon text-[19px]">visibility</span>Bekijk</button>
          <button
            (click)="s.exportImg()"
            class="press-sm flex items-center gap-[6px] bg-red text-cream border-2 border-line rounded-[10px] shadow-[0_4px_0_var(--line)] px-[14px] py-2 font-black text-[14px]"
          >
            <span class="icon text-[19px]">download</span>Exporteer als afbeelding
          </button>
        } @else {
          <button (click)="s.openViewer()" title="Bekijk" class="btn-icon"><span class="icon text-[21px]">visibility</span></button>
          <button (click)="menu.set(true)" title="Meer acties" class="btn-icon"><span class="icon text-[22px]">more_horiz</span></button>
        }
      </div>
      <!-- The two ways to work on a binder, as big tabs so decorating isn't overlooked. -->
      <div class="grid grid-cols-2 gap-[2px] bg-line border-2 border-line rounded-[12px] overflow-hidden shadow-hard-md md:max-w-[620px]">
        <button
          (click)="s.setCardsMode()"
          class="flex items-center gap-3 border-0 px-4 py-3 text-left"
          [style.background]="s.modeCards.bg"
          [style.color]="s.modeCards.fg"
        >
          <span class="icon text-[26px]">style</span>
          <span class="flex flex-col gap-[3px] min-w-0">
            <span class="font-pixel font-semibold text-[16px] leading-none">Kaarten</span>
            <span class="text-[12px] font-bold leading-[1.25] opacity-85">Welke kaart in welk slot</span>
          </span>
        </button>
        <button
          (click)="s.setDecoMode()"
          class="flex items-center gap-3 border-0 px-4 py-3 text-left"
          [style.background]="s.modeDeco.bg"
          [style.color]="s.modeDeco.fg"
        >
          <span class="icon text-[26px]">palette</span>
          <span class="flex flex-col gap-[3px] min-w-0">
            <span class="font-pixel font-semibold text-[16px] leading-none">Decoreren</span>
            <span class="text-[12px] font-bold leading-[1.25] opacity-85">Achtergrond, afbeeldingen, stickers</span>
          </span>
        </button>
      </div>

      @if (s.isCardsMode) {
        <div class="flex flex-col gap-[14px]">
          @if (s.hasRecipe) {
            <div class="panel flex flex-wrap items-center gap-x-[18px] gap-y-3 px-[14px] py-3">
              <div class="flex items-center gap-3 flex-[1_1_320px] min-w-0">
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
          <div class="flex flex-wrap items-center gap-x-[18px] gap-y-3 bg-surface border-2 border-line rounded-xl shadow-hard-md px-3 py-[10px]">
            <div class="flex flex-col items-stretch gap-[6px] w-full sm:w-auto sm:flex-row sm:items-center sm:gap-2">
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
            <!-- Rarely needed (a recipe fills its binder itself), so behind one button. -->
            @if (!s.isRecipeBinder) {
              <div class="relative">
                <button (click)="s.toggleFillMenu()" class="flex items-center gap-[6px] bg-transparent border-2 border-line rounded-[9px] px-[11px] py-[8px] font-extrabold text-[13px]">
                  <span class="icon text-[18px]">auto_awesome</span>Lege vakken vullen…
                </button>
                @if (s.fillMenu) {
                  <div class="panel absolute left-0 top-full mt-2 z-[20] w-[min(320px,85vw)] p-3 flex flex-col gap-[10px]">
                    <span class="text-[13px] font-bold text-muted text-pretty">Zet kaarten in de lege vakken, vanaf de pagina die nu open staat:</span>
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
                    <div class="flex gap-2 justify-end">
                      <button (click)="s.toggleFillMenu()" class="btn">Annuleer</button>
                      <button
                        (click)="s.autofill()"
                        [disabled]="!s.autoSet"
                        class="flex items-center gap-[6px] bg-lcd text-lcd-ink border-2 border-line rounded-[9px] shadow-[0_3px_0_var(--line)] px-3 py-[7px] font-black text-[13px] disabled:opacity-45"
                      >
                        <span class="icon text-[18px]">auto_awesome</span>Vullen
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
            <button (click)="s.addPages()" class="bg-transparent border-2 border-dashed border-line rounded-[9px] px-[11px] py-[9px] font-extrabold text-[13px]">+ 2 pagina's</button>
            <button (click)="s.toggleShowPrice()" class="flex items-center gap-[9px] bg-transparent border-0 py-2 px-[2px] font-extrabold text-[13px]">
              <cc-switch [on]="s.spKnob === '22px'" />
              Toon waarde
            </button>
          </div>
          @if (s.edSum.has) {
            <div class="panel flex flex-col gap-2 px-[14px] py-3">
              <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span class="font-black text-[15px]">{{ s.edSum.owned }}</span>
                <span class="text-[13px] font-extrabold text-muted">{{ s.edSum.need }}</span>
              </div>
              <div class="h-[10px] rounded-full border-2 border-line bg-bg overflow-hidden">
                <div class="h-full bg-lcd-mid" [style.width]="s.edSum.pct"></div>
              </div>
              @if (s.edSum.warns) {
                <div class="flex items-center gap-2 text-[12.5px] font-bold text-muted">
                  <span class="flex-none bg-amber text-coal border-[1.5px] border-line rounded-[4px] px-[5px] py-[3px] font-pixel text-[10px] leading-none">{{ s.edSum.warnLabel }}</span
                  >{{ s.edSum.warns }} Pokémon hebben die versie niet · daar staat hun gewone kaart
                </div>
              }
            </div>
          }
          <details class="text-[12.5px] font-extrabold text-muted">
            <summary class="cursor-pointer font-pixel font-normal text-[11px] leading-none tracking-[.1em] py-1">LEGENDA</summary>
            <div class="flex flex-wrap items-center gap-x-[18px] gap-y-2 pt-2">
            <span class="flex items-center gap-[7px]"><span class="w-4 h-[22px] border-2 border-line rounded-[3px] bg-[oklch(0.80_0.11_40)]"></span>In bezit</span>
            <span class="flex items-center gap-[7px]"><span class="w-4 h-[22px] border-2 border-line rounded-[3px] bg-[#bdb9b0] opacity-45"></span>Gepland · mist nog</span>
            <span class="flex items-center gap-[7px]"
              ><span
                class="w-4 h-[22px] border-2 border-dashed border-ink rounded-[3px] flex items-center justify-center bg-[repeating-linear-gradient(135deg,rgba(127,120,100,.3)_0_3px,transparent_3px_6px)]"
                ><span class="w-[7px] h-[6px] bg-ink"></span></span
              >Gereserveerd · buffer of verwacht</span
            >
            <span class="flex items-center gap-[7px]"
              ><span class="w-4 h-[22px] border-2 border-line rounded-[3px] bg-[linear-gradient(180deg,#D8F5A2,#9BBC0F_50%,#306230)]"></span>Decoratie</span
            >
            <span class="flex items-center gap-[7px]"><span class="w-4 h-[22px] border-2 border-dashed border-muted rounded-[3px] opacity-55"></span>Leeg</span>
            <span class="flex items-center gap-[7px]"
              ><span class="flex-none bg-amber text-coal border-[1.5px] border-line rounded-[4px] px-[5px] py-[3px] font-pixel text-[10px] leading-none">GEEN IR</span
                  >Andere versie · de gekozen versie bestaat niet</span
            >
            <span class="flex items-center gap-[7px]"
              ><span class="w-4 h-[22px] border-2 border-lcd rounded-[3px] bg-[rgba(155,188,15,.35)] shadow-[0_0_0_2px_#306230]"></span>Drop-doel</span
            >
            </div>
          </details>
          @if (s.hasSel) {
            <div class="lcd flex items-center gap-[10px] border-2 border-line rounded-[10px] px-3 py-[9px] text-[14px] leading-[1.3]">
              <span class="flex-1">TIK OP EEN SLOT OM {{ s.selName }} TE PLAATSEN</span>
              <button (click)="s.clearSel()" class="bg-lcd-ink text-lcd border-0 rounded-md px-[9px] py-[5px] font-pixel text-[13px] leading-none">ANNULEER</button>
            </div>
          }
          <div class="flex flex-wrap gap-5 items-start">
            <div class="flex-[3_1_520px] min-w-0 flex flex-col gap-3">
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
              <div class="text-[13px] text-muted font-bold text-pretty">
                Sleep kaarten uit je collectie naar een slot. Sleep tussen slots om te wisselen, of terug naar de zijbalk om een kaart eruit te halen. Op
                touch: tik een kaart aan en daarna een slot. Klik op een leeg vak voor voorstellen in het paneel. Klik een kaart of art aan en druk op Backspace (of de ×) om hem weg te halen.
              </div>
            </div>
            <aside
              (dragover)="s.sideDragOver($event)"
              (dragleave)="s.sideDragLeave()"
              (drop)="s.sideDrop($event)"
              class="panel relative flex-[1_1_300px] md:max-w-[440px] min-w-0 p-[14px] flex flex-col gap-[10px] max-h-[75vh] md:max-h-[calc(100dvh-60px)] md:sticky md:top-4"
            >
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
                  <div class="flex flex-col gap-[6px] overflow-auto min-h-0 p-[2px]">
                    @for (it of sp.picks; track it.key) {
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
                @if (sp.isSearch) {
                  <div class="flex items-baseline justify-end flex-none">
                    <span class="text-[12px] font-extrabold text-muted">{{ s.sideCount }}</span>
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
      }
      @if (s.isDecoMode) {
        <cc-editor-deco />
      }
    </div>

    @if (menu() && s.narrow) {
      <div (click)="menu.set(false)" class="fixed inset-0 z-[60] bg-[rgba(0,0,0,.45)] flex items-end justify-center">
        <div
          (click)="$event.stopPropagation()"
          class="w-full max-w-[560px] bg-bg text-ink border-2 border-b-0 border-line rounded-t-[22px] px-4 pt-[10px] pb-[calc(20px+env(safe-area-inset-bottom))] flex flex-col gap-[10px] animate-up [animation-duration:.3s] [animation-timing-function:cubic-bezier(.2,.9,.3,1)]"
        >
          <div class="w-11 h-[5px] rounded-[3px] bg-muted opacity-50 self-center"></div>
          <div class="kicker mt-1">{{ s.ed.name }}</div>
          @for (a of actions; track a.label) {
            <button (click)="run(a.go(s))" class="btn justify-start py-3 text-[15px]">
              <span class="icon text-[21px]">{{ a.icon }}</span>{{ a.label }}
            </button>
          }
          <button
            (click)="run(s.exportImg)"
            class="press-sm flex items-center gap-[6px] bg-red text-cream border-2 border-line rounded-[10px] shadow-[0_4px_0_var(--line)] px-3 py-3 font-black text-[15px]"
          >
            <span class="icon text-[21px]">download</span>Exporteer als afbeelding
          </button>
        </div>
      </div>
    }
  `,
})
export class EditorScreen {
  protected readonly v = inject(CardcaseStore).vals;
  protected readonly rings = [0, 1, 2];
  /** Phone-only action sheet for the header buttons that don't fit next to the title. */
  protected readonly menu = signal(false);
  protected readonly actions = [
    { label: 'Verschuiven', icon: 'low_priority', go: (s: any) => s.goShift },
    { label: 'Pagina scannen', icon: 'document_scanner', go: (s: any) => s.goPageScan },
    { label: 'Binder aanmaken', icon: 'add', go: (s: any) => s.goCreate },
  ];

  protected run(action: () => void) {
    this.menu.set(false);
    action();
  }
}
