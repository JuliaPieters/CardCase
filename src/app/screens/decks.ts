import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CatalogService } from '../core/catalog';
import { CARDS, LANGS, TYPES, eur, tot } from '../core/data';
import { type Deck, deckNeeds, deckSize, deckText, linesOf, ownedByName, parseDeckList } from '../core/decks';
import { CardcaseStore } from '../core/store';
import { norm } from '../core/text';
import { Card } from '../shared/card';

/** Decks: the list, and making one by hand, from a pasted list, or generated. */
@Component({
  selector: 'cc-decks',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card],
  template: `
    <div class="flex flex-col gap-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-col gap-[6px]">
          <div class="kicker">SPELEN</div>
          <h1 class="m-0 text-[clamp(26px,4vw,38px)] font-black leading-[1.1]">Decks</h1>
        </div>
        <div class="flex flex-wrap gap-2">
          <button (click)="store.newDeck('Nieuw deck')" class="btn"><span class="icon text-[19px]">add</span>Nieuw deck</button>
          <button (click)="mode.set(mode() === 'import' ? '' : 'import')" class="btn"><span class="icon text-[19px]">content_paste</span>Deck inlezen</button>
          <button (click)="mode.set(mode() === 'generate' ? '' : 'generate')" class="btn bg-red text-cream"><span class="icon text-[19px]">auto_awesome</span>Genereer een deck</button>
        </div>
      </div>

      @if (mode() === 'import') {
        <div class="panel p-4 flex flex-col gap-3">
          <h2 class="m-0 font-pixel font-semibold text-[18px] leading-none">Deck inlezen</h2>
          <p class="m-0 text-[14px] font-bold text-muted">Plak een decklijst, bijvoorbeeld uit Dreamborn of Inkdecks: één kaart per regel, zoals "4 Ariel - On Human Legs".</p>
          <textarea
            #list
            rows="8"
            class="border-2 border-line rounded-[10px] bg-bg p-3 font-mono text-[13px] outline-none"
            placeholder="4 Ariel - On Human Legs&#10;4 Be Prepared&#10;…"
          ></textarea>
          @if (importUnknown().length) {
            <div class="text-[13px] font-bold text-red">Niet gevonden: {{ importUnknown().join(' · ') }}</div>
          }
          <button (click)="importList(list.value)" class="self-start btn bg-red text-cream"><span class="icon text-[19px]">download</span>Inlezen</button>
        </div>
      }

      @if (mode() === 'generate') {
        <div class="panel p-4 flex flex-col gap-4">
          <h2 class="m-0 font-pixel font-semibold text-[18px] leading-none">Genereer een deck</h2>
          @if (rules()?.formats; as formats) {
            <div class="flex flex-col gap-2">
              <span class="text-[13px] font-extrabold text-muted">Formaat</span>
              <div class="flex flex-wrap gap-2">
                @for (f of formats; track f[0]) {
                  <button (click)="format.set(f[0])" class="chip" [style.background]="(format() || formats[0][0]) === f[0] ? 'var(--ink)' : 'var(--surface)'" [style.color]="(format() || formats[0][0]) === f[0] ? 'var(--bg)' : 'var(--ink)'">{{ f[1] }}</button>
                }
              </div>
            </div>
          }
          <div class="flex flex-col gap-2">
            <span class="text-[13px] font-extrabold text-muted">{{ typeLabel() }} (1{{ (rules()?.maxTypes || 2) > 1 ? ' tot ' + rules()?.maxTypes : '' }})</span>
            <div class="flex flex-wrap gap-2">
              @for (t of typeChips(); track t.key) {
                <button (click)="toggleType(t.key)" class="chip !py-[5px] !pl-[5px] !pr-[10px]" [style.background]="t.on ? 'var(--display)' : 'var(--surface)'" [style.color]="t.on ? 'var(--display-text)' : 'var(--ink)'">
                  <span class="w-4 h-4 rounded-full border-2 border-line" [style.background]="t.color"></span>{{ t.label }}
                </button>
              }
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <span class="text-[13px] font-extrabold text-muted">Speelstijl</span>
            <div class="flex flex-wrap gap-2">
              @for (st of rules()?.styles || []; track st[0]) {
                <button (click)="style.set(st[0])" class="chip" [style.background]="style() === st[0] ? 'var(--ink)' : 'var(--surface)'" [style.color]="style() === st[0] ? 'var(--bg)' : 'var(--ink)'">{{ st[1] }}</button>
              }
            </div>
          </div>
          <label class="flex items-center gap-2 font-bold text-[14px]"><input type="checkbox" [checked]="ownedOnly()" (change)="ownedOnly.set(!ownedOnly())" /> Alleen kaarten die ik heb</label>
          @if (!rules()?.formats && rules()?.currentFormatLabel) {
            <label class="flex items-center gap-2 font-bold text-[14px]"><input type="checkbox" [checked]="core()" (change)="core.set(!core())" /> Alleen kaarten uit het huidige formaat ({{ rules()?.currentFormatLabel }})</label>
          }
          <button (click)="generate()" [disabled]="!types().length" class="self-start btn bg-red text-cream disabled:opacity-50"><span class="icon text-[19px]">auto_awesome</span>Maak deck</button>
        </div>
      }

      @if (decks().length) {
        <div class="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
          @for (d of decks(); track d.id) {
            <button (click)="store.go('deck', { deckId: d.id })" class="press-xy panel p-4 flex flex-col gap-3 text-left">
              <div class="flex items-start gap-3">
                <div class="relative w-[60px] h-[82px] flex-none">
                  @for (c of d.preview; track c.key; let i = $index) {
                    <div class="absolute top-0 w-[46px] aspect-[63/88]" [style.left.px]="i * 7" [style.rotate.deg]="(i - 1) * 6"><cc-card [card]="c.cv" /></div>
                  }
                </div>
                <div class="flex-1 min-w-0 flex flex-col gap-1">
                  <span class="font-black text-[17px] truncate">{{ d.name }}</span>
                  <span class="text-[13px] font-bold text-muted">{{ d.format ? d.format + ' · ' : '' }}{{ d.size }} kaarten · {{ d.style }}</span>
                  <span class="flex gap-1">
                    @for (t of d.inks; track t) {
                      <span class="w-4 h-4 rounded-full border-2 border-line" [style.background]="t"></span>
                    }
                  </span>
                </div>
              </div>
              <div class="flex justify-between text-[13px] font-extrabold border-t-2 border-dashed border-soft pt-2">
                <span [class.text-red]="!d.legal">{{ d.legal ? 'Speelklaar' : 'Nog niet compleet' }}</span>
                <span class="text-muted">{{ d.missing }}</span>
              </div>
            </button>
          }
        </div>
      } @else if (!mode()) {
        <div class="panel p-6 flex flex-col items-center gap-3 text-center">
          <span class="icon text-[44px] text-muted">stacks</span>
          <div class="font-black text-[18px]">Nog geen decks</div>
          <p class="m-0 text-[14px] font-bold text-muted max-w-[460px]">Bouw een deck, lees een decklijst in of laat er een maken. Cardcase controleert of hij speelklaar is, laat zien hoe hij speelt en wat je nog mist.</p>
        </div>
      }
    </div>
  `,
})
export class DecksScreen {
  protected readonly store = inject(CardcaseStore);
  private readonly catalog = inject(CatalogService);
  protected readonly rules = computed(() => this.catalog.config?.decks);
  protected readonly mode = signal<'' | 'import' | 'generate'>('');
  protected readonly importUnknown = signal<string[]>([]);
  protected readonly types = signal<string[]>([]);
  protected readonly style = signal('midrange');
  protected readonly ownedOnly = signal(false);
  protected readonly core = signal(true);
  protected readonly commanderLabel = computed(() => this.rules()?.commanderLabel || 'commander');
  protected readonly format = signal('');
  /** What the colour categories are called ("Inkkleuren", "Kleuren"). */
  protected readonly typeLabel = computed(() => (this.catalog.game() === 'lorcana' ? 'Inkkleuren' : 'Kleuren'));

