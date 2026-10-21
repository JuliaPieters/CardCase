#!/usr/bin/env node
// Renders the home-screen app icons in public/icons/ from the SVG below (the red device with the blue lens and LEDs
// from the app header). Maskable icons keep the artwork inside the central 80% safe zone.
//
// Usage: npm run icons

import sharp from 'sharp';

const OUT = new URL('../public/icons/', import.meta.url);

/** Artwork scale: 1 fills the square, smaller leaves room for Android's mask shapes. */
const svg = (scale) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="lens" cx="34%" cy="32%" r="70%">
      <stop offset="12%" stop-color="#E6F3FF"/><stop offset="30%" stop-color="#6FB2EE"/><stop offset="72%" stop-color="#2C63A8"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" fill="#E3350D"/>
  <g transform="translate(256 256) scale(${scale}) translate(-256 -256)">
    <circle cx="200" cy="230" r="118" fill="#1A1C22"/>
    <circle cx="200" cy="230" r="108" fill="#FFF8EE"/>
    <circle cx="200" cy="230" r="88" fill="url(#lens)" stroke="#1A1C22" stroke-width="8"/>
    <circle cx="356" cy="150" r="24" fill="#FF5A4E" stroke="#1A1C22" stroke-width="8"/>
    <circle cx="356" cy="230" r="24" fill="#F6C945" stroke="#1A1C22" stroke-width="8"/>
    <circle cx="356" cy="310" r="24" fill="#7BD15B" stroke="#1A1C22" stroke-width="8"/>
    <rect x="96" y="380" width="320" height="22" rx="11" fill="#1A1C22" opacity=".55"/>
  </g>
</svg>`;

const icons = [
  ['icon-192.png', 192, 1],
  ['icon-512.png', 512, 1],
  ['maskable-512.png', 512, 0.78],
  ['apple-touch-icon.png', 180, 0.9],
];
for (const [name, size, scale] of icons) {
  await sharp(Buffer.from(svg(scale))).resize(size, size).png().toFile(new URL(name, OUT).pathname);
  console.log('wrote public/icons/' + name);
}
