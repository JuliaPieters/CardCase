#!/usr/bin/env node
// Renders the home-screen app icons, one set per department that has artwork in design/app-icons/<game>/app-icon.png, into
// public/icons/<game>/. The artwork is a 512px square in the style of the CardCase robot: a coloured rounded border
// (~14px wide, ~113px corner radius; the face is cut out a little inside that) around a dark face, white outside the corners. Border and face colours are read
// from the artwork itself.
//  - icon-*.png (Android launchers, desktop install): the artwork as drawn, corners made transparent.
//  - apple-touch-icon.png: corners filled with the border colour, so iOS's own rounding leaves the border all round.
//  - maskable-512.png: the face only on its dark background, shrunk into the central safe zone that Android's
//    circle and squircle masks keep.
//  - manifest.webmanifest: the app manifest with that department's icons; the app points <link rel="manifest"> at the
//    one picked as app icon (games/chrome.ts). public/manifest.webmanifest is the Pokémon one, the default.
// A new icon also goes in APP_ICONS in src/app/games/chrome.ts, so it can be picked.
// It also packs public/icons/favicon.png into public/favicon.ico, for browsers that ask for /favicon.ico regardless.
//
// Usage: npm run icons

import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const ROOT = new URL('../', import.meta.url).pathname;
const PUBLIC = ROOT + 'public/';
const GAMES = ['pokemon', 'lorcana', 'magic', 'one-piece'];
const S = 512;

const manifest = (iconDir) => ({
  name: 'CardCase',
  short_name: 'CardCase',
  description: 'Verzamel, plan en deel je ruilkaarten.',
  lang: 'nl',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#f7f3e8',
  theme_color: '#e3350d',
  icons: [
    { src: iconDir + 'icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: iconDir + 'icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: iconDir + 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
});

const rounded = (inset, r) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">
    <rect x="${inset}" y="${inset}" width="${S - 2 * inset}" height="${S - 2 * inset}" rx="${r}" fill="#fff"/></svg>`);
const square = (color) => sharp({ create: { width: S, height: S, channels: 4, background: color } });

/** The colour at (x, y) of a raw RGBA buffer of S×S. */
const pick = (raw, x, y) => {
  const i = (y * S + x) * 4;
  return { r: raw[i], g: raw[i + 1], b: raw[i + 2], alpha: 1 };
};

for (const game of GAMES) {
  const src = `${ROOT}design/app-icons/${game}/app-icon.png`;
  if (!existsSync(src)) continue;
  const dir = `${PUBLIC}icons/${game}/`;
  await mkdir(dir, { recursive: true });
  const base = sharp(src).resize(S, S).ensureAlpha();
  const raw = await base.clone().raw().toBuffer();
  const border = pick(raw, 5, S / 2);
  const dark = pick(raw, 30, S / 2);
  const clip = (inset, r) => base.clone().composite([{ input: rounded(inset, r), blend: 'dest-in' }]).png().toBuffer();
  const art = await clip(0, 113);
  const face = await clip(18, 96);
  const filled = await square(border).composite([{ input: art }]).png().toBuffer();
  const shrunkFace = await sharp(face).resize(Math.round(S * 0.86)).toBuffer();
  const maskable = await square(dark).composite([{ input: shrunkFace, gravity: 'center' }]).png().toBuffer();
  const icons = [
    ['icon-192.png', art, 192],
    ['icon-512.png', art, 512],
    ['apple-touch-icon.png', filled, 180],
    ['maskable-512.png', maskable, 512],
  ];
  for (const [name, img, size] of icons) await sharp(img).resize(size, size).png().toFile(dir + name);
  await writeFile(dir + 'manifest.webmanifest', JSON.stringify(manifest(''), null, 2) + '\n');
  console.log(`wrote public/icons/${game}/`);
}
await writeFile(PUBLIC + 'manifest.webmanifest', JSON.stringify(manifest('icons/pokemon/'), null, 2) + '\n');
console.log('wrote public/manifest.webmanifest');

// An .ico may hold PNG images as-is: a 6-byte header, a 16-byte entry per image, then the PNG data.
const sizes = [16, 32, 48];
const pngs = await Promise.all(sizes.map((n) => sharp(PUBLIC + 'icons/favicon.png').resize(n, n).png().toBuffer()));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((n, i) => {
  const e = 6 + 16 * i;
  header.writeUInt8(n, e);
  header.writeUInt8(n, e + 1);
  header.writeUInt16LE(1, e + 4);
  header.writeUInt16LE(32, e + 6);
  header.writeUInt32LE(pngs[i].length, e + 8);
  header.writeUInt32LE(offset, e + 12);
  offset += pngs[i].length;
});
await writeFile(PUBLIC + 'favicon.ico', Buffer.concat([header, ...pngs]));
console.log('wrote public/favicon.ico');