  protected readonly typeChips = computed(() =>
    Object.entries(TYPES)
      // Only real colours: not "no ink", "multicoloured" or "colourless".
      .filter(([k]) => !['none', 'multi', 'colorless'].includes(k))
      .map(([k, [label, color]]) => ({ key: k, label, color, on: this.types().includes(k) })),
  );

  protected readonly decks = computed(() => {
    const st = this.store.state;
    const rules = this.rules();
    return (st.decks || []).map((d: Deck) => {
      const lines = linesOf(d);
      const a = rules?.analyze(lines, d);
      const needs = rules ? deckNeeds(lines, rules.nameOf, st.owned) : null;
      return {
        id: d.id,
        name: d.name,
        size: deckSize(d),
        style: lines.length ? a?.playstyle : 'leeg',
        legal: !!rules && !rules.problems(lines, d).length,
        format: rules?.formats?.find((f) => f[0] === d.format)?.[1] || '',
        inks: [...new Set(lines.flatMap((l) => l.card.inks))].filter((i) => i !== 'none').map((i) => TYPES[i]?.[1]),
        missing: needs && needs.missing.length ? `mist ${needs.missing.reduce((a2, m) => a2 + m.n, 0)} · ${eur(needs.cost)}` : lines.length ? 'alles in bezit' : '',
        preview: [...lines].sort((x, y) => (y.card.trend ?? 0) - (x.card.trend ?? 0)).slice(0, 3).map((l) => ({ key: l.card.id, cv: this.store.cv(l.card, LANGS[0], false) })),
      };
    });
  });

