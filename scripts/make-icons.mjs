#!/usr/bin/env node
// Renders the home-screen app icons in public/icons/ from public/icons/app-icon.png: a 512px square with a red
// rounded border (14px wide, ~113px corner radius) around a dark face, and white outside the corners.
//  - icon-*.png (Android launchers, desktop install): the artwork as drawn, corners made transparent.
//  - apple-touch-icon.png: corners filled red, so iOS's own rounding leaves the red border running all round.
//  - maskable-512.png: the face only on its dark background, shrunk into the central safe zone that Android's
//    circle and squircle masks keep.
// It also packs public/icons/favicon.png into public/favicon.ico, for browsers that ask for /favicon.ico regardless.
// The original logo artwork lives in design/.
//
// Usage: npm run icons

import { writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const DIR = new URL('../public/icons/', import.meta.url).pathname;
const S = 512;
const RED = '#E3350D';
const DARK = '#1A1C22';

const rounded = (inset, r) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">
    <rect x="${inset}" y="${inset}" width="${S - 2 * inset}" height="${S - 2 * inset}" rx="${r}" fill="#fff"/></svg>`);
const clip = (inset, r) => sharp(DIR + 'app-icon.png').resize(S, S).composite([{ input: rounded(inset, r), blend: 'dest-in' }]).png().toBuffer();
const square = (color) => sharp({ create: { width: S, height: S, channels: 4, background: color } });

const art = await clip(0, 113);
const face = await clip(14, 100);
const onRed = await square(RED).composite([{ input: art }]).png().toBuffer();
const shrunkFace = await sharp(face).resize(Math.round(S * 0.86)).toBuffer();
const maskable = await square(DARK).composite([{ input: shrunkFace, gravity: 'center' }]).png().toBuffer();

const icons = [
  ['icon-192.png', art, 192],
  ['icon-512.png', art, 512],
  ['apple-touch-icon.png', onRed, 180],
  ['maskable-512.png', maskable, 512],
];
for (const [name, img, size] of icons) {
  await sharp(img).resize(size, size).png().toFile(DIR + name);
  console.log('wrote public/icons/' + name);
}

// An .ico may hold PNG images as-is: a 6-byte header, a 16-byte entry per image, then the PNG data.
const sizes = [16, 32, 48];
const pngs = await Promise.all(sizes.map((n) => sharp(DIR + 'favicon.png').resize(n, n).png().toBuffer()));
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
await writeFile(new URL('../public/favicon.ico', import.meta.url), Buffer.concat([header, ...pngs]));
console.log('wrote public/favicon.ico');
