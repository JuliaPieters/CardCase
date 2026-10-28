#!/usr/bin/env node
// Builds public/card-hashes/one-piece.bin: a perceptual hash of every card image in public/catalogs/one-piece.json, in
// the format of scripts/sync-hashes.mjs (header with the catalog's `generated`, then HASH_BYTES per card in catalog
// order). The scanner uses it to tell apart prints of one card number: the regular card and its parallels.
//
// The Japanese image is hashed when there is one: Bandai's English images carry a big white "SAMPLE" across the middle,
// the Japanese ones only a faint outline. The hash looks at the picture, not the language of the text.
//
// Usage: npm run sync-hashes-one-piece   (hashes are cached per image URL, so a rerun only fetches new cards)

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { HASH_BYTES } from '../src/app/core/phash.ts';
import { fetchImage, hashImage } from './sync-hashes.mjs';

const CATALOG = new URL('../public/catalogs/one-piece.json', import.meta.url);
const OUT = new URL('../public/card-hashes/one-piece.bin', import.meta.url);
const CACHE_DIR = new URL('../node_modules/.cache/cardcase/', import.meta.url);
const CACHE = new URL('hashes-one-piece.json', CACHE_DIR);
const CONCURRENCY = 12;

const raw = JSON.parse(await readFile(CATALOG, 'utf8'));
let cache = {};
try {
  cache = JSON.parse(await readFile(CACHE, 'utf8'));
} catch {}
await mkdir(CACHE_DIR, { recursive: true });

const urls = raw.cards.map((c) => {
  const lang = c.i18n.JA?.[3] ? 'JA' : c.i18n.EN?.[3] ? 'EN' : null;
  return lang ? raw.imageBase[lang] + c.i18n[lang][3] : null;
});
const todo = [...new Set(urls.filter((u) => u && !cache[u]))];
console.log(`[one-piece] ${urls.filter(Boolean).length} kaarten met plaatje, ${todo.length} nog te hashen`);

let next = 0;
let done = 0;
let failed = 0;
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
        console.log(`  ${done}/${todo.length} (${failed} mislukt)`);
        await writeFile(CACHE, JSON.stringify(cache));
      }
    }
  }),
);
await writeFile(CACHE, JSON.stringify(cache));

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
await mkdir(new URL('.', OUT), { recursive: true });
await writeFile(OUT, out);
console.log(`[one-piece] ${have} hashes → public/card-hashes/one-piece.bin (${Math.round(out.length / 1024)} kB, ${failed} mislukt)`);
