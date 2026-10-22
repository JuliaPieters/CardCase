#!/usr/bin/env node
// Completes the Traditional Chinese cards in public/catalog.json from the official Asian card database
// (scripts/zh-official.mjs): images, illustrators, Pokédex numbers and types for the sets TCGdex has, and the sets
// it lacks. That database has no rarities; the Taiwanese sets are prints of the Japanese ones (same code and
// numbering), so a card takes the rarity of its Japanese print.
// Runs inside npm run sync-catalog (after the Japanese cards), or on its own on the current catalog.
//
// Usage: node scripts/sync-chinese.mjs [--cached]   (--cached: don't fetch card pages, use the cache only)

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { buildHashes } from './sync-hashes.mjs';
import { officialDetails, officialList } from './zh-official.mjs';

const OUT = new URL('../public/catalog.json', import.meta.url);

/** Energy icon on the card page → TCGdex type. */
const TYPES = new Set([
  'Grass',
  'Fire',
  'Water',
  'Lightning',
  'Psychic',
  'Fighting',
  'Darkness',
  'Metal',
  'Fairy',
  'Dragon',
  'Colorless',
]);

/** Taiwanese series a set belongs to, by year (TCGdex's names). */
const serieOf = (year) => (year < 2023 ? '劍＆盾' : year < 2026 ? '朱&紫系列' : 'MEGA');

const num = (id) => (id || '').replace(/^0+(?=.)/, '');
const imageRef = (id) => 'c:tw' + String(id).padStart(8, '0');

/** Takes out the sets an earlier run added (they have no TCGdex `api`), so a rerun starts from TCGdex's data. */
function removeAdded(raw) {
  const keep = raw.sets.map((s) => !(s.lang === 'ZH' && s.api === null));
  const newIdx = [];
  let n = 0;
  keep.forEach((k, i) => (newIdx[i] = k ? n++ : null));
  raw.sets = raw.sets.filter((_, i) => keep[i]);
  raw.cards = raw.cards.filter((row) => keep[row[0]]).map((row) => [newIdx[row[0]], ...row.slice(1)]);
}

