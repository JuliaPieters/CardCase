import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CardcaseStore } from '../core/store';
import { Card } from '../shared/card';
import { Switch } from '../shared/bits';

@Component({
  selector: 'cc-collection',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, Switch],
  template: `
    @let s = v();
    <div class="flex flex-col gap-[18px]">
      <div class="flex items-baseline gap-3 flex-wrap">
        <h1 class="m-0 font-pixel font-semibold text-[30px] leading-[1.1]">Collectie</h1>
        <span class="font-extrabold text-muted">{{ s.collCount }}</span>
        <button (click)="s.goValue()" class="ml-auto flex items-center gap-[6px] bg-transparent border-0 text-red font-black text-[14px]">
          <span class="icon text-[19px]">payments</span>Collectiewaarde →
        </button>
      </div>
      <div class="flex flex-wrap items-center gap-[10px]">
        <div class="flex gap-[2px] bg-line border-2 border-line rounded-[10px] overflow-hidden">
          <button (click)="s.setGrid()" title="Grid" class="border-0 py-[7px] px-[10px] flex" [style.background]="s.gridBg" [style.color]="s.gridFg">
            <span class="icon text-[20px]">grid_view</span>
          </button>
          <button (click)="s.setList()" title="Lijst" class="border-0 py-[7px] px-[10px] flex" [style.background]="s.listBg" [style.color]="s.listFg">
            <span class="icon text-[20px]">view_list</span>
          </button>
        </div>
        <select class="select" [value]="s.sort" (change)="s.onSort($event)">
          <option value="set">Sorteer: set ▾</option>
          <option value="num">Sorteer: nummer ▾</option>
          <option value="date">Sorteer: datum toegevoegd ▾</option>
          <option value="value">Sorteer: waarde ▾</option>
        </select>
        <select class="select" [value]="s.collSet" (change)="s.onCollSet($event)">
          <option value="">Alle sets ▾</option>
          @for (g of s.setGroups; track g.key) {
            <optgroup [label]="g.label">
              @for (o of g.sets; track o.key) {
                <option [value]="o.code" [selected]="o.code === s.collSet">{{ o.name }}</option>
              }
            </optgroup>
          }
        </select>
        <button (click)="s.toggleMissing()" class="flex items-center gap-[10px] bg-transparent border-0 p-1 font-extrabold text-[14px]">
          <cc-switch [on]="store.state.missingOnly" />
          Alleen ontbrekend
        </button>
      </div>
      @if (s.hasCollNeed) {
        <div class="flex items-center gap-[10px] bg-device border-2 border-line rounded-[10px] p-1 shadow-[3px_3px_0_var(--line)]">
          <div class="flex-1 flex items-center gap-2 lcd rounded-md py-[9px] px-3 text-[14px] leading-[1.3]">
            <span class="icon text-[18px]">shopping_cart</span>{{ s.collNeedText }}
          </div>
        </div>
      }
      @if (s.isGrid) {
        <div class="grid grid-cols-[repeat(auto-fill,minmax(108px,1fr))] gap-x-[14px] gap-y-[18px]">
          @for (r of s.collShown; track r.key) {
            <button (click)="r.open()" class="lift flex flex-col gap-[6px] bg-transparent border-0 p-0 text-left min-w-0">
              <div class="aspect-[63/88] w-full rounded-lg" [style.box-shadow]="r.shadow"><cc-card [card]="r.cv" /></div>
              <div class="flex justify-between gap-[6px] text-[12px] font-extrabold">
                <span class="overflow-hidden text-ellipsis whitespace-nowrap">{{ r.name }}</span
                ><span class="font-pixel font-normal flex-none" [style.color]="r.qtyColor">{{ r.qtyLabel }}</span>
              </div>
              <div class="font-pixel text-[12px] leading-none text-muted">{{ r.price }}</div>
            </button>
          }
        </div>
      }
      @if (s.isList) {
        <div class="panel overflow-hidden">
          @for (r of s.collShown; track r.key) {
            <button
              (click)="r.open()"
              class="w-full flex items-center gap-3 py-[10px] px-[14px] bg-transparent border-0 border-b-2 border-soft text-left hover:bg-soft"
            >
              <div class="w-10 flex-none aspect-[63/88]"><cc-card [card]="r.cv" /></div>
              <div class="flex-1 min-w-0 flex flex-col gap-[3px]">
                <span class="font-black text-[15px] overflow-hidden text-ellipsis whitespace-nowrap">{{ r.name }}</span
                ><span class="text-[12px] font-bold text-muted">{{ r.setNum }} · {{ r.typeLabel }}</span>
              </div>
              <span class="font-pixel text-[12px] leading-none text-muted text-right">{{ r.langs }}</span>
              <span class="font-pixel text-[14px] leading-none w-[72px] text-right">{{ r.price }}</span>
              <span class="font-pixel font-semibold text-[16px] leading-none w-[50px] text-right" [style.color]="r.qtyColor">{{ r.qtyLabel }}</span>
            </button>
          }
        </div>
      }
      @if (s.hasMoreColl) {
        <button (click)="s.moreColl()" class="btn self-center"><span class="icon text-[19px]">expand_more</span>Toon meer</button>
      }
    </div>
  `,
})
export class CollectionScreen {
  protected readonly store = inject(CardcaseStore);
  protected readonly v = this.store.vals;
}
