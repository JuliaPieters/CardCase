import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { CardcaseStore } from '../core/store';
import { BinderPage } from '../shared/binder-page';
import { Switch } from '../shared/bits';

/** Manual binder creation form with a live preview of the first spreads. */
@Component({
  selector: 'cc-create',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, BinderPage, Switch],
  template: `
    @let s = v();
    <div class="flex flex-col gap-[18px]">
      <div class="flex items-center gap-3">
        <button (click)="s.goBinders()" title="Terug" class="btn-icon"><span class="icon text-[20px]">arrow_back</span></button>
        <div class="flex flex-col gap-[3px] min-w-0">
          <div class="kicker">BINDER AANMAKEN</div>
          <h1 class="m-0 text-[clamp(22px,3.4vw,28px)] font-black leading-[1.15] text-pretty">Nieuwe binder</h1>
        </div>
      </div>
      <div class="flex flex-wrap gap-6 items-start">
        <div class="panel flex-[1_1_320px] max-w-[480px] min-w-0 p-[18px] flex flex-col gap-[18px]">
          <div class="flex flex-col gap-2">
            <span class="text-[13px] font-extrabold text-muted">Soort binder</span>
            <div class="grid grid-cols-2 gap-2">
              @for (k of s.kindOpts; track k.key) {
                <button
                  (click)="k.select()"
                  class="flex flex-col gap-[5px] text-left px-[11px] py-[10px] border-2 border-line rounded-[10px]"
                  [style.background]="k.bg"
                  [style.color]="k.fg"
                  [style.box-shadow]="k.sh"
                >
                  <span class="flex items-center gap-[6px] font-pixel font-semibold text-[14px] leading-none"
                    ><span class="icon text-[18px]">{{ k.icon }}</span>{{ k.label }}</span
                  >
                  <span class="text-[11.5px] font-bold leading-[1.3] opacity-85">{{ k.desc }}</span>
                </button>
              }
            </div>
          </div>
          <label class="flex flex-col gap-[7px]">
            <span class="text-[13px] font-extrabold text-muted">Naam</span>
            <input
              [value]="s.crName"
              (input)="s.onCrName($event)"
              [placeholder]="'Bijv. ' + s.setOpts[0].name + ' Master'"
              class="border-2 border-line rounded-[10px] bg-bg px-3 py-[10px] font-extrabold text-[16px] outline-none"
            />
          </label>
          <div class="flex flex-col gap-2">
            <span class="text-[13px] font-extrabold text-muted">Cover</span>
            <div class="flex flex-wrap gap-3">
              @for (c of s.coverOpts; track c.key) {
                <button
                  (click)="c.select()"
                  class="relative w-[42px] h-[54px] border-2 border-line rounded-[3px_9px_9px_3px] p-0 outline-[3px] outline-solid outline-offset-[3px] shadow-hard-sm"
                  [style.background]="c.color"
                  [style.outline-color]="c.ring"
                >
                  <span class="absolute left-0 top-0 bottom-0 w-[9px] bg-[rgba(0,0,0,.28)]"></span>
                </button>
              }
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <span class="text-[13px] font-extrabold text-muted">Formaat (pockets per pagina)</span>
            <div class="grid grid-cols-4 gap-[2px] bg-line border-2 border-line rounded-[10px] overflow-hidden">
              @for (f of s.crFmtOpts; track f.key) {
                <button (click)="f.select()" class="border-0 px-1 py-2 flex flex-col items-center gap-[3px]" [style.background]="f.bg" [style.color]="f.fg">
                  <span class="font-pixel font-semibold text-[17px] leading-none">{{ f.label }}</span>
                  <span class="text-[10.5px] font-extrabold opacity-80">{{ f.sub }}</span>
                </button>
              }
            </div>
          </div>

          @if (s.crIsSet) {
            <div class="flex flex-col gap-2">
              <span class="text-[13px] font-extrabold text-muted">Sets in deze binder</span>
              <div class="flex flex-wrap gap-2">
                @for (c of s.setChips; track c.key) {
                  <button
                    (click)="c.toggle()"
                    class="flex items-center gap-[6px] border-2 border-line rounded-full px-3 py-[6px] font-extrabold text-[13px] shadow-hard-sm"
                    [style.background]="c.bg"
                    [style.color]="c.fg"
                  >
                    <span class="font-pixel font-normal text-[12px] leading-none">{{ c.code }}</span>{{ c.label }}
                  </button>
                }
              </div>
            </div>
          }

          @if (s.crIsSmart) {
            <div class="flex flex-col gap-[14px]">
              <div class="flex flex-col gap-[7px]">
                <span class="text-[13px] font-extrabold text-muted">Type</span>
                <div class="flex flex-wrap gap-[6px]">
                  @for (o of s.crTypeChips; track o.key) {
                    <button (click)="o.select()" class="chip !py-1 !pr-[9px] !pl-[5px]" [style.background]="o.bg" [style.color]="o.fg">
                      <span class="w-[14px] h-[14px] rounded-full border-2 border-line" [style.background]="o.color"></span>{{ o.label }}
                    </button>
                  }
                </div>
              </div>
              <div class="flex flex-col gap-[7px]">
                <span class="text-[13px] font-extrabold text-muted">Taal</span>
                <div class="flex flex-wrap gap-[6px]">
                  @for (o of s.crLangChips; track o.key) {
                    <button (click)="o.select()" class="chip" [style.background]="o.bg" [style.color]="o.fg">{{ o.label }}</button>
                  }
                </div>
              </div>
              <div class="flex flex-col gap-[7px]">
                <span class="text-[13px] font-extrabold text-muted">Zeldzaamheid</span>
                <div class="flex flex-wrap gap-[6px]">
                  @for (o of s.crRarChips; track o.key) {
                    <button (click)="o.select()" class="chip" [style.background]="o.bg" [style.color]="o.fg">{{ o.label }}</button>
                  }
                </div>
              </div>
              <ng-container *ngTemplateOutlet="minVal" />
              <button (click)="s.toggleOwnedOnly()" class="flex items-center gap-[10px] bg-transparent border-0 p-0 font-extrabold text-[14px] text-left">
                <cc-switch [on]="s.ooKnob === '22px'" />Alleen kaarten in bezit
              </button>
              <div class="flex flex-col gap-[7px]">
                <span class="text-[13px] font-extrabold text-muted">Groeperen per</span>
                <div class="grid grid-cols-4 gap-[2px] bg-line border-2 border-line rounded-[9px] overflow-hidden">
                  @for (o of s.crGroupOpts; track o.key) {
                    <button (click)="o.select()" class="border-0 px-1 py-2 font-extrabold text-[13px]" [style.background]="o.bg" [style.color]="o.fg">{{ o.label }}</button>
                  }
                </div>
              </div>
              <div class="flex items-center gap-[6px] text-[13px] font-black"><span class="icon text-[17px]">filter_alt</span>{{ s.crMatch }}</div>
            </div>
          }

          @if (s.crIsTrade) {
            <div class="flex flex-col gap-3">
              <div class="text-[13px] font-bold text-muted text-pretty">
                Cardcase zet je dubbele exemplaren automatisch in deze binder. Je houdt er één van elk; de rest kun je ruilen of verkopen.
              </div>
              <ng-container *ngTemplateOutlet="minVal" />
              <div class="flex items-center gap-[6px] text-[13px] font-black"><span class="icon text-[17px]">swap_horiz</span>{{ s.crMatch }}</div>
            </div>
          }

          @if (s.crIsFree) {
            <div class="flex flex-col gap-3">
              <div class="text-[13px] font-bold text-muted text-pretty">
                Lege pagina's zonder vaste indeling. Vul ze zelf met favorieten, kaarten van één illustrator, een verhaal of een display met decoraties.
              </div>
              <div class="flex flex-col gap-[7px]">
                <span class="text-[13px] font-extrabold text-muted">Aantal pagina's</span>
                <div class="grid grid-cols-4 gap-[2px] bg-line border-2 border-line rounded-[9px] overflow-hidden">
                  @for (o of s.crPageOpts; track o.key) {
                    <button (click)="o.select()" class="border-0 px-1 py-2 font-extrabold text-[13px]" [style.background]="o.bg" [style.color]="o.fg">{{ o.label }}</button>
                  }
                </div>
              </div>
              <div class="flex items-center gap-[6px] text-[12.5px] font-extrabold text-muted">
                <span class="icon text-[16px]">palette</span>Opent na het aanmaken direct in de decoratiemodus.
              </div>
            </div>
          }

          @if (s.crShowSort) {
            <label class="flex flex-col gap-[7px]">
              <span class="text-[13px] font-extrabold text-muted">{{ s.crSortLabel }}</span>
              <select
                [value]="s.crSort"
                (change)="s.onCrSort($event)"
                class="appearance-none bg-bg border-2 border-line rounded-[10px] px-3 py-[9px] font-extrabold text-[14px] cursor-pointer"
              >
                <option value="set">Set en nummer ▾</option>
                <option value="type">Type, dan nummer ▾</option>
                <option value="rarity">Zeldzaamheid, dan nummer ▾</option>
                <option value="value">Waarde, hoogste eerst ▾</option>
                <option value="name">Naam A–Z ▾</option>
              </select>
            </label>
          }

          @if (s.crShowStrategy) {
            <div class="flex flex-col gap-3 border-t-2 border-dashed border-soft pt-[14px]">
              <span class="text-[13px] font-extrabold text-muted">Strategie</span>
              <button (click)="s.toggleNewPage()" class="flex items-center gap-[10px] bg-transparent border-0 p-0 font-extrabold text-[14px] text-left">
                <cc-switch [on]="s.npKnob === '22px'" />
                {{ s.crNewPageLabel }}
              </button>
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="font-extrabold text-[14px]">{{ s.crBufferLabel }}</span>
                <div class="grid grid-cols-[repeat(3,auto)] gap-[2px] bg-line border-2 border-line rounded-[9px] overflow-hidden">
                  @for (o of s.bufOpts; track o.key) {
                    <button (click)="o.select()" class="border-0 px-[11px] py-[7px] font-extrabold text-[13px]" [style.background]="o.bg" [style.color]="o.fg">
                      {{ o.label }}
                    </button>
                  }
                </div>
              </div>
            </div>
          }

          <div class="bg-device border-2 border-line rounded-[9px] p-1">
            <div class="lcd rounded-[5px] px-3 py-[9px] text-[14px] leading-[1.3]">{{ s.crStats }}</div>
          </div>
          <button
            (click)="s.createBinder()"
            class="press flex items-center justify-center gap-2 bg-red text-cream border-2 border-line rounded-xl shadow-[0_5px_0_var(--line)] p-[14px] font-black text-[16px]"
          >
            <span class="icon text-[22px]">add</span>Binder aanmaken
          </button>
        </div>

        <div class="flex-[1.4_1_360px] min-w-0 flex flex-col gap-[14px]">
          <div class="flex items-baseline gap-[10px]">
            <span class="font-pixel font-semibold text-[16px] leading-none">LIVE PREVIEW</span>
            <span class="text-[13px] font-bold text-muted">eerste pagina's</span>
          </div>
          @for (sp of s.createSpreads; track sp.key) {
            <div class="flex gap-[6px] border-2 border-line rounded-xl p-2 shadow-hard" [style.background]="sp.cover">
              <div class="flex-[1_1_0] min-w-0 flex flex-col"><cc-binder-page [page]="sp.left" /></div>
              <div class="flex-[1_1_0] min-w-0 flex flex-col"><cc-binder-page [page]="sp.right" /></div>
            </div>
          }
        </div>
      </div>
    </div>

    <ng-template #minVal>
      <div class="flex flex-col gap-[7px]">
        <span class="text-[13px] font-extrabold text-muted">Minimale waarde</span>
        <div class="grid grid-cols-4 gap-[2px] bg-line border-2 border-line rounded-[9px] overflow-hidden">
          @for (o of v().crMinOpts; track o.key) {
            <button (click)="o.select()" class="border-0 px-1 py-2 font-extrabold text-[13px]" [style.background]="o.bg" [style.color]="o.fg">{{ o.label }}</button>
          }
        </div>
      </div>
    </ng-template>
  `,
})
export class CreateScreen {
  protected readonly v = inject(CardcaseStore).vals;
}