/** With `fetchMissing` false, only cached card details are used (no card pages are fetched). */
export async function addChinese(raw, log = console.log, { fetchMissing = true } = {}) {
  const ids = await officialList();
  const details = await officialDetails(ids, log, { fetchMissing });

  removeAdded(raw);
  const strIdx = new Map(raw.strings.map((s, i) => [s, i]));
  const str = (s) => {
    if (s == null) return -1;
    if (!strIdx.has(s)) strIdx.set(s, raw.strings.push(s) - 1);
    return strIdx.get(s);
  };
  const hasRarity = (row) => row[4] >= 0 && raw.strings[row[4]] !== 'None';

  // The Japanese print of a card: same set code and number.
  const japanese = new Map();
  for (const row of raw.cards) {
    const set = raw.sets[row[0]];
    if (set.lang === 'JA') japanese.set(set.id + '/' + num(row[1]), row);
  }
  const jaPrint = (code, localId, dex) => {
    const j = japanese.get(code + '/' + num(localId));
    // Same Pokémon, or both not a Pokémon.
    return j && (dex ? j[6] === dex : !j[6]) ? j : null;
  };

  const bySet = new Map();
  for (const id of ids) {
    const d = details.get(id);
    if (!d?.set || !d.name) continue;
    if (!bySet.has(d.set)) bySet.set(d.set, []);
    bySet.get(d.set).push([id, d]);
  }

  // Sets TCGdex has: fill in what's missing, by collector number.
  const rowsBySet = new Map();
  raw.cards.forEach((row) => {
    if (!rowsBySet.has(row[0])) rowsBySet.set(row[0], []);
    rowsBySet.get(row[0]).push(row);
  });
  const filled = { img: 0, rarity: 0, illus: 0, dex: 0, type: 0 };
  /** Lowest official card id per set with a known year, to date the sets without one. */
  const dated = [];
  raw.sets.forEach((set, s) => {
    if (!set.code.startsWith('ZH-TW-')) return;
    const entries = bySet.get(set.id);
    if (entries) bySet.delete(set.id);
    if (entries && set.year) dated.push([entries[0][0], set.year]);
    const byNum = new Map((entries ?? []).map(([id, d]) => [num(d.localId), [id, d]]));
    for (const row of rowsBySet.get(s) ?? []) {
      const [id, d] = byNum.get(num(row[1])) ?? [];
      if (d && d.dex !== (row[6] || d.dex)) continue; // another card under that number
      if (d && !(row[8] & 1 && set.img) && !row[10]) {
        row[10] = imageRef(id);
        filled.img++;
      }
      if (d?.illus && row[7] < 0) {
        row[7] = str(d.illus);
        filled.illus++;
      }
      if (d?.dex && !row[6]) {
        row[6] = d.dex;
        filled.dex++;
      }
      if (d && TYPES.has(d.type) && row[5] < 0) {
        row[5] = str(d.type);
        filled.type++;
      }
      const j = !hasRarity(row) && jaPrint(set.id, row[1], row[6]);
      if (j && hasRarity(j)) {
        row[4] = j[4];
        filled.rarity++;
      }
    }
  });
  log(
    `[zh] aangevuld: ${filled.img} afbeeldingen, ${filled.rarity} zeldzaamheden, ${filled.illus} illustratoren, ${filled.dex} dex-nummers, ${filled.type} types`,
  );

  dated.sort((a, b) => a[0] - b[0]);
  const nearestYear = (id) =>
    dated.reduce((best, d) => (Math.abs(d[0] - id) < Math.abs(best[0] - id) ? d : best), dated[0])?.[1] ?? null;

  // Sets TCGdex doesn't have.
  let addedSets = 0;
  let addedCards = 0;
  for (const [code, entries] of bySet) {
    const year = nearestYear(entries[0][0]);
    const totals = entries.map(([, d]) => Number(d.total)).filter(Boolean);
    // The product the most cards of the set were listed under ("30th CELEBRATION"), not a promo they also came in.
    const names = new Map();
    for (const [, d] of entries) if (d.product) names.set(d.product, (names.get(d.product) ?? 0) + 1);
    const name = [...names].sort((a, b) => b[1] - a[1])[0]?.[0] ?? code;
    const setIdx = raw.sets.length;
    raw.sets.push({
      code: 'ZH-TW-' + code,
      id: code,
      api: null,
      lang: 'ZH',
      name,
      serie: serieOf(year),
      year,
      released: null,
      official: totals.length ? Math.max(...totals) : entries.length,
      img: null,
      imgDE: null,
      hasDE: false,
    });
    addedSets++;
    entries.sort(([, a], [, b]) => (a.localId ?? '').localeCompare(b.localId ?? '', 'en', { numeric: true }));
    const used = new Set();
    entries.forEach(([id, d], i) => {
      let localId = d.localId ?? String(i + 1).padStart(3, '0');
      while (used.has(localId)) localId += '+';
      used.add(localId);
      const j = jaPrint(code, localId, d.dex);
      const energy = !d.pokemon && /能量/.test(d.stage ?? d.name);
      raw.cards.push([
        setIdx,
        localId,
        d.name,
        null,
        j && hasRarity(j) ? j[4] : -1,
        str(TYPES.has(d.type) ? d.type : null),
        d.dex || (d.pokemon && j?.[6]) || 0,
        str(d.illus ?? null),
        0,
        d.pokemon ? 0 : energy ? 2 : 1,
        imageRef(id),
      ]);
      addedCards++;
    });
  }
  log(`[zh] ${addedSets} sets met ${addedCards} kaarten toegevoegd`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const raw = JSON.parse(await readFile(OUT, 'utf8'));
  await addChinese(raw, console.log, { fetchMissing: !process.argv.includes('--cached') });
  // The rows changed, so this is a new catalog version with its own scanner index.
  raw.generated = new Date().toISOString();
  await writeFile(OUT, JSON.stringify(raw));
  console.log('\nScanner-index bijwerken…');
  await buildHashes();
  console.log('Klaar → public/catalog.json');
}
