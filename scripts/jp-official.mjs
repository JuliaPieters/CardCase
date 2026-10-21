// The official Japanese card database (pokemon-card.com): the full card list, and per card the details from its
// page (collector number, rarity, Pokédex number, illustrator, type). Details are cached in scripts/cache (committed),
// so only cards that are new since the last sync are fetched.
//
// Usage: node scripts/jp-official.mjs   (fills the cache; npm run sync-catalog uses it)

import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const SITE = 'https://www.pokemon-card.com';
const LIST = SITE + '/card-search/resultAPI.php?regulation_sidebar_form=all&page=';
// In the repo, not node_modules/.cache: a fresh checkout shouldn't have to fetch 23,000 pages again.
const CACHE_DIR = new URL('cache/', import.meta.url);
const CACHE = new URL('jp-details.json', CACHE_DIR);
const LIST_CACHE = new URL('jp-list.json', CACHE_DIR);
// The site blocks clients that ask too much at once (403 for a while), so keep it slow and back off when blocked.
const CONCURRENCY = 2;
const PAUSE_MS = 600;
const BLOCKED_WAIT_MIN = [5, 10, 20, 30];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Fetches a page; when blocked it waits and tries again, unless `wait` is false. */
async function get(url, json, wait = true) {
  let blocked = 0;
  for (let attempt = 1; ; attempt++) {
    try {
      await sleep(PAUSE_MS);
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Cardcase catalog sync)' },
      });
      if (res.status === 404) return null;
      if (res.status === 403 || res.status === 429) {
        if (!wait || blocked >= BLOCKED_WAIT_MIN.length)
          throw new Error(`${res.status} ${url} (nog steeds geblokkeerd)`);
        const min = BLOCKED_WAIT_MIN[blocked++];
        console.log(`  geblokkeerd door pokemon-card.com (${res.status}), ${min} min wachten…`);
        await sleep(min * 60_000);
        attempt = 0;
        continue;
      }
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      return json ? await res.json() : await res.text();
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

/** Every card in the database: { id, name, path } with path the image below /card_images/ ("large/SV2a/043585_P_X.jpg"). */
export async function officialList() {
  let cards;
  // The list barely changes within a day; fetching it again only adds to the request count.
  const { mtimeMs } = await stat(LIST_CACHE).catch(() => ({ mtimeMs: 0 }));
  if (Date.now() - mtimeMs < 24 * 60 * 60 * 1000) cards = JSON.parse(await readFile(LIST_CACHE, 'utf8'));
  else
    try {
      // Blocked right away: don't wait, the list of the previous run is fine.
      const first = await get(LIST + 1, true, false);
      cards = [...first.cardList];
      const pages = Array.from({ length: first.maxPage - 1 }, (_, i) => i + 2);
      await mapLimit(pages, async (p) => cards.push(...((await get(LIST + p, true))?.cardList ?? [])));
      await mkdir(CACHE_DIR, { recursive: true });
      await writeFile(LIST_CACHE, JSON.stringify(cards));
    } catch (err) {
      console.log(`  kaartlijst niet opgehaald (${err.message}), lijst van de vorige keer gebruikt`);
      cards = JSON.parse(await readFile(LIST_CACHE, 'utf8'));
    }
  return cards
    .map((c) => ({
      id: Number(c.cardID),
      name: decode(c.cardNameAltText),
      path: /\/card_images\/(.+)$/.exec(c.cardThumbFile)?.[1] ?? null,
    }))
    .sort((a, b) => a.id - b.id);
}

const decode = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();

/** Card details from its page: number "025/165" or "DPBP#036", rarity icon ("rr"), dex number, illustrator, type. */
export function parseDetail(html) {
  const sub = /<div class="subtext[^"]*">([\s\S]*?)<\/div>/.exec(html)?.[1] ?? '';
  const num = decode(sub.replace(/<[^>]*>/g, '')).replace(/\s+/g, '');
  const [localId, total] = num.includes('/') ? num.split('/') : [num, ''];
  const illus = /[?&]illust=([^"&]+)"/.exec(html)?.[1];
  return {
    localId: localId || null,
    total: /^\d+/.exec(total)?.[0] ?? null,
    rarity: /\/rarity\/ic_rare_([a-z0-9_]+)\.(?:gif|png)/i.exec(sub)?.[1]?.toLowerCase() ?? null,
    dex: Number(/<h4>No\.(\d+)/.exec(html)?.[1]) || 0,
    illus: illus ? decode(decodeURIComponent(illus.replace(/\+/g, ' '))) : null,
    type: /class="hp-type">[\s\S]*?class="icon-([a-z]+) icon"/.exec(html)?.[1] ?? null,
  };
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
  await mkdir(CACHE_DIR, { recursive: true });
  const todo = ids.filter((id) => !cache[id]);
  log(
    `[ja] ${ids.length - todo.length} kaartdetails uit cache, ${fetchMissing ? todo.length + ' op te halen' : todo.length + ' ontbreken'}`,
  );
  let done = 0;
  let stopped = null;
  await mapLimit(fetchMissing ? todo : [], async (id) => {
    if (stopped) return;
    const html = await get(`${SITE}/card-search/details.php/card/${id}/regu/all`, false).catch((err) => {
      if (/geblokkeerd/.test(err.message)) stopped = err.message;
      return null;
    });
    if (html) cache[id] = parseDetail(html);
    if (++done % 250 === 0) {
      log(`  ${done}/${todo.length}`);
      await writeFile(CACHE, JSON.stringify(cache));
    }
  });
  await writeFile(CACHE, JSON.stringify(cache));
  if (stopped) log(`[ja] gestopt: ${stopped}; draai de sync later opnieuw voor de rest`);
  return new Map(ids.filter((id) => cache[id]).map((id) => [id, cache[id]]));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const list = await officialList();
  console.log(`${list.length} kaarten in de officiële database`);
  const details = await officialDetails(list.map((c) => c.id));
  console.log(`Klaar: ${details.size} kaartdetails`);
}
