import { Injectable, inject } from '@angular/core';
import type { CardMatch } from './text';
import { CatalogService, catalogVersion } from './catalog';
import { CARDS } from './data';
import { distance, HASH_BYTES } from './phash';

const WORDS = HASH_BYTES / 4;
/** "CCH2", uint32 card count, catalog version (32 bytes ASCII); see scripts/sync-hashes.mjs. */
const HEADER = 40;

export interface HashSearch {
  /** Only cards of these languages (a card's first language: EN also covers its German print). */
  langs?: ReadonlySet<string> | null;
  /** Likely cards (e.g. the ones in the binder being checked): small bonus. */
  prefer?: ReadonlySet<number>;
  /** The card expected at this spot: bigger bonus. */
  expect?: number | null;
  /** Only these cards (e.g. the prints of a name read by OCR). */
  only?: ReadonlySet<number>;
  limit?: number;
}

/**
 * The perceptual hashes of all catalog photos of the active department (Pokémon: public/card-hashes.bin, built by
 * `npm run sync-hashes`; the others public/card-hashes/<game>.bin, e.g. `npm run sync-hashes-one-piece`), and the search
 * that finds the cards closest to a camera frame. A department without an index scans by text only.
 */
@Injectable({ providedIn: 'root' })
export class CardHashes {
  private words: Uint32Array | null = null;
  private loading?: Promise<boolean>;
  private readonly catalog = inject(CatalogService);

  /** Downloads the index (~600 kB) once; false when it is missing or belongs to another catalog version. */
  load(): Promise<boolean> {
    const game = this.catalog.game();
    this.loading ??= fetch(game === 'pokemon' ? 'card-hashes.bin' : `card-hashes/${game}.bin`)
      .then((res) => (res.ok ? res.arrayBuffer() : null))
      .then((buf) => {
        if (!buf || buf.byteLength < HEADER) return false;
        const head = new DataView(buf);
        const text = (from: number, n: number) => String.fromCharCode(...new Uint8Array(buf, from, n)).replace(/\0+$/, '');
        // Rows must line up with the catalog: an index built from another catalog version would point at wrong cards.
        if (text(0, 4) !== 'CCH2' || head.getUint32(4, true) !== CARDS.length || text(8, 32) !== catalogVersion) return false;
        this.words = new Uint32Array(buf, HEADER, CARDS.length * WORDS);
        return true;
      })
      .catch(() => false);
    // A failed download (e.g. offline) is retried next time.
    this.loading.then((ok) => ok || (this.loading = undefined));
    return this.loading;
  }

  get ready(): boolean {
    return !!this.words;
  }

  /**
   * Cards closest to any of the query hashes (HASH_BYTES each, e.g. several crops of one frame), best first.
   * `conf` maps the bit distance to a percentage: ~95 for the same photo, ~50 for a doubtful look-alike.
   */
  search(queries: Uint32Array, opts: HashSearch = {}): (CardMatch & { d: number })[] {
    const words = this.words;
    if (!words) return [];
    const n = queries.length / WORDS;
    const limit = opts.limit ?? 3;
    const best: { id: number; d: number }[] = [];
    for (let id = 0; id < CARDS.length; id++) {
      const c = CARDS[id];
      if (opts.langs && !opts.langs.has(c.avail[0])) continue;
      if (opts.only && !opts.only.has(id)) continue;
      const off = (c.hashRow ?? id) * WORDS;
      if (!(words[off] | words[off + 1] | words[off + 2] | words[off + 3])) continue;
      let d = 999;
      for (let q = 0; q < n; q++) d = Math.min(d, distance(queries, q * WORDS, words, off));
      if (id === opts.expect) d -= 8;
      else if (opts.prefer?.has(id)) d -= 4;
      if (best.length === limit && d >= best[limit - 1].d) continue;
      let i = best.length;
      while (i > 0 && best[i - 1].d > d) i--;
      best.splice(i, 0, { id, d });
      if (best.length > limit) best.pop();
    }
    return best.map(({ id, d }) => ({ id, d, conf: Math.max(1, Math.min(99, Math.round(100 - (d - 8) * 2.2))) }));
  }
}
