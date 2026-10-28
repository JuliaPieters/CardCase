// Builds public/catalogs/magic.json from Scryfall's bulk data (https://scryfall.com/docs/api/bulk-data): every paper
// Magic: The Gathering card print, with Cardmarket prices in EUR. Run with `npm run sync-magic` (downloads ~80 MB, cached
// in scripts/cache/magic/ until Scryfall has a newer file). Scryfall asks for a User-Agent and at most ~10 requests/s.
// Which languages each print came out in comes from the "All Cards" file (~400 MB, streamed; only the result is cached).
//
// Kept small, since Magic has over 100,000 prints: no rules text (the card page fetches it from Scryfall), and repeated
// strings (names, type lines, artists) in a table.
//
//   { v, generated, source, strings: [...], sets: [{ code, name, type, released }],
//     cards: [[id (Scryfall id as base64url), name, set, number, rarity, colours, identity, cmc, type, eur, eurFoil, legal, finish, flags, artist, rank, manaCost, keywords, restricted, maxCopies, partnerWith, langs]] }
//   - name, type, artist, manaCost: index in strings; keywords: indexes in strings
//   - set: index in sets; rarity: c/u/r/m/s/b (special, bonus)
//   - colours, identity: bit mask W=1 U=2 B=4 R=8 G=16
//   - legal: bit mask in FORMATS order; finish: 1 regular, 2 foil, 4 etched
//   - flags: 1 promo, 2 full art, 4 borderless, 8 extended art, 16 showcase, 32 basic land, 64 any number allowed in a deck,
//     128 "can be your commander" (in its text)
//   - restricted: bit mask in FORMATS order (at most one copy, Vintage); maxCopies: "up to seven cards named …", else 0
//   - rank: EDHREC popularity (lower is more played), 0 when unknown
//   - langs: bit mask in LANGS order of the other languages the print came out in (English always)
import { createReadStream, existsSync } from 'node:fs';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';
import { createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';

const UA = { 'User-Agent': 'CardCase/1.0 (card collection app)', Accept: 'application/json' };
const OUT = new URL('../public/catalogs/magic.json', import.meta.url);
const CACHE = new URL('./cache/magic/', import.meta.url);
export const FORMATS = ['standard', 'pioneer', 'modern', 'legacy', 'vintage', 'pauper', 'commander'];
const COLOURS = { W: 1, U: 2, B: 4, R: 8, G: 16 };
const NUMBERS = { two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
const RARITY = { common: 'c', uncommon: 'u', rare: 'r', mythic: 'm', special: 's', bonus: 'b' };
// Not cards for a deck or a binder of playable cards.
const SKIP_SET_TYPES = new Set(['token', 'memorabilia', 'minigame', 'alchemy']);
/** Languages the app counts besides English, as Scryfall names them, in the order of the bit mask. */
export const LANGS = ['de', 'fr', 'it', 'es', 'ja'];
const SKIP_LAYOUTS = new Set(['token', 'double_faced_token', 'emblem', 'art_series', 'vanguard', 'scheme', 'planar', 'reversible_card']);

const bulk = await (await fetch('https://api.scryfall.com/bulk-data/default-cards', { headers: UA })).json();
const file = new URL(`default-${bulk.updated_at.replace(/\D/g, '').slice(0, 12)}.jsonl`, CACHE);
await mkdir(CACHE, { recursive: true });
if (!existsSync(file)) {
  for (const f of await readdir(CACHE)) if (f.startsWith('default-')) await rm(new URL(f, CACHE));
  console.log(`[magic] nieuwe versie van ${bulk.updated_at} ophalen (${Math.round(bulk.compressed_size / 1e6)} MB)`);
  const res = await fetch(bulk.jsonl_download_uri, { headers: UA });
  await pipeline(Readable.fromWeb(res.body), createGunzip(), createWriteStream(file));
}

/**
 * "set/number" → bit mask of the languages (LANGS) that print came out in, from Scryfall's All Cards file. Cached per
 * version of that file; the download is streamed, it is too big to keep.
 */
async function printLanguages() {
  const all = await (await fetch('https://api.scryfall.com/bulk-data/all-cards', { headers: UA })).json();
  const cached = new URL(`langs-${all.updated_at.replace(/\D/g, '').slice(0, 12)}.json`, CACHE);
  if (existsSync(cached)) return new Map(Object.entries(JSON.parse(await readFile(cached, 'utf8'))));
  console.log(`[magic] talen per kaart ophalen uit All Cards van ${all.updated_at} (${Math.round(all.compressed_size / 1e6)} MB)`);
  const res = await fetch(all.jsonl_download_uri, { headers: UA });
  const map = new Map();
  const lines = createInterface({ input: Readable.fromWeb(res.body).pipe(createGunzip()) });
  for await (const line of lines) {
    // Only a few fields are needed: a regex is much faster than parsing ~2 GB of JSON.
    const lang = /"lang":"([a-z]+)"/.exec(line)?.[1];
    const bit = 1 << LANGS.indexOf(lang);
    if (!lang || bit < 1) continue;
    const set = /"set":"([^"]+)"/.exec(line)?.[1];
    const num = /"collector_number":"([^"]+)"/.exec(line)?.[1];
    if (!set || !num) continue;
    const k = set + '/' + num;
    map.set(k, (map.get(k) || 0) | bit);
  }
  for (const f of await readdir(CACHE)) if (f.startsWith('langs-')) await rm(new URL(f, CACHE));
  await writeFile(cached, JSON.stringify(Object.fromEntries(map)));
  return map;
}
const printLangs = await printLanguages();

