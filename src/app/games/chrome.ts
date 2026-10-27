import { gameInfo } from './registry';
import type { Game } from './types';

/**
 * Dresses the page for a department: `data-game` on <html> (the theme tokens in styles.css follow it; on <html> rather
 * than the route, so overlays and sheets get it too) and the department's favicon.
 */
export function applyGameChrome(game: Game) {
  document.documentElement.dataset['game'] = game;
  const { logos } = gameInfo(game);
  const head = document.head;
  head.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]').forEach((l) => l.remove());
  const link = (rel: string, href: string, type?: string, sizes?: string) => {
    const l = document.createElement('link');
    l.rel = rel;
    l.href = href;
    if (type) l.type = type;
    if (sizes) l.setAttribute('sizes', sizes);
    head.appendChild(l);
  };
  link('icon', logos.favicon, 'image/svg+xml');
  link('icon', logos.favicon32, 'image/png', '32x32');
  link('apple-touch-icon', logos.appleTouch);
}
