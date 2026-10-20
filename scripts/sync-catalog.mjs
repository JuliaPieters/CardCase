#!/usr/bin/env node
// Downloads the full Pokémon TCG catalog from TCGdex (EN + DE names, JA, ZH-TW, ZH-CN) into public/catalog.json.
// Card details (rarity, type, dex number, illustrator) come from TCGdex's filter endpoints, so we need a few
// thousand requests instead of one per card. Prices are not included: the app fetches those per card at runtime.
//
// Images TCGdex lacks are filled in from other sources afterwards (scripts/sync-images.mjs).
//
// Usage: npm run sync-catalog

import { mkdir, writeFile } from 'node:fs/promises';
import { addImages } from './sync-images.mjs';

const API = 'https://api.tcgdex.net/v2';
const OUT = new URL('../public/catalog.json', import.meta.url);
const CONCURRENCY = 8;
/** TCGdex language → app language. DE shares card ids with EN and only contributes names/images. */
const EDITIONS = [
  { api: 'en', lang: 'EN' },
  { api: 'ja', lang: 'JA' },
  { api: 'zh-tw', lang: 'ZH' },
  { api: 'zh-cn', lang: 'ZH' },
];
/** Digital-only TCG Pocket sets are left out. */
const SKIP_SERIES = new Set(['tcgp']);
const CATEGORIES = ['Pokemon', 'Trainer', 'Energy'];

let done = 0;
async function get(path) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(API + path);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`${res.status} ${path}`);
      done++;
      if (done % 250 === 0) process.stdout.write(`  ${done} verzoeken…\n`);
      return await res.json();
    } catch (err) {
      if (attempt >= 4) throw err;
      await new Promise((r) => setTimeout(r, 500 * attempt));
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

/** Runs `/cards?field=eq:value` for every value and returns Map<cardId, value>. */
async function attribute(api, field, values) {
  const map = new Map();
  await mapLimit(values, async (value) => {
    const list = await get(`/${api}/cards?${field}=eq:${encodeURIComponent(value)}`);
    for (const c of list ?? []) if (!map.has(c.id)) map.set(c.id, value);
  });
  return map;
}

const strings = new Map();
const table = [];
/** Interns repeated strings (rarities, types, illustrators) into one lookup table. */
function str(s) {
  if (s == null) return -1;
  if (!strings.has(s)) {
    strings.set(s, table.length);
    table.push(s);
  }
  return strings.get(s);
}

/** Image base URL for a set, e.g. https://assets.tcgdex.net/en/sv/sv03.5/ — derived from any card that has one. */
function imageBase(cards) {
  const c = cards.find((x) => x.image);
  return c ? c.image.slice(0, c.image.length - c.localId.length) : null;
}

async function main() {
  const sets = [];
  const cards = [];
  const deNames = new Map();
  const deImages = new Map();

  console.log('Duitse namen ophalen…');
  for (const c of (await get('/de/cards')) ?? []) {
    deNames.set(c.id, c.name);
    if (c.image) deImages.set(c.id, c.image);
  }

  for (const ed of EDITIONS) {
    console.log(`\n[${ed.api}] sets en kaarten ophalen…`);
    const setList = (await get(`/${ed.api}/sets`)) ?? [];
    const details = await mapLimit(setList, (s) => get(`/${ed.api}/sets/${encodeURIComponent(s.id)}`));
    const all = (await get(`/${ed.api}/cards`)) ?? [];

    console.log(`[${ed.api}] details ophalen (zeldzaamheid, type, dex-nummer, illustrator)…`);
    const rarities = (await get(`/${ed.api}/rarities`)) ?? [];
    const types = (await get(`/${ed.api}/types`)) ?? [];
    const illustrators = (await get(`/${ed.api}/illustrators`)) ?? [];
    const dexIds = Array.from({ length: 1025 }, (_, i) => String(i + 1));
    const [rarity, type, category, illus, dex] = await Promise.all([
      attribute(ed.api, 'rarity', rarities),
      attribute(ed.api, 'types', types),
      attribute(ed.api, 'category', CATEGORIES),
      attribute(ed.api, 'illustrator', illustrators),
      attribute(ed.api, 'dexId', dexIds),
    ]);

    const bySet = new Map();
    for (const c of all) {
      const setId = c.id.slice(0, c.id.length - c.localId.length - 1);
      if (!bySet.has(setId)) bySet.set(setId, []);
      bySet.get(setId).push(c);
    }

    details.forEach((d, i) => {
      if (!d || SKIP_SERIES.has(d.serie?.id)) return;
      const list = bySet.get(d.id) ?? [];
      if (!list.length) return;
      const setIdx = sets.length;
      const prefix = ed.lang === 'EN' ? '' : ed.api.toUpperCase() + '-';
      const deList = ed.lang === 'EN' ? list.map((c) => ({ ...c, image: deImages.get(c.id) })) : [];
      sets.push({
        code: prefix + d.id,
        id: d.id,
        api: ed.api,
        lang: ed.lang,
        name: d.name ?? setList[i].name,
        serie: d.serie?.name ?? '',
        year: Number((d.releaseDate || '').slice(0, 4)) || null,
        official: d.cardCount?.official ?? list.length,
        img: imageBase(list),
        imgDE: ed.lang === 'EN' ? imageBase(deList) : null,
        hasDE: ed.lang === 'EN' && list.some((c) => deNames.has(c.id)),
      });
      for (const c of list) {
        const dexValue = dex.get(c.id);
        cards.push([
          setIdx,
          c.localId,
          c.name,
          ed.lang === 'EN' ? (deNames.get(c.id) ?? null) : null,
          str(rarity.get(c.id) ?? null),
          str(type.get(c.id) ?? null),
          dexValue ? Number(dexValue) : 0,
          str(illus.get(c.id) ?? null),
          (c.image ? 1 : 0) | (ed.lang === 'EN' && deImages.has(c.id) ? 2 : 0),
          CATEGORIES.indexOf(category.get(c.id) ?? 'Pokemon'),
        ]);
      }
    });
    console.log(`[${ed.api}] klaar: ${sets.filter((s) => s.api === ed.api).length} sets`);
  }

  const out = { v: 1, generated: new Date().toISOString(), strings: table, sets, cards };
  console.log('\nOntbrekende afbeeldingen aanvullen…');
  await addImages(out);
  await mkdir(new URL('.', OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(out));
  console.log(`\nKlaar: ${sets.length} sets, ${cards.length} kaarten → public/catalog.json (${done} verzoeken)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
