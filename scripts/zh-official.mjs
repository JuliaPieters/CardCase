// The official Traditional Chinese card database (asia.pokemon-card.com/tw): the full card list, and per card the
// details from its page (set code, collector number, Pokédex number, illustrator, type). Details are cached in
// scripts/cache (committed), so only cards that are new since the last sync are fetched.
//
// Usage: node scripts/zh-official.mjs   (fills the cache; npm run sync-catalog uses it)

import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const SITE = 'https://asia.pokemon-card.com/tw';
const LIST = SITE + '/card-search/list/?pageNo=';
const CACHE_DIR = new URL('cache/', import.meta.url);
const CACHE = new URL('zh-details.json', CACHE_DIR);
const LIST_CACHE = new URL('zh-list.json', CACHE_DIR);
// Same pace as for the Japanese site: slow, and back off when blocked.
const CONCURRENCY = 2;
const PAUSE_MS = 600;
const BLOCKED_WAIT_MIN = [5, 10, 20, 30];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Whether the whole site is down for maintenance: then every page redirects to a notice on its home page. */
async function inMaintenance() {
  const res = await fetch('https://asia.pokemon-card.com/').catch(() => null);
  return /under maintenance/i.test((await res?.text()) ?? '');
}

/** Fetches a page; when blocked it waits and tries again, unless `wait` is false. */
async function get(url, wait = true) {
  let blocked = 0;
  for (let attempt = 1; ; attempt++) {
    try {
      await sleep(PAUSE_MS);
      // When it's had enough the site doesn't answer 403 but redirects every page to its home page: count that as
      // blocked too, not as an empty card page. During maintenance it does the same, for hours: don't wait for that.
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Cardcase catalog sync)' }, redirect: 'manual' });
      if (res.status === 404) return null;
      if (res.status >= 300 && res.status < 400 && (await inMaintenance()))
        throw new Error('site in onderhoud (geblokkeerd)');
      if (res.status === 403 || res.status === 429 || (res.status >= 300 && res.status < 400)) {
        if (!wait || blocked >= BLOCKED_WAIT_MIN.length)
          throw new Error(`${res.status} ${url} (nog steeds geblokkeerd)`);
        const min = BLOCKED_WAIT_MIN[blocked++];
        console.log(`  geblokkeerd door asia.pokemon-card.com (${res.status}), ${min} min wachten…`);
        await sleep(min * 60_000);
        attempt = 0;
        continue;
      }
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      return await res.text();
    } catch (err) {
      if (attempt >= 5 || /geblokkeerd/.test(err.message)) throw err;
      await sleep(1500 * attempt);
    }
  }
}

async function mapLimit(items, fn) {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
      while (next < items.length) await fn(items[next++]);
    }),
  );
}

