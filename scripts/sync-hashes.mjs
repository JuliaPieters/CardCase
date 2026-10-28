#!/usr/bin/env node
// Builds public/card-hashes.bin: a perceptual hash of every card photo in public/catalog.json, which the scanner
// compares camera frames against. Uses the same images the app shows (TCGdex, or the sources of sync-images.mjs).
// Hashes are cached per image URL in node_modules/.cache, so a rerun after a catalog update only fetches new cards.
//
// File format: "CCH2", uint32 card count (little endian), the catalog's `generated` timestamp (32 bytes ASCII), then
// HASH_BYTES per card in catalog order (zeros = no photo). The app only uses it with that exact catalog version.
// Rebuild it after every catalog update (npm run sync-catalog does that).
//
// Usage: npm run sync-hashes   (takes a while the first time: ~38,000 images)

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { HASH_BYTES, HASH_REGIONS, HASH_SIDE, phash, toGray } from '../src/app/core/phash.ts';

const CATALOG = new URL('../public/catalog.json', import.meta.url);
const OUT = new URL('../public/card-hashes.bin', import.meta.url);
const CACHE_DIR = new URL('../node_modules/.cache/cardcase/', import.meta.url);
const CACHE = new URL('hashes.json', CACHE_DIR);
const CONCURRENCY = 12;

/**
 * The image the app shows for a card row (see buildCatalog / altImage in src/app/core/catalog.ts). Images from other
 * sources are fetched as originals, not through the app's resizing proxy: it blocks bulk requests, and the hash
 * doesn't depend on the size anyway.
 */
function imageUrl(raw, row) {
  const set = raw.sets[row[0]];
  if (row[8] & 1 && set.img) return set.img + row[1] + '/low.webp';
  const ref = row[10];
  if (!ref) return null;
  const path = ref.slice(2);
  const url =
    ref[0] === 'J'
      ? `https://www.pokemon-card.com/assets/images/card_images/${path}`
      : ref[0] === 'j'
        ? `https://www.pokemon-card.com/assets/images/card_images/large/${path}.jpg`
        : ref[0] === 'c'
          ? `https://asia.pokemon-card.com/tw/card-img/${path}.png`
          : `https://images.pokemontcg.io/${path}.png`;
  return url;
}

/** Hashes of HASH_REGIONS of an image, as hex. Mirrors hashRegions() in src/app/core/scanner.ts. */
async function hashImage(buf) {
  const img = sharp(buf).removeAlpha();
  const { width, height } = await img.metadata();
  const words = [];
  for (const [x, y, w, h] of HASH_REGIONS) {
    const region = await sharp(buf)
      .removeAlpha()
      .extract({ left: Math.round(x * width), top: Math.round(y * height), width: Math.round(w * width), height: Math.round(h * height) })
      .resize(HASH_SIDE * 2, HASH_SIDE * 2, { fit: 'fill' })
      .toBuffer();
    const { data } = await sharp(region).resize(HASH_SIDE, HASH_SIDE, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
    words.push(...phash(toGray(data, 3)));
  }
  return Buffer.from(Uint32Array.from(words).buffer).toString('hex');
}

async function fetchImage(url) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Cardcase catalog sync)' } });
      if (res.status === 404 || res.status === 403) return null;
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      if (attempt >= 4) return null;
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
}

async function main() {
  const raw = JSON.parse(await readFile(CATALOG, 'utf8'));
  let cache = {};
  try {
    cache = JSON.parse(await readFile(CACHE, 'utf8'));
  } catch {}
  await mkdir(CACHE_DIR, { recursive: true });
  const saveCache = () => writeFile(CACHE, JSON.stringify(cache));

  const urls = raw.cards.map((row) => imageUrl(raw, row));
  // Failed images ('' in the cache) are tried again.
  const todo = [...new Set(urls.filter((u) => u && !cache[u]))];
  console.log(`${urls.filter(Boolean).length} kaarten met foto, ${todo.length} nog te hashen`);

  let next = 0;
  let done = 0;
  let failed = 0;
  const t0 = Date.now();
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < todo.length) {
        const url = todo[next++];
        const buf = await fetchImage(url);
        try {
          cache[url] = buf ? await hashImage(buf) : '';
        } catch {
          cache[url] = '';
        }
        if (!cache[url]) failed++;
        if (++done % 500 === 0) {
          const rate = done / ((Date.now() - t0) / 1000);
          console.log(`  ${done}/${todo.length} (${failed} mislukt, nog ±${Math.round((todo.length - done) / rate / 60)} min)`);
          await saveCache();
        }
      }
    }),
  );
  await saveCache();

  const HEADER = 40;
  const out = Buffer.alloc(HEADER + raw.cards.length * HASH_BYTES);
  out.write('CCH2', 0, 'ascii');
  out.writeUInt32LE(raw.cards.length, 4);
  out.write(String(raw.generated ?? '').slice(0, 32), 8, 'ascii');
  let have = 0;
  urls.forEach((u, i) => {
    const hex = u && cache[u];
    if (hex) {
      Buffer.from(hex, 'hex').copy(out, HEADER + i * HASH_BYTES);
      have++;
    }
  });
  await writeFile(OUT, out);
  console.log(`Klaar: ${have} hashes → public/card-hashes.bin (${Math.round(out.length / 1024)} kB, ${failed} afbeeldingen mislukt)`);
}

export { main as buildHashes, hashImage, fetchImage };

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
