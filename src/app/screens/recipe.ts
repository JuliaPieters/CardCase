import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { CardcaseStore } from '../core/store';
import { SetPicker } from '../shared/set-picker';
import { BinderPage } from '../shared/binder-page';
import { Pix } from '../shared/bits';

/** Recipe-based binder creation: pick a recipe tile, then step through its questions. */
@Component({
  selector: 'cc-recipe',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, BinderPage, Pix, SetPicker],
  template: `
    @let s = v();
    <div class="flex flex-col gap-[18px]">
      @if (s.rcChoose) {
        <div class="flex flex-col gap-5">
          <div class="flex items-center gap-3">
            <button (click)="s.goBinders()" title="Terug" class="btn-icon"><span class="icon text-[20px]">arrow_back</span></button>
            <div class="flex flex-col gap-[3px]">
              <div class="kicker">BINDER AANMAKEN</div>
              <h1 class="m-0 text-[clamp(22px,3.4vw,28px)] font-black leading-[1.15]">Kies een recept</h1>
            </div>
          </div>
          <div class="flex flex-col gap-[7px]">
            <span class="text-[13px] font-extrabold text-muted">Of beschrijf je binder…</span>
            <div class="flex items-center gap-2 panel py-[5px] pr-[5px] pl-3">
              <span class="icon text-[22px] text-muted">edit_note</span>
              <input
                [value]="s.rcText"
                (input)="s.onRcText($event)"
                (keydown)="s.onRcKey($event)"
                [placeholder]="s.rcExample"
                class="flex-1 min-w-0 border-0 outline-none bg-transparent py-[10px] text-[15px] font-bold"
              />
              <button
                (click)="s.parseRc()"
                class="flex items-center gap-[6px] bg-red text-cream border-2 border-line rounded-[9px] px-3 py-[9px] font-black text-[13.5px] flex-none"
              >
                <span class="icon text-[18px]">auto_awesome</span>Maak recept
              </button>
            </div>
          </div>
          <div class="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-[18px]">
            @for (t of s.rcTiles; track t.key) {
              <button
                (click)="t.select()"
                class="tile flex flex-col items-start gap-3 text-left border-2 border-line rounded-2xl shadow-[5px_5px_0_var(--line)] p-[18px] min-h-[196px]"
                [style.background]="t.bg"
                [style.color]="t.fg"
              >
                <div class="w-[72px] h-[72px] rounded-xl bg-[rgba(255,255,255,.2)] border-2 border-line flex items-center justify-center">
                  <cc-pix [shadow]="t.shadow" [unit]="6" [box]="48" />
                </div>
                <div class="font-pixel font-semibold text-[20px] leading-[1.1]">{{ t.label }}</div>
                <div class="text-[13.5px] font-bold leading-[1.35]">{{ t.desc }}</div>
              </button>
            }
          </div>
          <button (click)="s.goManual()" class="tap self-start bg-transparent border-0 py-1 px-0 text-red font-black text-[14px]">
            Liever alles zelf instellen? Handmatig →
          </button>
        </div>
      }
      @if (s.rcConfig) {
        <div class="flex flex-col gap-4">
          <div class="flex items-center gap-3">
            <button (click)="s.rcBackTiles()" title="Terug" class="btn-icon"><span class="icon text-[20px]">arrow_back</span></button>
            <div class="flex flex-col gap-[3px]">
              <div class="kicker">RECEPT</div>
              <h1 class="m-0 text-[clamp(22px,3.4vw,28px)] font-black leading-[1.15]">{{ s.rcTitle }}</h1>
            </div>
          </div>
          <div class="bg-device border-2 border-line rounded-[14px_14px_36px_14px] pt-[10px] px-3 pb-[14px] shadow-hard">
            <div class="relative lcd rounded-md shadow-[inset_0_0_0_3px_var(--display-edge)] px-4 py-[14px] flex flex-col gap-[6px] overflow-hidden">
              <div class="text-[11px] leading-none tracking-[.1em]">LIVE SAMENVATTING</div>
              <div class="font-semibold text-[clamp(17px,2.6vw,22px)] leading-[1.25] text-pretty">{{ s.rcSummary }}</div>
              <div class="text-[12px] leading-[1.3]">{{ s.rcLabel }}</div>
              @if (s.lcdPixels) {
                <div class="lcd-pixels"></div>
              }
            </div>
          </div>
          <div class="flex flex-wrap gap-[6px]">
            @for (o of s.rcSteps; track o.key) {
              <button (click)="o.select()" class="chip font-pixel !font-normal" [style.background]="o.bg" [style.color]="o.fg">{{ o.label }}</button>
            }
          </div>
          <div class="flex flex-wrap gap-[22px] items-start">
            <div class="flex-[1_1_340px] max-w-[560px] min-w-0 flex flex-col gap-[14px]">
              <div class="panel p-4 flex flex-col gap-[14px]">
                <div class="flex flex-col gap-1">
                  <span class="font-pixel text-[11px] leading-none text-muted tracking-[.1em]">{{ s.rcStepLabel }}</span>
                  <h2 class="m-0 text-[20px] font-black">{{ s.rcQ }}</h2>
                </div>
                @if (s.qRegion) {
                  <div class="flex flex-col gap-3">
                    <div class="flex flex-wrap gap-2">
                      @for (o of s.regionChips; track o.key) {
                        <button
                          (click)="o.select()"
                          class="flex flex-col items-start gap-[3px] border-2 border-line rounded-[10px] px-[11px] py-[7px] shadow-hard-sm"
                          [style.background]="o.bg"
                          [style.color]="o.fg"
                        >
                          <span class="font-black text-[14px]">{{ o.label }}</span>
                          <span class="font-pixel text-[11px] leading-none opacity-80">{{ o.sub }}</span>
                        </button>
                      }
                    </div>
                    @if (s.rcCustom) {
                      <div class="flex items-center gap-2 font-extrabold">
                        <span>Van #</span>
                        <input type="number" min="1" max="1025" [value]="s.rcFrom" (input)="s.onRcFrom($event)" class="w-20 border-2 border-line rounded-lg bg-bg px-2 py-[7px] font-pixel text-[15px] leading-none" />
                        <span>tot #</span>
                        <input type="number" min="1" max="1025" [value]="s.rcTo" (input)="s.onRcTo($event)" class="w-20 border-2 border-line rounded-lg bg-bg px-2 py-[7px] font-pixel text-[15px] leading-none" />
                      </div>
                    }
                    <button (click)="s.toggleForms()" class="flex items-center gap-[10px] bg-transparent border-0 p-0 font-extrabold text-[14px] text-left text-ink">
                      <span class="relative flex-none w-[46px] h-[26px] rounded-full border-2 border-line" [style.background]="s.formsTrack">
                        <span class="absolute top-[2px] w-[18px] h-[18px] rounded-full bg-surface border-2 border-line transition-[left] duration-150" [style.left]="s.formsKnob"></span>
                      </span>
                      Regionale vormen meenemen
                    </button>
                  </div>
                }
                @if (s.qLangs) {
                  <div class="flex flex-col gap-3">
                    <div class="flex flex-wrap gap-2">
                      @for (o of s.rcLangChips; track o.key) {
                        <button
                          (click)="o.select()"
                          class="flex flex-col items-start gap-[3px] border-2 border-line rounded-[10px] px-[11px] py-[7px] shadow-hard-sm"
                          [style.background]="o.bg"
                          [style.color]="o.fg"
                        >
                          <span class="font-black text-[14px]">{{ o.label }}</span>
                          <span class="font-pixel text-[11px] leading-none opacity-80">{{ o.sub }}</span>
                        </button>
                      }
                    </div>
                    <span class="text-[13px] font-bold text-muted text-pretty">Kies er een of meer; alleen kaarten in die talen komen in de binder.</span>
                  </div>
                }
                @if (s.qPer) {
                  <div class="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-[10px]">
                    @for (k of s.perOpts; track k.key) {
                      <ng-container *ngTemplateOutlet="choice; context: { $implicit: k }" />
                    }
                  </div>
                }
                @if (s.qPref) {
                  <div class="flex flex-col gap-[10px]">
                    <div class="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-[10px]">
                      @for (k of s.prefOpts; track k.key) {
                        <ng-container *ngTemplateOutlet="choice; context: { $implicit: k }" />
                      }
                    </div>
                    @if (s.rcPrefIsSet) {
                      <cc-set-picker class="max-w-[360px]" [groups]="s.setGroups" [value]="s.rcPrefSet" [allowAll]="false" placeholder="Kies een set" (picked)="s.pickPrefSet($event)" />
                    }
                  </div>
                }
                @if (s.qSet) {
                  <cc-set-picker class="max-w-[360px]" [groups]="s.setGroups" [value]="s.rcSet" [allowAll]="false" placeholder="Kies een set" (picked)="s.pickRcSet($event)" />
                }
                @if (s.qOrder) {
                  <div class="grid grid-cols-3 gap-[2px] bg-line border-2 border-line rounded-[9px] overflow-hidden">
                    @for (o of s.orderOpts; track o.key) {
                      <button (click)="o.select()" class="border-0 px-1 py-2 font-extrabold text-[13px]" [style.background]="o.bg" [style.color]="o.fg">{{ o.label }}</button>
                    }
                  </div>
                }
                @if (s.qSpecies) {
                  <div class="flex flex-col gap-[10px]">
                    <input
                      [value]="s.rcSpQ"
                      (input)="s.onRcSpQ($event)"
                      [placeholder]="s.spPlaceholder"
                      class="border-2 border-line rounded-[10px] bg-bg px-3 py-[10px] font-extrabold text-[15px] outline-none"
                    />
                    <div class="flex flex-wrap gap-[6px]">
                      @for (o of s.spChips; track o.key) {
                        <button (click)="o.select()" class="chip" [style.background]="o.bg" [style.color]="o.fg">{{ o.label }}</button>
                      }
                    </div>
                  </div>
                }
                @if (s.qStory) {
                  <div class="flex flex-wrap gap-[6px]">
                    @for (o of s.storyChips; track o.key) {
                      <button (click)="o.select()" class="chip" [style.background]="o.bg" [style.color]="o.fg">{{ o.label }}</button>
                    }
                  </div>
                }
                @if (s.qIllus) {
                  <div class="flex flex-wrap gap-[6px]">
                    @for (o of s.illusChips; track o.key) {
                      <button (click)="o.select()" class="chip" [style.background]="o.bg" [style.color]="o.fg">{{ o.label }}</button>
                    }
                  </div>
                }
                @if (s.qPtype) {
                  <div class="flex flex-wrap gap-[6px]">
                    @for (o of s.ptypeChips; track o.key) {
                      <button (click)="o.select()" class="chip !py-[5px] !pl-[5px] !pr-[10px]" [style.background]="o.bg" [style.color]="o.fg">
                        <span class="w-4 h-4 rounded-full border-2 border-line" [style.background]="o.color"></span>{{ o.label }}
                      </button>
                    }
                  </div>
                }
                @if (s.qPages) {
                  <div class="grid grid-cols-4 gap-[2px] bg-line border-2 border-line rounded-[9px] overflow-hidden">
                    @for (o of s.rcPageOpts; track o.key) {
                      <button (click)="o.select()" class="border-0 px-1 py-2 font-extrabold text-[13px]" [style.background]="o.bg" [style.color]="o.fg">{{ o.label }}</button>
                    }
                  </div>
                }
                <div class="flex justify-between gap-[10px] border-t-2 border-dashed border-soft pt-3">
                  <button (click)="s.rcPrev()" class="btn"><span class="icon text-[18px]">arrow_back</span>{{ s.rcPrevLabel }}</button>
                  <button
                    (click)="s.rcNext()"
                    class="press-sm flex items-center gap-[6px] bg-red text-cream border-2 border-line rounded-[10px] shadow-[0_4px_0_var(--line)] px-4 py-[9px] font-black text-[14.5px]"
                  >
                    {{ s.rcNextLabel }}<span class="icon text-[19px]">{{ s.rcNextIcon }}</span>
                  </button>
                </div>
              </div>
              <div class="panel py-1 px-[14px]">
                <button (click)="s.toggleRcMore()" class="w-full flex items-center justify-between bg-transparent border-0 py-[10px] px-0 font-black text-[14px] text-ink">
                  <span class="flex items-center gap-[7px]"><span class="icon text-[18px]">tune</span>Meer opties</span>
                  <span class="icon text-[22px]">{{ s.rcMoreIcon }}</span>
                </button>
                @if (s.rcMore) {
                  <div class="flex flex-col gap-[14px] pt-1 pb-[14px] border-t-2 border-dashed border-soft">
                    <label class="flex flex-col gap-[6px] pt-[10px]">
                      <span class="text-[13px] font-extrabold text-muted">Naam</span>
                      <input
                        [value]="s.rcName"
                        (input)="s.onRcName($event)"
                        class="border-2 border-line rounded-[9px] bg-bg px-[10px] py-2 font-extrabold text-[14px] outline-none"
                      />
                    </label>
                    <ng-container *ngTemplateOutlet="seg; context: { label: 'Binderformaat', opts: s.rcFmtOpts, cols: 4 }" />
                    <ng-container *ngTemplateOutlet="seg; context: { label: 'Sortering', opts: s.rcSortOpts, cols: 4 }" />
                    <ng-container *ngTemplateOutlet="seg; context: { label: 'Buffer achteraan', opts: s.rcBufOpts, cols: 3 }" />
                  </div>
                }
              </div>
            </div>
            <div class="flex-[1.3_1_360px] min-w-0 flex flex-col gap-[10px]">
              <div class="flex items-baseline gap-[10px]">
                <span class="font-pixel font-semibold text-[15px] leading-none">PREVIEW</span>
                <span class="text-[13px] font-bold text-muted">eerste twee pagina's</span>
              </div>
              <div class="flex gap-[6px] border-2 border-line rounded-xl p-2 shadow-hard" [style.background]="s.rcCover">
                <div class="flex-[1_1_0] min-w-0 flex flex-col"><cc-binder-page [page]="s.rcLeft" /></div>
                <div class="flex-[1_1_0] min-w-0 flex flex-col"><cc-binder-page [page]="s.rcRight" /></div>
              </div>
              <div class="flex items-center gap-2 text-[13px] font-extrabold text-muted">
                <span class="w-5 h-5 flex-none rounded-[5px] bg-amber border-2 border-line text-coal flex items-center justify-center font-pixel font-bold text-[12px] leading-none">!</span>
                {{ s.rcWarnText }}
              </div>
            </div>
          </div>
        </div>
      }
    </div>

    <ng-template #choice let-k>
      <button
        (click)="k.select()"
        class="flex items-start gap-[10px] text-left p-3 border-2 border-line rounded-xl"
        [style.background]="k.bg"
        [style.color]="k.fg"
        [style.box-shadow]="k.sh"
      >
        <span class="icon text-[22px] flex-none">{{ k.icon }}</span>
        <span class="flex flex-col gap-1">
          <span class="font-pixel font-semibold text-[15px] leading-[1.15]">{{ k.label }}</span>
          <span class="text-[12px] font-bold leading-[1.35] opacity-85">{{ k.desc }}</span>
        </span>
      </button>
    </ng-template>

    <ng-template #seg let-label="label" let-opts="opts" let-cols="cols">
      <div class="flex flex-col gap-[6px]">
        <span class="text-[13px] font-extrabold text-muted">{{ label }}</span>
        <div class="grid gap-[2px] bg-line border-2 border-line rounded-[9px] overflow-hidden" [style.grid-template-columns]="'repeat(' + cols + ',minmax(0,1fr))'">
          @for (o of opts; track o.key) {
            <button (click)="o.select()" class="border-0 px-1 py-2 font-extrabold text-[13px]" [style.background]="o.bg" [style.color]="o.fg">{{ o.label }}</button>
          }
        </div>
      </div>
    </ng-template>
  `,
  styles: `
    .tile:hover {
      transform: translate(-2px, -2px);
      box-shadow: 7px 7px 0 var(--line);
    }
    .tile:active {
      transform: translate(2px, 2px);
      box-shadow: 2px 2px 0 var(--line);
    }
  `,
})
export class RecipeScreen {
  protected readonly v = inject(CardcaseStore).vals;
}
