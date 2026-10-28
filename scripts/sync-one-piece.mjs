// Builds public/catalogs/one-piece.json from Punk Records (https://github.com/buhbbl/punk-records), the card data of the
// official One Piece Card Game sites, in English and Japanese. Run with `npm run sync-one-piece`; a language is fetched
// again only when Punk Records has a newer build of it.
//
// A card is its card id (OP01-120); a parallel (alternate art, OP01-120_p1) and a reprint in another product
// (OP01-120_r1) are cards of their own, as on the official sites. English and Japanese prints of an id are one card with
// two languages; cards not (yet) out in English are Japanese only. A card is filed under the set of its id, except a
// reprint or a parallel first printed in another product (a premium booster, a promotion), which is filed there. Images
// stay at the official sites.
//
// Prices come from Cardmarket (idGame 18). Its product list names each card "Name (OP01-120)", once per print, in one
// expansion per set and language, without saying which print is which: in the expansion of the set a card is filed
// under, the prints of an id are paired in product order (regular print first, then reprints and parallels). The
// singles don't name their expansion; the sealed products do ("Romance Dawn Booster Box"), and say which are the
// Japanese (Asian) editions: "(Non-English)" or "(Asia Region Legal)".
//
// Output:
//   { v, generated, source, imageBase: { EN, JA }, langs, sets: [{ code, name, type, released, total }], cards: [card] }
//   card: { k (key: card id), s (set), n (number as printed: "120", "120 P1", "120 R1"), base (card id without suffix),
//           par (parallel number, 0 for the regular print), rep (reprint number, 0 for the first print), cat (Leader, Character, Event, Stage), col (colours),
//           r (rarity), c (cost, or life for a leader), pw (power), ct (counter), attr (attributes), ty (types),
//           blk (block), cm: { EN, JA } (Cardmarket product ids), p (price of the day [trend, low, avg1, avg7, avg30]),
//           i18n: { EN: [name, effect, trigger, image path], JA: […] } }
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const REPO = 'https://raw.githubusercontent.com/buhbbl/punk-records/main';
const TREE = 'https://api.github.com/repos/buhbbl/punk-records/git/trees/main?recursive=1';
const LANGS = { EN: 'english', JA: 'japanese' };
const IMAGE_BASE = { EN: 'https://en.onepiece-cardgame.com/images/cardlist/card/', JA: 'https://www.onepiece-cardgame.com/images/cardlist/card/' };
const CM = 'https://downloads.s3.cardmarket.com/productCatalog';
const OUT = new URL('../public/catalogs/one-piece.json', import.meta.url);
const CACHE = new URL('./cache/one-piece/', import.meta.url);

const getJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.json();
};

/** Every card of a language, from the cache unless Punk Records has a newer build. */
async function cardsOf(lang, dir, files) {
  const manifest = await getJson(`${REPO}/${dir}/manifest.json`);
  const file = new URL(`${dir}.json`, CACHE);
  try {
    const cached = JSON.parse(await readFile(file, 'utf8'));
    if (cached.generated === manifest.generated_at) return cached;
  } catch {}
  console.log(`[one-piece] ${lang}: nieuwe versie ophalen`);
  const packs = await getJson(`${REPO}/${dir}/packs.json`).catch(() => ({}));
  const cards = [];
  for (const f of files.filter((p) => p.startsWith(`${dir}/data/`) && p.endsWith('.json'))) cards.push(...(await getJson(`${REPO}/${f}`)));
  const data = { generated: manifest.generated_at, packs, cards };
  await mkdir(CACHE, { recursive: true });
  await writeFile(file, JSON.stringify(data));
  return data;
}

const files = (await getJson(TREE)).tree.map((x) => x.path);
const src = {};
for (const [lang, dir] of Object.entries(LANGS)) src[lang] = await cardsOf(lang, dir, files);