  protected toggleType(t: string) {
    const max = this.rules()?.maxTypes || 2;
    this.types.update((l) => (l.includes(t) ? l.filter((x) => x !== t) : [...l, t].slice(-max)));
  }

  protected importList(text: string) {
    const { lines, unknown } = parseDeckList(text, this.store.state.owned);
    this.importUnknown.set(unknown);
    if (!lines.length) return;
    // A list of 100 single cards is a Commander deck.
    const commander = this.rules()?.formats?.some((f) => f[0] === 'commander') && lines.length >= 90 && lines.every((l) => l.n === 1 || l.card.basicLand);
    this.store.newDeck('Ingelezen deck', lines, 'import', this.rules()?.formats ? { format: commander ? 'commander' : this.rules()!.formats![0][0] } : {});
    if (unknown.length) this.store.toast(unknown.length + ' regels niet herkend');
  }

  protected generate() {
    const rules = this.rules();
    if (!rules) return;
    const owned = ownedByName(rules.nameOf, this.store.state.owned);
    const format = this.format() || rules.formats?.[0][0];
    const lines = rules.generate({ types: this.types(), ownedOnly: this.ownedOnly(), currentFormat: this.core(), style: this.style(), owned, format });
    const style = rules.styles.find((s) => s[0] === this.style())?.[1].split(' ')[0] || '';
    const name = lines.commander ? lines.commander.names.EN : this.types().map((t) => TYPES[t][0]).join('-') + ' ' + style;
    this.store.newDeck(name, lines, 'generated', { format, commander: lines.commander?.id ?? null });
    const n = lines.reduce((a, l) => a + l.n, 0);
    const size = rules.sizeFor?.(format) ?? rules.size;
    if (rules.hasCommander?.(format) && !lines.commander) this.store.toast(`Geen ${this.commanderLabel()} gevonden in precies deze kleuren · kies er zelf een`);
    else if (n < size) this.store.toast(`${n} kaarten: met alleen je eigen kaarten lukt een volledig deck nog niet`);
  }
}

