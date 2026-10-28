import { gameInfo } from './registry';
import type { Game } from './types';

/**
 * Departments with a home-screen icon in public/icons/<game>/ (rendered by npm run icons from design/app-icons/), in
 * the order they are offered. The first one is the default.
 */
export const APP_ICONS: readonly Game[] = ['pokemon', 'lorcana', 'magic', 'one-piece'];

/**
 * Dresses the page for a department: `data-game` on <html> (the theme tokens in styles.css follow it; on <html> rather
 * than the route, so overlays and sheets get it too) and the department's favicon.
 */
export function applyGameChrome(game: Game) {
  document.documentElement.dataset['game'] = game;
  const { logos } = gameInfo(game);
  const head = document.head;
  head.querySelectorAll('link[rel="icon"]').forEach((l) => l.remove());
  const link = (href: string, type: string, sizes?: string) => {
    const l = document.createElement('link');
    l.rel = 'icon';
    l.href = href;
    l.type = type;
    if (sizes) l.setAttribute('sizes', sizes);
    head.appendChild(l);
  };
  link(logos.favicon, 'image/svg+xml');
  link(logos.favicon32, 'image/png', '32x32');
}

/**
 * Points the apple-touch-icon and the manifest at the picked home-screen icon (the default when none or an unknown
 * one is picked). A phone takes the icon when the app is added to the home screen; it doesn't change it afterwards.
 */
export function applyAppIcon(picked: string | undefined) {
  const icon = APP_ICONS.find((g) => g === picked) ?? APP_ICONS[0];
  const set = (rel: string, href: string) => {
    let l = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
    if (!l) {
      l = document.createElement('link');
      l.rel = rel;
      document.head.appendChild(l);
    }
    if (l.getAttribute('href') !== href) l.setAttribute('href', href);
  };
  set('apple-touch-icon', `icons/${icon}/apple-touch-icon.png`);
  set('manifest', icon === APP_ICONS[0] ? 'manifest.webmanifest' : `icons/${icon}/manifest.webmanifest`);
}