const strings = [];
const stringIdx = new Map();
const s = (v) => {
  if (v == null || v === '') return -1;
  if (!stringIdx.has(v)) {
    stringIdx.set(v, strings.length);
    strings.push(v);
  }
  return stringIdx.get(v);
};
const mask = (list = []) => list.reduce((m, c) => m | (COLOURS[c] || 0), 0);
const price = (v) => (v ? Math.round(parseFloat(v) * 100) / 100 : null);

const sets = [];
const setIdx = new Map();
const cards = [];
for await (const line of createInterface({ input: createReadStream(file) })) {
  if (!line.trim()) continue;
  const c = JSON.parse(line);
  if (c.digital || !(c.games || []).includes('paper') || c.oversized || c.lang !== 'en') continue;
  if (SKIP_SET_TYPES.has(c.set_type) || SKIP_LAYOUTS.has(c.layout)) continue;
  if (!setIdx.has(c.set)) {
    setIdx.set(c.set, sets.length);
    sets.push({ code: c.set, name: c.set_name, type: c.set_type, released: c.released_at });
  }
  const face = c.card_faces?.[0] || {};
  const legal = FORMATS.reduce((m, f, i) => m | (c.legalities?.[f] === 'legal' || c.legalities?.[f] === 'restricted' ? 1 << i : 0), 0);
  const finish = (c.finishes || []).reduce((m, f) => m | ({ nonfoil: 1, foil: 2, etched: 4 }[f] || 0), 0);
  const fe = c.frame_effects || [];
  const typeLine = c.type_line || face.type_line || '';
  const text = c.oracle_text || face.oracle_text || '';
  const flags =
    (c.promo ? 1 : 0) |
    (c.full_art ? 2 : 0) |
    (c.border_color === 'borderless' ? 4 : 0) |
    (fe.includes('extendedart') ? 8 : 0) |
    (fe.includes('showcase') ? 16 : 0) |
    (/^Basic( Snow)? Land/.test(typeLine) ? 32 : 0) |
    (/A deck can have any number of cards named/.test(text) ? 64 : 0) |
    (/can be your commander/.test(text) ? 128 : 0);
  // "A deck can have up to seven cards named Seven Dwarves."
  const upTo = /A deck can have up to (\w+) cards named/.exec(text)?.[1];
  const maxCopies = upTo ? (NUMBERS[upTo.toLowerCase()] ?? (parseInt(upTo, 10) || 0)) : 0;
  const restricted = FORMATS.reduce((m, f, i) => m | (c.legalities?.[f] === 'restricted' ? 1 << i : 0), 0);
  cards.push([
    // The Scryfall id (for the image) as 22 characters of base64url instead of 36.
    Buffer.from(c.id.replace(/-/g, ''), 'hex').toString('base64url'),
    s(c.name),
    setIdx.get(c.set),
    c.collector_number,
    RARITY[c.rarity] || 'c',
    mask(c.colors || face.colors),
    mask(c.color_identity),
    c.cmc ?? 0,
    s(typeLine),
    price(c.prices?.eur),
    price(c.prices?.eur_foil ?? c.prices?.eur_etched),
    legal,
    finish,
    flags,
    s(c.artist),
    c.edhrec_rank || 0,
    s(c.mana_cost ?? face.mana_cost),
    (c.keywords || []).map(s),
    restricted,
    maxCopies,
    // "Partner with Pir, Imaginative Rascal": the one card it may lead with.
    s(/Partner with ([^\n(]+?)\s*(?:\(|\n|$)/.exec(text)?.[1]?.trim()),
    printLangs.get(c.set + '/' + c.collector_number) || 0,
  ]);
}
// Sets newest first in the file is not needed: the app sorts. Cards in set and number order help compression.
const out = { v: 1, generated: bulk.updated_at, source: 'Scryfall (scryfall.com)', formats: FORMATS, strings, sets, cards };
await mkdir(new URL('.', OUT), { recursive: true });
await writeFile(OUT, JSON.stringify(out));
console.log(`[magic] ${cards.length} prints in ${sets.length} sets, ${strings.length} teksten → public/catalogs/magic.json`);
