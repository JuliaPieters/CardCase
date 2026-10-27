import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, inject, input, output, signal, viewChild } from '@angular/core';
import { norm } from '../core/text';

/** Set groups as CardcaseStore.setGroups() makes them. */
export interface SetGroup {
  key: string | null;
  label: string;
  sets: { key: string; code: string; name: string }[];
}

/**
 * Choosing a set by typing part of its name or code: departments have hundreds (Magic over 600), too many for a plain
 * list. Newest first, grouped by edition where a department has several (Pokémon).
 */
@Component({
  selector: 'cc-set-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative block min-w-0' },
  template: `
    <button
      type="button"
      (click)="toggle()"
      class="select w-full flex items-center justify-between gap-2 text-left"
      [class.!border-red]="highlight() && !!value()"
      [class.cc-set-picker-compact]="compact()"
      [attr.aria-expanded]="open()"
    >
      <span class="truncate">{{ label() }}</span><span class="flex-none">▾</span>
    </button>
    @if (open()) {
      <div class="fixed inset-0 z-[70]" (click)="open.set(false)"></div>
      <div class="absolute z-[71] mt-2 w-[min(360px,calc(100vw-32px))] panel p-2 flex flex-col gap-2" [class.right-0]="alignRight()" [class.left-0]="!alignRight()">
        <input
          #q
          [value]="query()"
          (input)="query.set($any($event.target).value)"
          (keydown)="key($event)"
          placeholder="Zoek een set op naam of code…"
          class="border-2 border-line rounded-[9px] bg-bg px-3 py-2 font-bold text-[15px] outline-none"
        />
        <div class="max-h-[min(340px,50vh)] overflow-auto flex flex-col">
          @if (allowAll() && !query()) {
            <button type="button" (click)="pick('')" class="text-left rounded-[8px] px-2 py-[7px] font-extrabold text-[14px] hover:bg-soft" [class.bg-soft]="!value()">{{ placeholder() }}</button>
          }
          @for (g of filtered(); track g.label) {
            @if (showGroups()) {
              <div class="kicker px-2 pt-2 pb-1">{{ g.label }}</div>
            }
            @for (s of g.sets; track s.key) {
              <button type="button" (click)="pick(s.code)" class="flex items-baseline gap-2 text-left rounded-[8px] px-2 py-[7px] hover:bg-soft" [class.bg-soft]="s.code === value()">
                <span class="flex-1 min-w-0 font-bold text-[14px] truncate">{{ s.name }}</span>
                <span class="flex-none font-pixel text-[11px] text-muted uppercase">{{ s.code }}</span>
              </button>
            }
          } @empty {
            <div class="px-2 py-3 text-[14px] font-bold text-muted">Geen set gevonden.</div>
          }
        </div>
      </div>
    }
  `,
})
export class SetPicker {
  readonly groups = input.required<SetGroup[]>();
  readonly value = input<string>('');
  readonly placeholder = input('Alle sets');
  /** "Alle sets" can be chosen (a filter); off when a set is required (a recipe). */
  readonly allowAll = input(true);
  /** A red border while a set is chosen, like the other filters. */
  readonly highlight = input(false);
  readonly compact = input(false);
  readonly picked = output<string>();

  protected readonly open = signal(false);
  /** Opens to the left when there is no room on the right (a picker at the right edge). */
  protected readonly alignRight = signal(false);
  private readonly host = inject(ElementRef<HTMLElement>);
  protected readonly query = signal('');
  private readonly field = viewChild<ElementRef<HTMLInputElement>>('q');

  protected readonly label = computed(() => {
    const v = this.value();
    for (const g of this.groups()) for (const s of g.sets) if (s.code === v) return s.name;
    return this.placeholder();
  });
  protected readonly showGroups = computed(() => this.groups().length > 1);
  protected readonly filtered = computed(() => {
    const q = norm(this.query());
    // At most 80 sets in view: typing narrows it down.
    let left = 80;
    return this.groups()
      .map((g) => ({ label: g.label, sets: g.sets.filter((s) => !q || norm(s.name).includes(q) || norm(s.code).includes(q)) }))
      .filter((g) => g.sets.length)
      .map((g) => {
        const sets = g.sets.slice(0, Math.max(0, left));
        left -= sets.length;
        return { label: g.label, sets };
      })
      .filter((g) => g.sets.length);
  });

  protected toggle() {
    const r = this.host.nativeElement.getBoundingClientRect();
    this.alignRight.set(r.left + 380 > window.innerWidth && r.right > 380);
    this.open.update((o) => !o);
    this.query.set('');
  }

  constructor() {
    // Type straight away: the search field gets the focus as soon as it is there.
    effect(() => this.field()?.nativeElement.focus());
  }

  protected pick(code: string) {
    this.open.set(false);
    this.picked.emit(code);
  }

  protected key(e: KeyboardEvent) {
    if (e.key === 'Escape') this.open.set(false);
    if (e.key === 'Enter') {
      const first = this.filtered()[0]?.sets[0];
      if (first) this.pick(first.code);
    }
  }
}
