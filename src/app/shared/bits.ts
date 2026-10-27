import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Round indicator light from the device chrome. */
@Component({
  selector: 'cc-led',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-block flex-none' },
  template: `<span
    class="block rounded-full border-2 border-coal"
    [class.animate-blink]="blink()"
    [style.width.px]="size()"
    [style.height.px]="size()"
    [style.background]="color()"
  ></span>`,
})
export class Led {
  readonly color = input.required<string>();
  readonly blink = input(false);
  readonly size = input(10);
}

/** The red / yellow / green LED trio. */
@Component({
  selector: 'cc-leds',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Led],
  host: { class: 'flex', '[style.gap.px]': 'gap()' },
  template: `<cc-led color="#FF5A4E" [blink]="true" /><cc-led color="#F6C945" /><cc-led color="#7BD15B" />`,
})
export class Leds {
  readonly gap = input(6);
}

/** Pixel-art up/down arrow used in price change badges (inherits currentColor). */
@Component({
  selector: 'cc-trend',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col items-center flex-none' },
  template: `
    @if (up()) {
      <span class="w-[3px] h-[3px] bg-current"></span><span class="w-[9px] h-[3px] bg-current"></span
      ><span class="w-[15px] h-[3px] bg-current"></span><span class="w-[5px] h-[5px] bg-current"></span>
    } @else {
      <span class="w-[5px] h-[5px] bg-current"></span><span class="w-[15px] h-[3px] bg-current"></span
      ><span class="w-[9px] h-[3px] bg-current"></span><span class="w-[3px] h-[3px] bg-current"></span>
    }
  `,
})
export class Trend {
  readonly up = input(true);
}

/** On/off switch track with sliding knob. */
@Component({
  selector: 'cc-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative block flex-none w-[46px] h-[26px] rounded-full border-2 border-line', '[style.background]': 'on() ? "var(--display)" : "var(--soft)"' },
  template: `<span
    class="absolute top-[2px] w-[18px] h-[18px] rounded-full bg-surface border-2 border-line transition-[left] duration-150"
    [style.left]="on() ? '22px' : '2px'"
  ></span>`,
})
export class Switch {
  readonly on = input(false);
}

/** 8×8 pixel icon drawn with box-shadows (shadow string from pixShadow / pixShadowU). */
@Component({
  selector: 'cc-pix',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative block flex-none', '[style.width.px]': 'box()', '[style.height.px]': 'box()' },
  template: `<div class="absolute left-0 top-0" [style.width.px]="unit()" [style.height.px]="unit()" [style.box-shadow]="shadow()"></div>`,
})
export class Pix {
  readonly shadow = input.required<string>();
  readonly unit = input(4);
  readonly box = input(32);
}