/** "OP-01" → ["OP01"], "OP14-EB04" → ["OP14", "EB04"] (a pack of two sets). */
const setCodes = (label) => (/^[A-Z]+\d+-[A-Z]+\d+$/.test(label || '') ? label.split('-') : [(label || '').replace('-', '')]);
const baseOf = (id) => id.replace(/_[pr]\d+$/i, '');
const parOf = (id) => +(/_p(\d+)$/i.exec(id)?.[1] ?? 0);
const repOf = (id) => +(/_r(\d+)$/i.exec(id)?.[1] ?? 0);
/** Set names in title case, as on the boxes: "PILLARS OF STRENGTH" → "Pillars of Strength". */
const SMALL = new Set(['of', 'in', 'on', 'and']);
const titleCase = (s) =>
  s
    .replace(/[A-Za-z’'.]+/g, (w, i) => (/[a-z]/.test(w) && /[A-Z]/.test(w) ? w : SMALL.has(w.toLowerCase()) && i > 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()))
    .replace(/\b(\d+)(TH|ST|ND|RD)\b/gi, (_, n, x) => n + x.toLowerCase())
    .replace(/\b(of|in|on) The\b/g, '$1 the');
const prefixOf = (id) => baseOf(id).split('-')[0];
const decode = (s) => (s || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'");

// Sets, by the label of the English packs ("[OP-01]"); promotion cards and other products are sets of their own.
const packSet = {};
const setInfo = new Map();
for (const p of Object.values(src.EN.packs)) {
  const label = p.title_parts?.label;
  const codes = label ? setCodes(label) : [/promotion/i.test(p.raw_title) ? 'P' : 'OTHER'];
  packSet[p.id] = codes;
  for (const code of codes) {
    const known = setInfo.get(code);
    if (known && known.name !== code) continue;
    const type = /^ST/.test(code) ? 'starter' : /^EB/.test(code) ? 'extra' : /^PRB/.test(code) ? 'premium' : /^OP/.test(code) ? 'booster' : 'promo';
    const title = p.title_parts?.title;
    const name = code === 'P' ? 'Promo' : code === 'OTHER' ? 'Overige producten' : title && !/^booster pack$/i.test(title) ? titleCase(decode(title)) : code;
    setInfo.set(code, { code, name, type });
  }
}


const byId = new Map();
for (const lang of Object.keys(LANGS)) {
  for (const x of src[lang].cards) {
    if (x.category === 'Don' || !x.id) continue;
    // A card is listed once per product it is in: the first listing in its own set wins.
    const packCodes = lang === 'EN' ? packSet[x.pack_id] || [] : [];
    let c = byId.get(x.id);
    if (!c) {
      c = { k: x.id, s: null, base: baseOf(x.id), par: parOf(x.id), rep: repOf(x.id), cat: x.category, col: x.colors || [], r: x.rarity, c: x.cost ?? null, pw: x.power ?? null, ct: x.counter ?? null, attr: x.attributes || [], ty: [], blk: x.block_number ?? null, i18n: {}, packs: new Set() };
      byId.set(x.id, c);
    }
    for (const code of packCodes) c.packs.add(code);
    if (lang === 'EN' || !c.ty.length) c.ty = x.types || [];
    if (!c.i18n[lang]) {
      const img = (x.img_full_url || '').replace(/\?.*$/, '');
      c.i18n[lang] = [decode(x.name), decode(x.effect || ''), decode(x.trigger || ''), img.startsWith(IMAGE_BASE[lang]) ? img.slice(IMAGE_BASE[lang].length) : img];
    }
  }
}
for (const c of byId.values()) {
  // The regular print is in its own set; a reprint or parallel in the product it came in, when that isn't its own set.
  const own = prefixOf(c.k);
  const other = [...c.packs].find((p) => p !== own && p !== 'OTHER');
  c.s = (c.par || c.rep) && !c.packs.has(own) && other ? other : own;
  if (!setInfo.has(c.s)) setInfo.set(c.s, { code: c.s, name: c.s, type: /^ST/.test(c.s) ? 'starter' : /^EB/.test(c.s) ? 'extra' : /^PRB/.test(c.s) ? 'premium' : /^OP/.test(c.s) ? 'booster' : 'promo' });
  const num = c.base.split('-')[1] || c.base;
  c.n = c.par ? `${num} P${c.par}` : c.rep ? `${num} R${c.rep}` : num;
  delete c.packs;
}
const cards = [...byId.values()];

// ---- Cardmarket ----
const products = (await getJson(`${CM}/productList/products_singles_18.json`)).products;
const sealed = (await getJson(`${CM}/productList/products_nonsingles_18.json`)).products;
const asian = new Set(sealed.filter((p) => /\((Non-English|Asia Region Legal)\)/i.test(p.name)).map((p) => p.idExpansion));
const english = new Set(sealed.filter((p) => !/\((Non-English|Asia Region Legal)\)/i.test(p.name)).map((p) => p.idExpansion));
const langOfExp = (e) => (asian.has(e) && !english.has(e) ? 'JA' : english.has(e) && !asian.has(e) ? 'EN' : null);
const codeRe = /\(([A-Z]+\d*-\d+)\)/;
const byCode = new Map();
const expStart = {};
for (const p of products) {
  const code = codeRe.exec(p.name)?.[1];
  if (!code) continue;
  (byCode.get(code) || byCode.set(code, []).get(code)).push(p);
  if (!expStart[p.idExpansion] || p.dateAdded < expStart[p.idExpansion]) expStart[p.idExpansion] = p.dateAdded;
}
// The expansion of a set per language: the one whose sealed products carry the set's name, else the one holding most
// cards with the set's code.
const sealedBy = {};
for (const p of sealed) (sealedBy[p.idExpansion] ??= []).push(p.name.toLowerCase());
const home = { EN: {}, JA: {} };
for (const lang of ['EN', 'JA']) {
  const votes = {};
  for (const [code, ps] of byCode) {
    const set = code.split('-')[0];
    for (const p of ps) if (langOfExp(p.idExpansion) === lang) ((votes[set] ??= {})[p.idExpansion] = (votes[set][p.idExpansion] || 0) + 1);
  }
  for (const s of setInfo.values()) {
    const name = s.name.toLowerCase().replace(/’/g, "'");
    const named = s.name !== s.code && s.code !== 'P' ? Object.keys(sealedBy).filter((e) => langOfExp(+e) === lang && sealedBy[e].some((n) => n.replace(/’/g, "'").startsWith(name + ' booster') || n.replace(/’/g, "'").startsWith(name + ' starter') || n.replace(/’/g, "'") === name)) : [];
    const v = votes[s.code] || {};
    const best = named.sort((a, b) => (v[b] || 0) - (v[a] || 0))[0] ?? Object.keys(v).sort((a, b) => v[b] - v[a])[0];
    if (best) home[lang][s.code] = +best;
  }
}
const guide = new Map((await getJson(`${CM}/priceGuide/price_guide_18.json`)).priceGuides.map((g) => [g.idProduct, g]));
// The prints of an id filed in one set, paired with its products in that set's expansion in product order.
let linked = 0;
const groups = new Map();
for (const c of cards) groups.set(c.s + '|' + c.base, [...(groups.get(c.s + '|' + c.base) || []), c]);
for (const cs of groups.values()) {
  // The regular print, then the reprints, then the parallels.
  const rank = (c) => (c.par ? 1000 + c.par : c.rep);
  cs.sort((a, b) => rank(a) - rank(b));
  const { s: set, base } = cs[0];
  for (const lang of ['EN', 'JA']) {
    const exp = home[lang][set];
    const ps = (byCode.get(base) || []).filter((p) => p.idExpansion === exp).sort((a, b) => a.idProduct - b.idProduct);
    const mine = cs.filter((c) => c.i18n[lang]);
    // More products than prints (Cardmarket also sells a print the official list doesn't have): the regular print is
    // the cheapest of them.
    if (ps.length > mine.length && mine[0] && !mine[0].par && !mine[0].rep) {
      const trend = (p) => guide.get(p.idProduct)?.trend ?? Infinity;
      const cheapest = ps.reduce((a, b) => (trend(b) < trend(a) ? b : a));
      ps.splice(ps.indexOf(cheapest), 1);
      ps.unshift(cheapest);
    }
    mine.forEach((c, i) => {
      if (!ps[i]) return;
      (c.cm ??= {})[lang] = ps[i].idProduct;
      linked++;
    });
  }
}
console.log(`[one-piece] ${linked} prints aan Cardmarket gekoppeld; ${cards.filter((c) => !c.cm).length} kaarten zonder prijs`);

// Release dates: when Cardmarket added the set's English expansion (else the Japanese one).
for (const s of setInfo.values()) {
  const e = home.EN[s.code] ?? home.JA[s.code];
  s.released = e && expStart[e] ? expStart[e].slice(0, 10) : null;
}

// Prices of today, so the app shows prices before it has fetched fresh ones: English print, else Japanese.
const r2 = (n) => (n == null ? null : Math.round(n * 100) / 100);
for (const c of cards) {
  const g = guide.get(c.cm?.EN) || guide.get(c.cm?.JA);
  if (g) c.p = ['trend', 'low', 'avg1', 'avg7', 'avg30'].map((f) => r2(g[f]));
}

// Sets in release order, then by code; only sets with cards.
const used = new Set(cards.map((c) => c.s));
const order = (s) => s.released || '9999';
const sets = [...setInfo.values()]
  .filter((s) => used.has(s.code))
  .sort((a, b) => order(a).localeCompare(order(b)) || a.code.localeCompare(b.code, 'en', { numeric: true }))
  .map((s) => ({ ...s, total: new Set(cards.filter((c) => c.s === s.code && !c.par && !c.rep && c.base.startsWith(s.code + '-')).map((c) => c.base)).size || null }));
const setOrder = new Map(sets.map((s, i) => [s.code, i]));
cards.sort((a, b) => setOrder.get(a.s) - setOrder.get(b.s) || a.base.localeCompare(b.base, 'en', { numeric: true }) || (a.par ? 1000 + a.par : a.rep) - (b.par ? 1000 + b.par : b.rep));

const out = {
  v: 1,
  generated: new Date(Math.max(src.EN.generated, src.JA.generated) * 1000).toISOString().slice(0, 10),
  source: 'Punk Records (github.com/buhbbl/punk-records), Cardmarket',
  imageBase: IMAGE_BASE,
  langs: Object.keys(LANGS),
  sets,
  cards,
};
await mkdir(new URL('.', OUT), { recursive: true });
await writeFile(OUT, JSON.stringify(out));
const perLang = Object.keys(LANGS).map((l) => `${l} ${cards.filter((c) => c.i18n[l]).length}`).join(', ');
console.log(`[one-piece] ${cards.length} kaarten in ${sets.length} sets (${perLang}) → public/catalogs/one-piece.json`);
console.log('[one-piece] Draai nu ook `npm run sync-hashes-one-piece`: de scanner gebruikt de plaatjesindex alleen bij deze catalogusversie.');
