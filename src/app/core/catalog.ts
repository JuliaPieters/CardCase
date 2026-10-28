import { Injectable, signal } from '@angular/core';
import { CARDS, applyGameConfig, mockCatalog, setCatalog } from './data';
import type { GameConfig } from '../games/config';
import { applyGameChrome } from '../games/chrome';
import { loadGame, rememberGame } from '../games/registry';
import type { CardSource, Game, PriceEntry, PriceVersions } from '../games/types';

const PRICE_TTL = 24 * 60 * 60 * 1000;

export type CatalogSource = 'catalog' | 'mock';

/** Version of the loaded catalog; the scanner's image index (public/card-hashes.bin) must have been built from the same one. */
export let catalogVersion = '';

/**
 * Loads the active department's catalog (through its CardSource, see games/) into data.ts, and keeps its prices:
 * cached in the browser per game, fetched again after a day.
 */
@Injectable({ providedIn: 'root' })
export class CatalogService {
  /** Where the current catalog came from. */
  readonly sourceKind = signal<CatalogSource>('mock');
  /** Bumped whenever new prices arrive, so views that show prices recompute. */
  readonly priceTick = signal(0);

  /** The department whose catalog is loaded. */
  readonly game = signal<Game>('pokemon');
  config!: GameConfig;

  private source?: CardSource;
  private texts = new Map<string, string>();
  private prices: Record<string, PriceEntry> = {};
  private inFlight = new Set<string>();

  async load(game: Game): Promise<void> {
    try {
      localStorage.removeItem('cc-catalog-v1'); // cache of the earlier single-set loader
    } catch {}
    const mod = await loadGame(game);
    this.game.set(game);
    this.config = mod.config;
    this.source = mod.source;
    this.prices = readPrices(game);
    applyGameConfig(mod.config);
    rememberGame(game);
    applyGameChrome(game);
    try {
      const { sets, cards, version } = await mod.source.loadCatalog();
      catalogVersion = version;
      setCatalog(sets, cards, today());
      this.applyCachedPrices();
      this.sourceKind.set('catalog');
      if (mod.source.bulkPrices) this.ensurePrices(CARDS.map((c) => c.id));
    } catch (err) {
      // Pokémon falls back to the prototype's fictional catalog (offline, tests); other games start empty.
      console.warn('[catalog] catalogus niet geladen', err);
      const m = game === 'pokemon' ? mockCatalog() : { sets: [], cards: [] };
      setCatalog(m.sets, m.cards);
      this.sourceKind.set('mock');
    }
  }

  /**
   * A card's rules text: from the config, or fetched from the source (it then appears when it arrives: the views
   * recompute on priceTick).
   */
  text(c: any, lang: string): string {
    const fromConfig = this.config?.cardText?.(c, lang);
    if (fromConfig || !this.source?.cardText) return fromConfig || '';
    if (this.texts.has(c.key)) return this.texts.get(c.key)!;
    this.texts.set(c.key, '');
    void this.source.cardText(c).then((t) => {
      this.texts.set(c.key, t);
      if (t) this.priceTick.update((n) => n + 1);
    });
    return '';
  }

  /** Makes sure the given cards (by catalog index) have a fresh price; fetches the missing ones in the background (done when it resolves). */
  ensurePrices(ids: Iterable<number>): Promise<void> {
    if (this.sourceKind() !== 'catalog' || !this.source) return Promise.resolve();
    const now = Date.now();
    const todo = [];
    for (const id of ids) {
      const c = CARDS[id];
      if (!c?.key || this.inFlight.has(c.key)) continue;
      const hit = this.prices[c.key];
      if (hit && now - hit[0] < PRICE_TTL) continue;
      this.inFlight.add(c.key);
      todo.push(c);
    }
    return todo.length ? this.fetchPrices(this.source, todo) : Promise.resolve();
  }

  private async fetchPrices(source: CardSource, cards: any[]) {
    const game = this.game();
    const got = await source.getPrices(cards).catch(() => ({}) as Record<string, PriceEntry>);
    cards.forEach((c) => this.inFlight.delete(c.key));
    // Switched department in the meantime: these cards are gone.
    if (game !== this.game()) return;
    for (const c of cards) {
      const p = got[c.key];
      if (!p) continue;
      this.prices[c.key] = p;
      applyPrice(c, p);
    }
    writePrices(game, this.prices);
    this.priceTick.update((n) => n + 1);
  }

  private applyCachedPrices() {
    for (const c of CARDS) {
      const p = this.prices[c.key];
      if (p) applyPrice(c, p);
    }
  }
}

function applyPrice(c: any, p: PriceEntry) {
  c.trend = p[1];
  c.low = p[2];
  c.avg1 = p[3];
  c.avg7 = p[4];
  c.avg30 = p[5];
  // The foil print, when it has a price of its own; or the versions of the card (Pokémon), each with its prices.
  const rest = p.slice(6);
  const pv = rest.find((x) => x && typeof x === 'object') as PriceVersions | undefined;
  const n = rest as (number | null)[];
  c.foil = !pv && rest.length ? { trend: n[0], low: n[1], avg1: n[2], avg7: n[3], avg30: n[4] } : null;
  c.pv = pv ?? null;
  c.vp = pv ? Object.fromEntries(pv.v.map(([k, , trend, low, avg1, avg7, avg30]) => [k, { trend, low, avg1, avg7, avg30 }])) : c.foil ? { foil: c.foil } : {};
}

const today = () => new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });

/** Pokémon keeps the key it had before there were departments (v2: with the versions of each card). */
const priceKey = (game: Game) => (game === 'pokemon' ? 'cc-prices-v2' : `cc-prices-${game}-v1`);

function readPrices(game: Game): Record<string, PriceEntry> {
  try {
    const raw: Record<string, PriceEntry> = JSON.parse(localStorage.getItem(priceKey(game)) || '{}');
    if (game !== 'pokemon') return raw;
    localStorage.removeItem('cc-prices-v1'); // Pokémon prices without the versions of each card
    // Pokémon prices cached before card keys had a game prefix ("sv08/250").
    return Object.fromEntries(Object.entries(raw).map(([k, p]) => [k.includes(':') ? k : 'pokemon:' + k.replace('/', '-'), p]));
  } catch {
    return {};
  }
}

function writePrices(game: Game, p: Record<string, PriceEntry>) {
  try {
    localStorage.setItem(priceKey(game), JSON.stringify(p));
  } catch {
    // Storage full: prices are simply refetched later.
  }
}
