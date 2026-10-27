import { Injectable, signal } from '@angular/core';
import { CARDS, applyGameConfig, mockCatalog, setCatalog } from './data';
import type { GameConfig } from '../games/config';
import { applyGameChrome } from '../games/chrome';
import { loadGame, rememberGame } from '../games/registry';
import type { CardSource, Game, PriceEntry } from '../games/types';

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
    } catch (err) {
      // Pokémon falls back to the prototype's fictional catalog (offline, tests); other games start empty.
      console.warn('[catalog] catalogus niet geladen', err);
      const m = game === 'pokemon' ? mockCatalog() : { sets: [], cards: [] };
      setCatalog(m.sets, m.cards);
      this.sourceKind.set('mock');
    }
  }

  /** Makes sure the given cards (by catalog index) have a fresh price; fetches the missing ones in the background. */
  ensurePrices(ids: Iterable<number>) {
    if (this.sourceKind() !== 'catalog' || !this.source) return;
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
    if (todo.length) void this.fetchPrices(this.source, todo);
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
}

const today = () => new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });

/** Pokémon keeps the key it had before there were departments. */
const priceKey = (game: Game) => (game === 'pokemon' ? 'cc-prices-v1' : `cc-prices-${game}-v1`);

function readPrices(game: Game): Record<string, PriceEntry> {
  try {
    const raw: Record<string, PriceEntry> = JSON.parse(localStorage.getItem(priceKey(game)) || '{}');
    // Pokémon prices cached before card keys had a game prefix ("sv08/250").
    if (game !== 'pokemon') return raw;
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
