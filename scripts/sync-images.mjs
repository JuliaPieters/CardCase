#!/usr/bin/env node
// Fills in card images that TCGdex doesn't have, in public/catalog.json:
//  - English cards: pokemontcg.io, matched by set and card number, checked by name.
// Japanese and Taiwanese cards get theirs from the official card databases (scripts/sync-japanese.mjs,
// scripts/sync-chinese.mjs).
// Chinese cards still without an image borrow the Japanese print of the same set at runtime (src/app/core/catalog.ts).
// The image ref is stored as the 11th field of a card row: 'J:<path>' (sync-japanese.mjs), 'c:<id>'
// (sync-chinese.mjs) or 'p:<setId>/<number>'.
//
// Usage: npm run sync-images (also runs at the end of npm run sync-catalog)

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const OUT = new URL('../public/catalog.json', import.meta.url);
const PTCG = 'https://api.pokemontcg.io/v2';
const CONCURRENCY = 4;

async function getJson(url) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Cardcase catalog sync)' } });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      return await res.json();
    } catch (err) {
      if (attempt >= 5) throw err;
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

async function mapLimit(items, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i], i);
      }
    }),
  );
  return out;
}

/** Name for comparing: full-width folded, no spaces or punctuation, lowercase. */
const key = (s) =>
  (s || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s・·.'’\-]/g, '');

/** Collector number for comparing: "SV001" → "SV1", "025" → "25". */
const numKey = (s) => String(s).toUpperCase().replace(/^([A-Z]*)0*(\d)/, '$1$2');

const hasImage = (raw, row) => (row[8] & 1) && raw.sets[row[0]].img;

/** Cards per set (row indexes), in collector-number order. */
function rowsBySet(raw) {
  const by = new Map();
  raw.cards.forEach((row, i) => {
    if (!by.has(row[0])) by.set(row[0], []);
    by.get(row[0]).push(i);
  });
  for (const list of by.values()) list.sort((a, b) => raw.cards[a][1].localeCompare(raw.cards[b][1], 'en', { numeric: true }));
  return by;
}

/**
 * Walks two lists in order and pairs items with the same name; skips a few unmatched items on either side
 * (cards missing from one source). Returns [indexA, indexB] pairs.
 */
function align(a, b) {
  const pairs = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      pairs.push([i++, j++]);
      continue;
    }
    const jj = b.indexOf(a[i], j + 1);
    const ii = a.indexOf(b[j], i + 1);
    if (jj !== -1 && jj - j <= 6 && (ii === -1 || jj - j <= ii - i)) j = jj;
    else if (ii !== -1 && ii - i <= 6) i = ii;
    else {
      i++;
      j++;
    }
  }
  return pairs;
}

async function english(raw, bySet) {
  console.log('[en] pokemontcg.io sets ophalen…');
  const ptcgSets = (await getJson(`${PTCG}/sets?pageSize=250&select=id,name`))?.data ?? [];
  const ids = new Set(ptcgSets.map((s) => s.id));
  const byName = new Map(ptcgSets.map((s) => [key(s.name), s.id]));
  const todo = [];
  raw.sets.forEach((set, s) => {
    if (set.lang !== 'EN') return;
    const missing = (bySet.get(s) ?? []).filter((r) => !hasImage(raw, raw.cards[r]));
    if (!missing.length) return;
    // TCGdex "sm3.5" / "swsh12.5gg" / "sv03.5" ↔ pokemontcg.io "sm35" / "swsh12pt5gg" / "sv3pt5".
    const id = set.id;
    const guesses = [id, id.replace('.5', 'pt5'), id.replace('.', ''), id.replace(/^sv0/, 'sv'), id.replace(/^sv0/, 'sv').replace('.5', 'pt5')];
    const ptcg = guesses.find((g) => ids.has(g)) ?? byName.get(key(set.name));
    if (ptcg) todo.push({ ptcg, missing });
  });
  let added = 0;
  await mapLimit(todo, async ({ ptcg, missing }) => {
    const cards = (await getJson(`${PTCG}/cards?q=set.id:${ptcg}&select=number,name&pageSize=250`))?.data ?? [];
    const byNum = new Map(cards.map((c) => [numKey(c.number), c]));
    for (const r of missing) {
      const row = raw.cards[r];
      const c = byNum.get(numKey(row[1]));
      // The name check guards against sets whose numbering differs between the two sources.
      if (c && (key(c.name).includes(key(row[2])) || key(row[2]).includes(key(c.name)))) {
        row[10] = `p:${ptcg}/${c.number}`;
        added++;
      }
    }
  });
  console.log(`[en] ${added} afbeeldingen toegevoegd (${todo.length} sets)`);
}

export async function addImages(raw) {
  const bySet = rowsBySet(raw);
  await english(raw, bySet);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const raw = JSON.parse(await readFile(OUT, 'utf8'));
  await addImages(raw);
  await writeFile(OUT, JSON.stringify(raw));
  console.log('Klaar → public/catalog.json');
}
