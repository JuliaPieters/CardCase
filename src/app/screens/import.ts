import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CARDS, GAME } from '../core/data';
import { type ImportResult, matchRows, parseFile } from '../core/import';
import { CardcaseStore } from '../core/store';
import { gameInfo } from '../games/registry';
import type { Game } from '../games/types';

/** Importing a collection from another app (Collectr, ManaBox…): choose a file, see what was recognised, add it. */
@Component({
  selector: 'cc-import',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (store.state.importOpen) {
      <div (click)="close()" class="fixed inset-0 z-[70] bg-[rgba(0,0,0,.5)] flex items-center justify-center p-4">
        <div
          (click)="$event.stopPropagation()"
          class="w-full max-w-[520px] max-h-[calc(92vh/var(--z))] overflow-auto bg-bg text-ink border-2 border-line rounded-2xl shadow-[6px_6px_0_var(--line)] p-[18px] flex flex-col gap-4"
        >
          <div class="flex items-center justify-between gap-[10px]">
            <div class="min-w-0">
              <div class="font-pixel text-[12px] leading-none text-muted tracking-[.08em]">IMPORTEREN</div>
              <div class="text-[20px] font-black mt-1 truncate">Collectie uit een andere app</div>
            </div>
            <button (click)="close()" class="chip bg-surface text-ink">Sluiten</button>
          </div>

          @if (done()) {
            <p class="m-0 font-bold text-pretty">{{ done() }}</p>
            <div class="flex flex-wrap gap-2">
              <button (click)="close()" class="btn">Klaar</button>
              @if (store.state.importUndo) {
                <button (click)="undo()" class="chip bg-surface text-ink">Ongedaan maken</button>
              }
            </div>
          } @else {
            <p class="m-0 text-[13.5px] font-bold text-muted text-pretty">
              Exporteer je collectie als CSV (of JSON) uit bijvoorbeeld Collectr of ManaBox en kies het bestand hier. Kaarten worden
              toegevoegd aan wat je al hebt in {{ gameName }}.
            </p>
            <label class="btn self-start cursor-pointer">
              <span class="icon text-[19px]">upload_file</span>{{ fileName() || 'Kies een bestand' }}
              <input type="file" accept=".csv,.json,.txt,text/csv,application/json" class="hidden" (change)="pick($event)" />
            </label>
            @if (busy()) {
              <p class="m-0 font-bold text-muted">Bezig met lezen en kaarten zoeken…</p>
            }
            @if (error()) {
              <p class="m-0 font-bold text-red text-pretty">{{ error() }}</p>
            }
            @if (result(); as r) {
              <div class="flex flex-col gap-2 border-t-2 border-dashed border-soft pt-3">
                <div class="font-black text-[16px]">{{ copies(r) }} {{ copies(r) === 1 ? 'kaart' : 'kaarten' }} herkend</div>
                @for (o of others(r); track o.game) {
                  <p class="m-0 text-[13.5px] font-bold text-muted text-pretty">
                    Ook {{ o.n }} {{ o.name }}-{{ o.n === 1 ? 'kaart' : 'kaarten' }}: wissel naar {{ o.name }} en importeer hetzelfde bestand daar nog een keer.
                  </p>
                }
                @if (r.missing.length) {
                  <details class="text-[13.5px] font-bold">
                    <summary class="cursor-pointer text-red">{{ missingCopies(r) }} niet gevonden</summary>
                    <ul class="m-0 mt-2 pl-5 flex flex-col gap-1 text-muted">
                      @for (m of r.missing.slice(0, 50); track $index) {
                        <li>{{ m.qty }}× {{ m.name }}{{ m.set ? ' · ' + m.set : '' }}{{ m.number ? ' · ' + m.number : '' }}</li>
                      }
                      @if (r.missing.length > 50) {
                        <li>en nog {{ r.missing.length - 50 }} andere</li>
                      }
                    </ul>
                  </details>
                }
                @if (r.hits.length) {
                  <button (click)="add(r)" class="btn self-start"><span class="icon text-[19px]">add</span>Toevoegen aan collectie</button>
                }
              </div>
            }
          }
        </div>
      </div>
    }
  `,
})
export class ImportSheet {
  protected readonly store = inject(CardcaseStore);
  protected get gameName() { return gameInfo(GAME as Game).name; }
  protected readonly fileName = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly result = signal<ImportResult | null>(null);
  protected readonly done = signal('');

  protected copies = (r: ImportResult) => r.hits.reduce((a, h) => a + h.qty, 0);
  protected missingCopies = (r: ImportResult) => r.missing.reduce((a, m) => a + m.qty, 0);
  protected others = (r: ImportResult) =>
    Object.entries(r.other).map(([game, n]) => ({ game, n: n!, name: gameInfo(game as Game)?.name ?? game }));

  protected async pick(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.fileName.set(file.name);
    this.error.set('');
    this.result.set(null);
    this.busy.set(true);
    try {
      const rows = parseFile(await file.text());
      if (!rows.length) throw new Error('Er staan geen kaarten in dit bestand.');
      const vers = (c: any) => this.store.vers(c);
      // Match once to know the cards, fetch their prices (for Pokémon also which versions they have), then match again.
      const first = matchRows(rows, CARDS, GAME as Game, vers);
      await this.store.pricesFor([...new Set(first.hits.map((h) => h.id))]);
      this.result.set(matchRows(rows, CARDS, GAME as Game, vers));
    } catch (err: any) {
      this.error.set(err?.message?.startsWith('Er ') ? err.message : 'Dit bestand kon ik niet lezen. Is het een CSV- of JSON-export?');
    } finally {
      this.busy.set(false);
    }
  }

  protected add(r: ImportResult) {
    this.store.applyImport(r.hits);
    const n = this.copies(r);
    this.done.set(`${n} ${n === 1 ? 'kaart' : 'kaarten'} toegevoegd aan je collectie.`);
    this.result.set(null);
  }

  protected undo() {
    this.store.undoImport();
    this.done.set('De import is ongedaan gemaakt.');
  }

  protected close() {
    this.store.setState({ importOpen: false, importUndo: null });
    this.fileName.set('');
    this.result.set(null);
    this.error.set('');
    this.done.set('');
  }
}
