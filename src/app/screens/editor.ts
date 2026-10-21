import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CardcaseStore } from '../core/store';
import { Card } from '../shared/card';
import { BinderPage } from '../shared/binder-page';
import { Pix, Switch } from '../shared/bits';
import { EditorDeco } from './editor-deco';

/** Binder editor: plan cards into slots (cards mode) or decorate pages (deco mode). */
@Component({
  selector: 'cc-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, BinderPage, Pix, Switch, EditorDeco],
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
      <div class="flex flex-wrap items-center gap-x-[14px] gap-y-[10px]">
        <div class="grid grid-cols-2 gap-[2px] bg-line border-2 border-line rounded-[10px] overflow-hidden shadow-hard-md">
          <button
            (click)="s.setCardsMode()"
            class="flex items-center gap-[7px] border-0 px-4 py-[9px] font-pixel font-semibold text-[15px] leading-none"
            [style.background]="s.modeCards.bg"
            [style.color]="s.modeCards.fg"
          >
            <span class="icon text-[18px]">style</span>Kaarten
          </button>
          <button
            (click)="s.setDecoMode()"
            class="flex items-center gap-[7px] border-0 px-4 py-[9px] font-pixel font-semibold text-[15px] leading-none"
            [style.background]="s.modeDeco.bg"
            [style.color]="s.modeDeco.fg"
          >
            <span class="icon text-[18px]">palette</span>Decoreren
          </button>
        </div>
        <span class="text-[13px] font-bold text-muted text-pretty">{{ s.modeHint }}</span>
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
            <div class="flex items-center gap-2 flex-wrap min-w-0 max-w-full">
              <select
                [value]="s.autoSet"
                (change)="s.onAutoSet($event)"
                class="appearance-none max-w-full min-w-0 text-ellipsis bg-bg border-2 border-line rounded-[9px] px-3 py-[9px] font-extrabold text-[13px] cursor-pointer"
              >
                @for (g of s.setGroups; track g.key) {
                  <optgroup [label]="'Set · ' + g.label">
                    @for (o of g.sets; track o.key) {
                      <option [value]="'set:' + o.code" [selected]="'set:' + o.code === s.autoSet">Set: {{ o.name }} ▾</option>
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
                class="flex items-center gap-[6px] bg-lcd text-lcd-ink border-2 border-line rounded-[9px] shadow-[0_3px_0_var(--line)] active:translate-y-[2px] active:shadow-[0_1px_0_var(--line)] px-3 py-[7px] font-black text-[13px]"
              >
                <span class="icon text-[18px]">auto_awesome</span>Vul automatisch
              </button>
            </div>
            <button (click)="s.addPages()" class="bg-transparent border-2 border-dashed border-line rounded-[9px] px-[11px] py-[9px] font-extrabold text-[13px]">+ 2 pagina's</button>
            <button (click)="s.toggleShowPrice()" class="flex items-center gap-[9px] bg-transparent border-0 py-2 px-[2px] font-extrabold text-[13px]">
              <cc-switch [on]="s.spKnob === '22px'" />
              Toon waarde
            </button>
          </div>
          <div class="flex flex-wrap items-center gap-x-[18px] gap-y-2 text-[12.5px] font-extrabold text-muted">
            <span class="font-pixel font-normal text-[11px] leading-none tracking-[.1em]">LEGENDA</span>
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
              ><span class="w-4 h-[22px] border-2 border-lcd rounded-[3px] bg-[rgba(155,188,15,.35)] shadow-[0_0_0_2px_#306230]"></span>Drop-doel</span
            >
          </div>
          <div class="flex flex-wrap gap-2">
            @for (n of s.edNeed; track n.key) {
              <div class="flex items-center gap-2 bg-surface border-2 border-dashed border-line rounded-[9px] px-[10px] py-[6px] text-[13px] font-extrabold">
                <span class="icon text-[17px]">shopping_cart</span>{{ n.text }}
              </div>
            }
          </div>
          @if (s.hasSel) {
            <div class="lcd flex items-center gap-[10px] border-2 border-line rounded-[10px] px-3 py-[9px] text-[14px] leading-[1.3]">
              <span class="flex-1">TIK OP EEN SLOT OM {{ s.selName }} TE PLAATSEN</span>
              <button (click)="s.clearSel()" class="bg-lcd-ink text-lcd border-0 rounded-md px-[9px] py-[5px] font-pixel text-[13px] leading-none">ANNULEER</button>
            </div>
          }
          <div class="flex flex-wrap gap-5 items-start">
            <div class="flex-[3_1_520px] min-w-0 flex flex-col gap-3">
              <div class="flex items-center justify-center gap-[10px]">
                <button
                  (click)="s.edPrev()"
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
                  class="w-[38px] h-[38px] bg-surface border-2 border-line rounded-[10px] shadow-hard-sm flex items-center justify-center"
                  [style.opacity]="s.edNextOp"
                >
                  <span class="icon text-[22px]">chevron_right</span>
                </button>
              </div>
              <div
                class="flex items-stretch border-2 border-line rounded-[14px] p-[clamp(6px,1.3vw,14px)] shadow-[5px_5px_0_var(--line)]"
                [style.background]="s.ed.cover"
              >
                <div class="flex-[1_1_0] min-w-0 flex flex-col"><cc-binder-page [page]="s.edLeft" /></div>
                <div class="flex-none w-[clamp(14px,2.4vw,30px)] flex flex-col justify-evenly items-center">
                  @for (r of rings; track r) {
                    <div class="w-4/5 h-[26px] rounded-[7px] border-2 border-coal bg-[linear-gradient(90deg,#8E949C,#EEF1F3_50%,#8E949C)]"></div>
                  }
                </div>
                <div class="flex-[1_1_0] min-w-0 flex flex-col"><cc-binder-page [page]="s.edRight" /></div>
              </div>
              <div class="text-[13px] text-muted font-bold text-pretty">
                Sleep kaarten uit je collectie naar een slot. Sleep tussen slots om te wisselen, of terug naar de zijbalk om een kaart eruit te halen. Op
                touch: tik een kaart aan en daarna een slot. Tik op een leeg slot om het als buffer te reserveren, nog eens tikken maakt het weer leeg.
              </div>
            </div>
            <aside
              (dragover)="s.sideDragOver($event)"
              (dragleave)="s.sideDragLeave()"
              (drop)="s.sideDrop($event)"
              class="panel relative flex-[1_1_270px] min-w-0 p-[14px] flex flex-col gap-[10px] max-h-[640px]"
            >
              <div class="flex items-baseline justify-between">
                <h2 class="m-0 font-pixel font-semibold text-[18px] leading-none">Collectie</h2>
                <span class="text-[12px] font-extrabold text-muted">{{ s.sideCount }}</span>
              </div>
              <input
                [value]="s.sideQ"
                (input)="s.onSideQ($event)"
                placeholder="Zoek kaart…"
                class="border-2 border-line rounded-[9px] bg-bg px-[10px] py-2 font-bold text-[14px] outline-none"
              />
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
