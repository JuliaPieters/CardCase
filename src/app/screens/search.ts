import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CardcaseStore } from '../core/store';
import { Card } from '../shared/card';
import { SetPicker } from '../shared/set-picker';

@Component({
  selector: 'cc-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, SetPicker],
  template: `
    @let s = v();
    <div class="flex flex-col gap-[18px]">
      <h1 class="m-0 font-pixel font-semibold text-[30px] leading-[1.1]">Zoeken</h1>
      <div class="flex items-center gap-[10px] panel py-1 px-[14px]">
        <span class="icon text-[22px] text-muted">search</span>
        <input
          [value]="s.q"
          (input)="s.onQ($event)"
          [placeholder]="s.searchPlaceholder"
          class="flex-1 min-w-0 border-0 outline-none bg-transparent py-3 text-[16px] font-bold"
        />
      </div>
      <div class="flex flex-col gap-3">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-[13px] font-extrabold text-muted w-[46px]">Taal</span>
          @for (c of s.langChips; track c.key) {
            <button
              (click)="c.toggle()"
              class="border-2 border-line rounded-full py-[10px] px-4 font-pixel font-semibold text-[14px] leading-none shadow-[2px_2px_0_var(--line)]"
              [style.background]="c.bg"
              [style.color]="c.fg"
            >
              {{ c.code }}
            </button>
          }
        </div>
        <!-- The department's main filters first (Lorcana: ink, card type), then rarity and set, then the rest. -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          @for (f of s.gameFiltersFirst; track f.key) {
            <select class="select w-full" [class.!border-red]="!!f.value" (change)="f.onChange($event)" [attr.aria-label]="f.label">
              <option value="" [selected]="!f.value">{{ f.label }} ▾</option>
              @for (o of f.options; track o[0]) {
                <option [value]="o[0]" [selected]="o[0] === f.value">{{ o[1] }}</option>
              }
            </select>
          }
          <select class="select w-full" [class.!border-red]="!!s.fRar" (change)="s.onFRar($event)" aria-label="Zeldzaamheid">
            <option value="" [selected]="!s.fRar">Alle zeldzaamheden ▾</option>
            @for (g of s.rarGroups; track g.key) {
              <optgroup [label]="g.label">
                @for (o of g.opts; track o.key) {
                  <option [value]="o.key" [selected]="o.key === s.fRar">{{ o.label }}</option>
                }
              </optgroup>
            }
          </select>
          <cc-set-picker [groups]="s.setGroups" [value]="s.fSet" [highlight]="true" (picked)="s.onFSet({ target: { value: $event } })" />
          @for (f of s.gameFiltersRest; track f.key) {
            <select class="select w-full" [class.!border-red]="!!f.value" (change)="f.onChange($event)" [attr.aria-label]="f.label">
              <option value="" [selected]="!f.value">{{ f.label }} ▾</option>
              @for (o of f.options; track o[0]) {
                <option [value]="o[0]" [selected]="o[0] === f.value">{{ o[1] }}</option>
              }
            </select>
          }
        </div>
      </div>
      <div class="flex flex-wrap justify-between items-center gap-[10px] font-extrabold text-[14px] text-muted">
        <span>{{ s.resultCount }}</span>
        <div class="flex items-center gap-3">
          @if (s.hasFilters) {
            <button (click)="s.clearFilters()" class="tap bg-transparent border-0 text-red font-extrabold">Wis filters</button>
          }
          <select class="select" [value]="s.fSort" (change)="s.onFSort($event)" aria-label="Sorteren">
            <option value="">Sorteer: set ▾</option>
            <option value="value">Sorteer: waarde ▾</option>
            <option value="new">Sorteer: nieuwste release ▾</option>
            <option value="old">Sorteer: oudste release ▾</option>
          </select>
        </div>
      </div>
      <div class="grid grid-cols-[repeat(auto-fill,minmax(clamp(108px,9vw,170px),1fr))] gap-x-[14px] gap-y-[18px]">
        @for (r of s.resultsShown; track r.key) {
          <button (click)="r.open()" class="lift glare-trigger flex flex-col gap-[6px] bg-transparent border-0 p-0 text-left min-w-0">
            <div class="aspect-[63/88] w-full rounded-lg" [style.box-shadow]="r.shadow"><cc-card [card]="r.cv" glare="hover" /></div>
            <div class="text-[12px] font-extrabold overflow-hidden text-ellipsis whitespace-nowrap">{{ r.name }}</div>
            <div class="font-pixel text-[12px] leading-none text-muted">{{ r.price }}</div>
          </button>
        }
      </div>
      @if (s.hasMoreResults) {
        <button (click)="s.moreResults()" class="btn self-center"><span class="icon text-[19px]">expand_more</span>Toon meer</button>
      }
    </div>
  `,
})
export class SearchScreen {
  protected readonly v = inject(CardcaseStore).vals;
}