/** One deck: its cards, whether it is legal, how it plays, what is missing, and adding cards. */
@Component({
  selector: 'cc-deck',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card],
  template: `
    @let d = model();
    @if (d) {
      <div class="flex flex-col gap-5">
        <div class="flex flex-wrap items-center gap-3">
          <button (click)="store.go('decks')" class="btn-icon" title="Terug"><span class="icon text-[22px]">arrow_back</span></button>
          <input
            [value]="d.name"
            (change)="rename($any($event.target).value)"
            class="flex-1 min-w-0 basis-[200px] bg-transparent border-0 border-b-2 border-dashed border-soft outline-none font-black text-[clamp(22px,3.4vw,30px)]"
          />
          @if (d.formats) {
            <select class="select" (change)="setFormat($any($event.target).value)" aria-label="Formaat">
              @for (f of d.formats; track f[0]) {
                <option [value]="f[0]" [selected]="f[0] === d.format">{{ f[1] }}</option>
              }
            </select>
          }
          <button (click)="copy()" class="btn"><span class="icon text-[19px]">content_copy</span>Kopieer lijst</button>
          <button (click)="store.deleteDeck(d.id)" class="btn-icon" title="Deck verwijderen"><span class="icon text-[20px]">delete</span></button>
        </div>

        <div class="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-start">
          <div class="flex flex-col gap-4 min-w-0">
            <div class="panel p-4 flex flex-col gap-3">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <h2 class="m-0 font-pixel font-semibold text-[18px] leading-none">{{ d.size }} / {{ d.target }} kaarten</h2>
                <span class="flex items-center gap-3">
                  <span class="font-extrabold text-[14px]" [class.text-red]="d.problems.length">{{ d.problems.length ? 'Nog niet speelklaar' : '✓ Speelklaar' }}</span>
                  <span class="grid grid-cols-2 border-2 border-line rounded-[9px] overflow-hidden">
                    <button (click)="grid.set(false)" title="Lijst" class="px-2 py-1" [style.background]="!grid() ? 'var(--ink)' : 'var(--surface)'" [style.color]="!grid() ? 'var(--bg)' : 'var(--ink)'"><span class="icon text-[18px]">view_list</span></button>
                    <button (click)="grid.set(true)" title="Kaarten" class="px-2 py-1" [style.background]="grid() ? 'var(--ink)' : 'var(--surface)'" [style.color]="grid() ? 'var(--bg)' : 'var(--ink)'"><span class="icon text-[18px]">grid_view</span></button>
                  </span>
                </span>
              </div>
              @for (p of d.problems; track p) {
                <div class="flex items-center gap-2 text-[13px] font-bold text-red"><span class="icon text-[18px]">error</span>{{ p }}</div>
              }
              @if (grid()) {
                <div class="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-3 pt-1">
                  @for (l of d.lines; track l.key) {
                    <div class="flex flex-col gap-1 min-w-0">
                      <button (click)="store.openDetail(l.key, null)" class="relative aspect-[63/88] w-full" [title]="l.name">
                        <cc-card [card]="l.cv" />
                        <span class="absolute -top-2 -right-2 min-w-7 h-7 px-1 rounded-full bg-red text-cream border-2 border-line font-pixel text-[14px] flex items-center justify-center">{{ l.n }}</span>
                      </button>
                      <div class="flex items-center justify-between gap-1">
                        <button (click)="store.deckAdd(d.id, l.key, -1)" class="w-7 h-7 border-2 border-line rounded-[7px] bg-bg font-black leading-none">−</button>
                        @if (l.short) {
                          <span class="text-[11px] font-extrabold text-red">mist {{ l.short }}</span>
                        }
                        <button (click)="store.deckAdd(d.id, l.key, 1)" class="w-7 h-7 border-2 border-line rounded-[7px] bg-bg font-black leading-none">+</button>
                      </div>
                    </div>
                  }
                </div>
              } @else {
              @for (l of d.lines; track l.key) {
                <div class="flex items-center gap-3 py-[5px] border-t-2 border-dashed border-soft">
                  <button (click)="store.openDetail(l.key, null)" class="w-9 flex-none aspect-[63/88]" [title]="l.name"><cc-card [card]="l.cv" /></button>
                  <span class="w-7 h-7 flex-none rounded-full border-2 border-line flex items-center justify-center font-pixel text-[13px]" [style.background]="l.color">{{ l.cost }}</span>
                  <button (click)="store.openDetail(l.key, null)" class="flex-1 min-w-0 text-left font-bold text-[14px] truncate">{{ l.name }}</button>
                  @if (l.canCommand || l.isCommander) {
                    <button (click)="setCommander(l.key)" [title]="l.isCommander ? 'De ' + commanderLabel() : 'Maak ' + commanderLabel()" class="icon text-[20px] flex-none" [class.text-red]="l.isCommander" [class.opacity-40]="!l.isCommander">crown</button>
                  }
                  @if (l.short) {
                    <span class="text-[12px] font-extrabold text-red" title="Zoveel heb je nog niet">mist {{ l.short }}</span>
                  }
                  <div class="flex items-center border-2 border-line rounded-[9px] overflow-hidden bg-bg">
                    <button (click)="store.deckAdd(d.id, l.key, -1)" class="w-9 h-8 border-0 bg-transparent font-black">−</button>
                    <span class="w-6 text-center font-pixel text-[14px]">{{ l.n }}</span>
                    <button (click)="store.deckAdd(d.id, l.key, 1)" class="w-9 h-8 border-0 bg-transparent font-black">+</button>
                  </div>
                  @if (d.sideMax) {
                    <button (click)="store.deckMove(d.id, l.key, true)" title="Eén naar de sideboard" class="icon text-[20px] text-muted flex-none">move_down</button>
                  }
                </div>
              }
              }
            </div>

            @if (d.sideMax) {
              <div class="panel p-4 flex flex-col gap-2">
                <div class="flex items-baseline justify-between gap-3">
                  <h2 class="m-0 font-pixel font-semibold text-[18px] leading-none">Sideboard</h2>
                  <span class="text-[13px] font-extrabold text-muted">{{ d.sideN }} / {{ d.sideMax }}{{ d.sideMax === 1 ? ' · alleen een companion' : '' }}</span>
                </div>
                @for (l of d.side; track l.key) {
                  <div class="flex items-center gap-3 py-[5px] border-t-2 border-dashed border-soft">
                    <button (click)="store.openDetail(l.key, null)" class="w-9 flex-none aspect-[63/88]" [title]="l.name"><cc-card [card]="l.cv" /></button>
                    <span class="flex-1 min-w-0 font-bold text-[14px] truncate">{{ l.name }}</span>
                    <div class="flex items-center border-2 border-line rounded-[9px] overflow-hidden bg-bg">
                      <button (click)="store.sideAdd(d.id, l.key, -1)" class="w-9 h-8 border-0 bg-transparent font-black">−</button>
                      <span class="w-6 text-center font-pixel text-[14px]">{{ l.n }}</span>
                      <button (click)="store.sideAdd(d.id, l.key, 1)" class="w-9 h-8 border-0 bg-transparent font-black">+</button>
                    </div>
                    <button (click)="store.deckMove(d.id, l.key, false)" title="Eén terug naar het deck" class="icon text-[20px] text-muted flex-none">move_up</button>
                  </div>
                } @empty {
                  <div class="text-[13px] font-bold text-muted">Verplaats kaarten hierheen met <span class="icon text-[16px] align-middle">move_down</span> in de lijst.</div>
                }
              </div>
            }

            <div class="panel p-4 flex flex-col gap-3">
              <h2 class="m-0 font-pixel font-semibold text-[18px] leading-none">Kaart toevoegen</h2>
              <input
                [value]="q()"
                (input)="q.set($any($event.target).value)"
                placeholder="Zoek op naam…"
                class="border-2 border-line rounded-[10px] bg-bg px-3 py-[10px] font-bold text-[15px] outline-none"
              />
              <div class="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-3">
                @for (r of results(); track r.key) {
                  <button (click)="store.deckAdd(d.id, r.key, 1)" class="lift flex flex-col gap-1 text-left" [title]="'Voeg ' + r.name + ' toe'">
                    <div class="aspect-[63/88] w-full"><cc-card [card]="r.cv" /></div>
                    <span class="text-[12px] font-bold truncate">{{ r.name }}</span>
                  </button>
                }
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-4 min-w-0">
            <div class="panel p-4 flex flex-col gap-3">
              <div class="kicker">SPEELSTIJL</div>
              <div class="font-black text-[24px] leading-none">{{ d.analysis.playstyle }}</div>
              <p class="m-0 text-[14px] font-bold text-muted">{{ d.analysis.explanation }}</p>
              <div class="flex items-end gap-[6px] h-24 pt-2">
                @for (b of d.curve; track b.cost) {
                  <div class="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <span class="text-[11px] font-extrabold">{{ b.n }}</span>
                    <div class="w-full rounded-t-[3px] bg-red" [style.height.%]="b.h"></div>
                    <span class="font-pixel text-[11px] text-muted">{{ b.cost }}</span>
                  </div>
                }
              </div>
              <div class="text-[11px] font-extrabold text-muted text-center -mt-1">{{ d.curveLabel }}</div>
              @for (f of d.analysis.facts; track f.label) {
                <div class="flex justify-between gap-3 text-[13px] border-t-2 border-dashed border-soft pt-2">
                  <span class="font-extrabold text-muted">{{ f.label }}</span><span class="font-bold text-right">{{ f.value }}</span>
                </div>
              }
            </div>

            <div class="panel p-4 flex flex-col gap-3">
              <div class="kicker">SPAREN</div>
              <div class="font-black text-[18px]">{{ d.have }} van {{ d.size }} in bezit</div>
              @if (d.missing.length) {
                <div class="text-[14px] font-bold text-muted">Nog nodig: {{ d.missingN }} kaarten · ± {{ d.cost }}</div>
                @for (m of d.missing; track m.key) {
                  <div class="flex justify-between gap-3 text-[13px] border-t-2 border-dashed border-soft pt-2">
                    <span class="font-bold truncate">{{ m.n }}× {{ m.name }}</span><span class="font-extrabold flex-none">{{ m.price }}</span>
                  </div>
                }
              } @else if (d.size) {
                <div class="text-[14px] font-bold text-muted">Je hebt alle kaarten van dit deck.</div>
              }
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class DeckScreen {
  protected readonly store = inject(CardcaseStore);
  private readonly catalog = inject(CatalogService);
  protected readonly q = signal('');
  /** The deck as card pictures instead of a list. */
  protected readonly grid = signal(false);
  protected readonly commanderLabel = computed(() => this.catalog.config?.decks?.commanderLabel || 'commander');

  protected readonly model = computed(() => {
    const st = this.store.state;
    const rules = this.catalog.config?.decks;
    const deck: Deck | undefined = (st.decks || []).find((x: Deck) => x.id === st.deckId);
    if (!deck || !rules) return null;
    const lines = linesOf(deck);
    const needs = deckNeeds([...lines, ...linesOf(deck, true)], rules.nameOf, st.owned);
    const short = new Map(needs.missing.map((m) => [m.card.id, m.n]));
    const a = rules.analyze(lines, deck);
    const mx = Math.max(...a.curve, 1);
    const withCommander = !!rules.hasCommander?.(deck.format);
    const commander = deck.commander != null ? CARDS[deck.commander] : null;
    const format = deck.format || rules.formats?.[0][0] || '';
    const sideMax = rules.sideboardFor?.(format) || 0;
    const side = linesOf(deck, true);
    return {
      id: deck.id,
      name: deck.name,
      size: deckSize(deck),
      target: rules.sizeFor?.(deck.format) ?? rules.size,
      problems: rules.problems(lines, deck),
      formats: rules.formats || null,
      format,
      withCommander,
      lines: lines.map((l) => ({ key: l.card.id, n: l.n, name: l.card.names.EN, cost: l.card.cost ?? (l.card.cmc != null ? Math.floor(l.card.cmc) : '–'), color: TYPES[l.card.type]?.[1], short: short.get(l.card.id) || 0, cv: this.store.cv(l.card, LANGS[0], !tot(st.owned[l.card.id])), isCommander: deck.commander === l.card.id || deck.partner === l.card.id, canCommand: withCommander && (!!rules.canCommand?.(l.card) || (!!commander && !!rules.canPartner?.(commander, l.card))) })),
      sideMax,
      curveLabel: rules.curveLabel,
      side: side.map((l) => ({ key: l.card.id, n: l.n, name: l.card.names.EN, cv: this.store.cv(l.card, LANGS[0], !tot(st.owned[l.card.id])) })),
      sideN: side.reduce((a, l) => a + l.n, 0),
      analysis: a,
      curve: a.curve.map((n, i) => ({ cost: i === 6 ? '7+' : String(i + 1), n, h: Math.round((n / mx) * 100) })),
      have: needs.have,
      missing: needs.missing.map((m) => ({ key: m.card.id, n: m.n, name: m.card.names.EN, price: m.price != null ? eur(m.price * m.n) : '–' })),
      missingN: needs.missing.reduce((x, m) => x + m.n, 0),
      cost: eur(needs.cost),
    };
  });

  protected readonly results = computed(() => {
    const q = norm(this.q());
    if (q.length < 2) return [];
    const owned = this.store.state.owned;
    return CARDS.filter((c) => LANGS.some((l) => c.avail.includes(l) && norm(c.names[l]).includes(q)))
      .slice(0, 24)
      .map((c) => ({ key: c.id, name: c.names.EN, cv: this.store.cv(c, LANGS[0], !tot(owned[c.id])) }));
  });

  protected setFormat(format: string) {
    const d = this.model();
    if (d) this.store.updDeck(d.id, (x: Deck) => ({ ...x, format }));
  }

  /**
   * The crown: the first card becomes the commander; a card that can team up with it becomes the second (Partner,
   * Background…); tapping a commander again takes it off.
   */
  protected setCommander(cardId: number) {
    const d = this.model();
    const rules = this.catalog.config?.decks;
    if (!d || !rules) return;
    this.store.updDeck(d.id, (x: Deck) => {
      if (x.commander === cardId) return { ...x, commander: x.partner ?? null, partner: null };
      if (x.partner === cardId) return { ...x, partner: null };
      const cmd = x.commander != null ? CARDS[x.commander] : null;
      if (cmd && rules.canPartner?.(cmd, CARDS[cardId])) return { ...x, partner: cardId };
      return { ...x, commander: cardId, partner: null };
    });
  }

  protected rename(name: string) {
    const d = this.model();
    if (d && name.trim()) this.store.updDeck(d.id, (x: Deck) => ({ ...x, name: name.trim() }));
  }

  protected copy() {
    const deck = (this.store.state.decks || []).find((x: Deck) => x.id === this.store.state.deckId);
    if (!deck) return;
    navigator.clipboard?.writeText(deckText(linesOf(deck), this.catalog.config?.decks?.listLine)).then(
      () => this.store.toast('Decklijst gekopieerd'),
      () => this.store.toast('Kopiëren lukte niet'),
    );
  }
}
