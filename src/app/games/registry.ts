import type { CardSource, Game, GameInfo } from './types';

const logos = (dir: string) => ({
  mascot: `logos/${dir}/mascotte.svg`,
  favicon: `logos/${dir}/favicon.svg`,
  favicon32: `logos/${dir}/favicon-32.png`,
});

/** All departments, in the order they are offered. */
export const GAMES: readonly GameInfo[] = [
  { game: 'pokemon', name: 'Pokémon', enabled: true, logos: logos('pokemon') },
  { game: 'lorcana', name: 'Disney Lorcana', enabled: true, logos: logos('lorcana') },
  { game: 'magic', name: 'Magic: The Gathering', enabled: true, logos: logos('magic') },
  { game: 'one-piece', name: 'One Piece', enabled: false, logos: logos('one-piece') },
];

export const isGame = (x: unknown): x is Game => GAMES.some((g) => g.game === x);
export const gameInfo = (game: Game): GameInfo => GAMES.find((g) => g.game === game)!;

/** Everything a department brings along; each game is its own lazily loaded chunk. */
export interface GameModule {
  config: import('./config').GameConfig;
  source: CardSource;
}

const LOADERS: Record<Game, () => Promise<GameModule>> = {
  pokemon: () => import('./pokemon').then((m) => m.default),
  lorcana: () => import('./lorcana').then((m) => m.default),
  magic: () => import('./magic').then((m) => m.default),
  'one-piece': () => import('./one-piece').then((m) => m.default),
};

export const loadGame = (game: Game): Promise<GameModule> => LOADERS[game]();

const LAST_KEY = 'cc-last-game';

/** The department to open: the one in the address, else the one used last on this device, else Pokémon. */
export function initialGame(): Game {
  const first = location.pathname.split('/')[1];
  if (isGame(first)) return first;
  try {
    const last = localStorage.getItem(LAST_KEY);
    if (isGame(last)) return last;
  } catch {}
  return 'pokemon';
}

export function rememberGame(game: Game) {
  try {
    localStorage.setItem(LAST_KEY, game);
  } catch {}
}