const idsOn = (html) => [...new Set([...html.matchAll(/\/card-search\/detail\/(\d+)\//g)].map((m) => Number(m[1])))];

/** Ids of every card in the database, lowest first. */
export async function officialList() {
  const { mtimeMs } = await stat(LIST_CACHE).catch(() => ({ mtimeMs: 0 }));
  if (Date.now() - mtimeMs < 24 * 60 * 60 * 1000) return JSON.parse(await readFile(LIST_CACHE, 'utf8'));
  try {
    const first = await get(LIST + 1, false);
    const pages = Number(/共\s*(\d+)\s*頁/.exec(first)?.[1]);
    if (!pages) throw new Error('aantal pagina’s niet gevonden');
    const ids = new Set(idsOn(first));
    await mapLimit(
      Array.from({ length: pages - 1 }, (_, i) => i + 2),
      async (p) => idsOn((await get(LIST + p)) ?? '').forEach((id) => ids.add(id)),
    );
    const list = [...ids].sort((a, b) => a - b);
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(LIST_CACHE, JSON.stringify(list));
    return list;
  } catch (err) {
    console.log(`  kaartlijst niet opgehaald (${err.message}), lijst van de vorige keer gebruikt`);
    return JSON.parse(await readFile(LIST_CACHE, 'utf8'));
  }
}

const decode = (s) =>
  s
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

/** Card details from its page. `stage` is the marker above the name ("基礎", "1階進化", or a trainer kind). */
export function parseDetail(html) {
  const h1 = /<h1 class="pageHeader cardDetail">([\s\S]*?)<\/h1>/.exec(html)?.[1] ?? '';
  const stage = /<span class="evolveMarker">([\s\S]*?)<\/span>/.exec(h1)?.[1];
  const num = decode(/<span class="collectorNumber">([\s\S]*?)<\/span>/.exec(html)?.[1] ?? '').replace(/\s/g, '');
  const [localId, total] = num.includes('/') ? num.split('/') : [num, ''];
  const product = decode(/<section class="expansionLinkColumn">[\s\S]*?<a [^>]*>([\s\S]*?)<\/a>/.exec(html)?.[1] ?? '');
  const illus = /illustratorName=([^"&]+)"/.exec(html)?.[1];
  return {
    name: decode(h1.replace(/<span class="evolveMarker">[\s\S]*?<\/span>/, '')),
    stage: stage ? decode(stage) : null,
    pokemon: /<span class="hitPoint">/.test(html),
    set: /expansionCodes=([^"&]+)"/.exec(html)?.[1] ?? null,
    product: /「(.+)」/.exec(product)?.[1] ?? (product || null),
    localId: localId || null,
    total: /^\d+/.exec(total)?.[0] ?? null,
    dex: Number(/<h3>No\.(\d+)/.exec(html)?.[1]) || 0,
    illus: illus ? decode(decodeURIComponent(illus.replace(/\+/g, ' '))) : null,
    type: /class="type">[\s\S]*?\/energy\/([A-Za-z]+)\.png/.exec(html)?.[1] ?? null,
  };
}

/**
 * Fills `cache` with the given cards' pages as the Wayback Machine archived them, for when the site itself is down.
 * It has only part of them. Returns how many it added.
 */
async function fromArchive(ids, cache, log) {
  const want = new Set(ids);
  let listed;
  try {
    const res = await fetch(
      'https://web.archive.org/cdx/search/cdx?url=asia.pokemon-card.com/tw/card-search/detail/*' +
        '&output=json&fl=original&collapse=urlkey&filter=statuscode:200',
    );
    listed = (await res.json()).slice(1).map(([url]) => Number(/detail\/(\d+)/.exec(url)?.[1]));
  } catch (err) {
    log(`  webarchief niet bereikbaar (${err.message})`);
    return 0;
  }
  const todo = [...new Set(listed)].filter((id) => want.has(id));
  log(`[zh] ${todo.length} van de ${ids.length} ontbrekende kaarten staan in het webarchief`);
  let added = 0;
  let done = 0;
  await mapLimit(todo, async (id) => {
    // id_ gives the page as archived, without the archive's toolbar; "2" picks the nearest snapshot.
    await sleep(PAUSE_MS);
    const url = `https://web.archive.org/web/2id_/${SITE}/card-search/detail/${id}/`;
    const html = await fetch(url)
      .then((res) => (res.ok ? res.text() : null))
      .catch(() => null);
    const d = html && parseDetail(html);
    if (d && d.name) {
      cache[id] = d;
      added++;
    }
    if (++done % 250 === 0) {
      log(`  ${done}/${todo.length}`);
      await writeFile(CACHE, JSON.stringify(cache));
    }
  });
  await writeFile(CACHE, JSON.stringify(cache));
  return added;
}

/**
 * Details for the given card ids, from the cache or (unless `fetchMissing` is false) the site. Returns Map<id, details>;
 * cards whose page couldn't be fetched are left out.
 */
export async function officialDetails(ids, log = console.log, { fetchMissing = true } = {}) {
  let cache = {};
  try {
    cache = JSON.parse(await readFile(CACHE, 'utf8'));
  } catch {}
  // Pages fetched while the site was redirecting everything: fetch them again.
  for (const id of Object.keys(cache)) if (!cache[id].name) delete cache[id];
  await mkdir(CACHE_DIR, { recursive: true });
  const todo = ids.filter((id) => !cache[id]);
  log(
    `[zh] ${ids.length - todo.length} kaartdetails uit cache, ${todo.length} ${fetchMissing ? 'op te halen' : 'ontbreken'}`,
  );
  let done = 0;
  let stopped = null;
  await mapLimit(fetchMissing ? todo : [], async (id) => {
    if (stopped) return;
    const html = await get(`${SITE}/card-search/detail/${id}/`).catch((err) => {
      if (/geblokkeerd/.test(err.message)) stopped = err.message;
      return null;
    });
    const d = html && parseDetail(html);
    if (d && d.name) cache[id] = d;
    if (++done % 250 === 0) {
      log(`  ${done}/${todo.length}`);
      await writeFile(CACHE, JSON.stringify(cache));
    }
  });
  await writeFile(CACHE, JSON.stringify(cache));
  if (stopped) {
    log(`[zh] gestopt: ${stopped}`);
    const archived = await fromArchive(ids.filter((id) => !cache[id]), cache, log);
    log(`[zh] ${archived} kaarten uit het webarchief; draai de sync later opnieuw voor de rest`);
  }
  return new Map(ids.filter((id) => cache[id]).map((id) => [id, cache[id]]));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const list = await officialList();
  console.log(`${list.length} kaarten in de officiële database`);
  const details = await officialDetails(list);
  console.log(`Klaar: ${details.size} kaartdetails`);
}
