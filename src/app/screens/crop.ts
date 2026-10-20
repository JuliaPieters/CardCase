import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CardcaseStore } from '../core/store';

/** Crop / position an image over one or more binder slots. */
@Component({
  selector: 'cc-crop',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let s = v();
    <div class="flex flex-col gap-[18px]">
      <div class="flex items-center gap-3">
        <button (click)="s.cancelCrop()" title="Terug" class="btn-icon"><span class="icon text-[20px]">arrow_back</span></button>
        <div class="flex flex-col gap-[3px] min-w-0">
          <div class="kicker">AFBEELDING UITSNIJDEN</div>
          <h1 class="m-0 text-[clamp(22px,3.4vw,28px)] font-black leading-[1.15] text-pretty">{{ s.cropv.title }}</h1>
        </div>
      </div>
      <div class="flex flex-wrap gap-[22px] items-start">
        <div class="flex-[2_1_420px] min-w-0 bg-page border-2 border-line rounded-xl shadow-hard p-[clamp(14px,3vw,28px)] flex flex-col items-center gap-3">
          <div
            class="relative max-w-full rounded-lg overflow-hidden border-2 border-line cursor-grab touch-none"
            [style.height]="'min(60vh, ' + s.cropv.maxH + ')'"
            [style.aspect-ratio]="s.cropv.aspect"
            (pointerdown)="s.cropDown($event)"
          >
            <div
              class="absolute inset-0 bg-cover pointer-events-none"
              [style.background-image]="s.cropv.fill"
              [style.background-position]="s.cropv.pos"
              [style.transform]="'scale(' + s.cropv.zoom + ')'"
              [style.transform-origin]="s.cropv.pos"
            ></div>
            <div
              class="absolute inset-0 grid gap-3 pointer-events-none"
              [style.grid-template-columns]="'repeat(' + s.cropv.cols + ',1fr)'"
              [style.grid-template-rows]="'repeat(' + s.cropv.rows + ',1fr)'"
            >
              @for (c of s.cropCells; track c.key) {
                <div class="rounded-md shadow-[0_0_0_6px_var(--page),inset_0_0_0_2px_rgba(255,255,255,.75)]"></div>
              }
            </div>
          </div>
          <div class="flex flex-wrap justify-center gap-x-4 gap-y-[6px] text-[12.5px] font-extrabold text-muted">
            <span class="flex items-center gap-[6px]"><span class="w-[22px] h-2 bg-page border-[1.5px] border-line"></span>naden tussen de pockets</span>
            <span class="flex items-center gap-[6px]"><span class="icon text-[16px]">pan_tool</span>sleep om te verschuiven</span>
          </div>
        </div>
        <div class="flex-[1_1_280px] min-w-0 panel p-4 flex flex-col gap-4">
          <div class="flex flex-col gap-[6px]">
            <span class="text-[12.5px] font-extrabold text-muted">Bestand</span>
            <span class="font-black text-[15px] overflow-hidden text-ellipsis whitespace-nowrap">{{ s.cropv.name }}</span>
          </div>
          <div class="flex flex-col gap-[6px]">
            <span class="text-[12.5px] font-extrabold text-muted">Over hoeveel slots</span>
            <div class="flex flex-wrap gap-[6px]">
              @for (o of s.cropSizes; track o.key) {
                <button (click)="o.select()" class="chip" [style.background]="o.bg" [style.color]="o.fg">{{ o.label }}</button>
              }
            </div>
          </div>
          <label class="flex flex-col gap-[6px]">
            <span class="flex justify-between text-[12.5px] font-extrabold text-muted">
              <span>Zoom</span><span class="font-pixel font-normal">{{ s.cropv.zoomVal }}%</span>
            </span>
            <input type="range" min="100" max="300" [value]="s.cropv.zoomVal" (input)="s.onCropZoom($event)" class="accent-[#E3350D]" />
          </label>
          <button (click)="s.cropReset()" class="chip self-start bg-bg text-ink"><span class="icon text-[16px]">restart_alt</span>Centreer opnieuw</button>
          <div class="bg-device border-2 border-line rounded-[9px] p-1">
            <div class="lcd rounded-[5px] px-3 py-2 text-[14px] leading-[1.3] whitespace-nowrap">{{ s.cropv.target }}</div>
          </div>
          <button
            (click)="s.applyCrop()"
            class="press flex items-center justify-center gap-2 bg-red text-cream border-2 border-line rounded-xl shadow-[0_5px_0_var(--line)] p-[13px] font-black text-[15px]"
          >
            <span class="icon text-[20px]">check</span>Toepassen
          </button>
          <button (click)="s.cancelCrop()" class="btn justify-center">Annuleren</button>
        </div>
      </div>
    </div>
  `,
})
export class CropScreen {
  protected readonly v = inject(CardcaseStore).vals;
}
