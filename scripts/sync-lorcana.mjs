// Builds public/catalogs/lorcana.json from LorcanaJSON (https://lorcanajson.org): every Lorcana card in English, French,
// German and Italian. Run with `npm run sync-lorcana`; the source is fetched again only when it has a newer build.
//
// LorcanaJSON can't be fetched from a browser (no CORS), hence this script. Card ids are the same in every language;
// Enchanted, Epic, Iconic and promo prints are cards of their own. Images stay at Ravensburger's servers.
//
// Output (kept small: ~3,500 cards in four languages):
//   { v, generated, source, imageBase, langs, sets: [{ code, name, type, released, total }], cards: [card] }
//   card: { k (set-number key), s (set code), n (number as printed, e.g. "4a"), id (LorcanaJSON id), ink: [colours],
//           t (type), sub (subtypes), c (cost), iw (inkwell 0/1), l (lore), st (strength), w (willpower), mv (move cost),
//           r (rarity), story, art (artists), foil (foil types), cm (Cardmarket product id),
//           base (LorcanaJSON id of the regular print, for Enchanted/Epic/Iconic), p (prices on the day of the build),
//           i18n: { EN: [name, version, text, thumbnail path, full image path], FR: […], … } }
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const SRC = 'https://lorcanajson.org/files/current';
const LANGS = ['en', 'fr', 'de', 'it'];
const OUT = new URL('../public/catalogs/lorcana.json', import.meta.url);
const CACHE = new URL('./cache/lorcana/', import.meta.url);
const IMAGE_BASE = 'https://api.lorcana.ravensburger.com/images/';

const getJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.json();
};

/** allCards.json of a language, from the cache unless LorcanaJSON has a newer build. */
async function allCards(lang) {
  const meta = await getJson(`${SRC}/${lang}/metadata.json`);
  const file = new URL(`${lang}.json`, CACHE);
  try {
    const cached = JSON.parse(await readFile(file, 'utf8'));
    if (cached.metadata?.generatedOn === meta.generatedOn) return cached;
  } catch {}
  console.log(`[lorcana] ${lang}: nieuwe versie van ${meta.generatedOn} ophalen`);
  const data = await getJson(`${SRC}/${lang}/allCards.json`);
  await mkdir(CACHE, { recursive: true });
  await writeFile(file, JSON.stringify(data));
  return data;
}

const byLang = {};
for (const lang of LANGS) byLang[lang] = await allCards(lang);
const en = byLang.en;

/** Set a card is filed under: its promo series ("P1") for promos, else its set ("1", "Q1"). */
const setOf = (c) => c.promoGrouping || c.setCode;
const numberOf = (c) => String(c.number) + (c.variant || '');
const imgPath = (url) => (url && url.startsWith(IMAGE_BASE) ? url.slice(IMAGE_BASE.length) : url || '');
/** A song is an action card with the subtype Song; it gets its own type here, as players see it. */
const typeOf = (c) => (c.type === 'Action' && (c.subtypes || []).includes('Song') ? 'Song' : c.type);

const sets = [];
for (const [code, s] of Object.entries(en.sets)) {
  if (!en.cards.some((c) => c.setCode === code && !c.promoGrouping)) continue;
  sets.push({ code, name: s.name, type: s.type, released: s.releaseDate || null, total: s.cardCounts?.base || null });
}
// Promo series, each after the set they belong to.
const promoSets = new Map();
for (const c of en.cards) {
  if (!c.promoGrouping || promoSets.has(c.promoGrouping)) continue;
  const parent = en.sets[c.setCode];
  promoSets.set(c.promoGrouping, { code: c.promoGrouping, name: 'Promo ' + c.promoGrouping, type: 'promo', released: parent?.releaseDate || null, total: null, after: c.setCode });
}
for (const p of [...promoSets.values()].sort((a, b) => a.code.localeCompare(b.code, 'en', { numeric: true }))) {
  const at = sets.findLastIndex((s) => s.code === p.after || s.after === p.after);
  const { after, ...set } = p;
  sets.splice(at + 1, 0, { ...set, after });
}

const others = Object.fromEntries(LANGS.slice(1).map((l) => [l, new Map(byLang[l].cards.map((c) => [c.id, c]))]));
const seen = new Set();
const cards = [];
for (const c of en.cards) {
  // Rarely two cards share a printed number (Moana and its European twin Vaiana, both 26/P2): the second gets its id.
  let k = setOf(c) + '-' + numberOf(c);
  if (seen.has(k)) k += '~' + c.id;
  seen.add(k);
  const i18n = {};
  for (const lang of LANGS) {
    const x = lang === 'en' ? c : others[lang].get(c.id);
    if (!x) continue;
    i18n[lang.toUpperCase()] = [x.name, x.version || '', x.fullText || '', imgPath(x.images?.thumbnail), imgPath(x.images?.full)];
  }
  cards.push({
    k,
    s: setOf(c),
    n: numberOf(c),
    id: c.id,
    ink: c.colors || (c.color ? [c.color] : []),
    t: typeOf(c),
    sub: c.subtypes || [],
    c: c.cost ?? null,
    iw: c.inkwell ? 1 : 0,
    l: c.lore ?? null,
    st: c.strength ?? null,
    w: c.willpower ?? null,
    mv: c.moveCost ?? null,
    r: c.rarity || null,
    story: c.story || null,
    art: c.artists || [],
    foil: c.foilTypes || [],
    cm: c.externalLinks?.cardmarketId ?? null,
    base: c.baseId ?? null,
    i18n,
  });
}

// LorcanaJSON lacks the Cardmarket id of the newest set and some promos. Cardmarket's own product list names every card
// "Name - Version" per expansion: cards without an id get the product of that name in their set's expansion (learned
// from the cards that do have one; a set without any takes the unclaimed expansion that matches most names). Two
// products of one name in an expansion (a regular and an Enchanted print) are paired in number order.
const products = (await getJson('https://downloads.s3.cardmarket.com/productCatalog/productList/products_singles_19.json')).products;
const productById = new Map(products.map((p) => [p.idProduct, p]));
const key = (name) => name.toLowerCase().replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();
const fullName = (c) => key(c.i18n.EN[0] + (c.i18n.EN[1] ? ' - ' + c.i18n.EN[1] : ''));
const expansionVotes = {};
for (const c of cards) {
  const p = c.cm && productById.get(c.cm);
  if (p) ((expansionVotes[c.s] ??= {})[p.idExpansion] = (expansionVotes[c.s][p.idExpansion] || 0) + 1);
}
const expansionOf = Object.fromEntries(Object.entries(expansionVotes).map(([set, v]) => [set, +Object.keys(v).sort((a, b) => v[b] - v[a])[0]]));
const claimed = new Set(cards.map((c) => c.cm).filter(Boolean));
const takenExpansions = new Set(Object.values(expansionOf));
const missing = cards.filter((c) => !c.cm);
for (const set of new Set(missing.map((c) => c.s))) {
  if (expansionOf[set]) continue;
  const names = new Set(missing.filter((c) => c.s === set).map(fullName));
  const votes = {};
  for (const p of products) if (!claimed.has(p.idProduct) && !takenExpansions.has(p.idExpansion) && names.has(key(p.name))) votes[p.idExpansion] = (votes[p.idExpansion] || 0) + 1;
  const best = Object.keys(votes).sort((a, b) => votes[b] - votes[a])[0];
  if (best && votes[best] >= Math.min(3, names.size)) {
    expansionOf[set] = +best;
    takenExpansions.add(+best);
  }
}
const groups = new Map();
for (const c of missing) {
  if (!expansionOf[c.s]) continue;
  const g = expansionOf[c.s] + '|' + fullName(c);
  groups.set(g, [...(groups.get(g) || []), c]);
}
let linked = 0;
for (const [g, cs] of groups) {
  const [exp, name] = [+g.split('|')[0], g.slice(g.indexOf('|') + 1)];
  const ps = products.filter((p) => p.idExpansion === exp && !claimed.has(p.idProduct) && key(p.name) === name).sort((a, b) => a.idProduct - b.idProduct);
  cs.sort((a, b) => parseInt(a.n, 10) - parseInt(b.n, 10));
  cs.forEach((c, i) => {
    if (!ps[i]) return;
    c.cm = ps[i].idProduct;
    claimed.add(c.cm);
    linked++;
  });
}
console.log(`[lorcana] ${linked} kaarten via de productlijst van Cardmarket gekoppeld; ${cards.filter((c) => !c.cm).length} nog zonder prijs`);

// Prices of today, so the app shows prices before it has fetched fresh ones (and offline): p = [trend, low, avg1, avg7,
// avg30] of the regular print, then the same for foil. The app refreshes them from Cardmarket every day.
const guide = new Map((await getJson('https://downloads.s3.cardmarket.com/productCatalog/priceGuide/price_guide_19.json')).priceGuides.map((g) => [g.idProduct, g]));
const r2 = (n) => (n == null ? null : Math.round(n * 100) / 100);
for (const c of cards) {
  const g = c.cm && guide.get(c.cm);
  if (g) c.p = ['trend', 'low', 'avg1', 'avg7', 'avg30'].flatMap((f) => [r2(g[f])]).concat(['trend', 'low', 'avg1', 'avg7', 'avg30'].map((f) => r2(g[f + '-foil'])));
}

const out = {
  v: 1,
  generated: en.metadata.generatedOn,
  source: 'LorcanaJSON (lorcanajson.org)',
  imageBase: IMAGE_BASE,
  langs: LANGS.map((l) => l.toUpperCase()),
  sets: sets.map(({ after, ...s }) => s),
  cards,
};
await mkdir(new URL('.', OUT), { recursive: true });
await writeFile(OUT, JSON.stringify(out));
const perLang = LANGS.map((l) => `${l.toUpperCase()} ${cards.filter((c) => c.i18n[l.toUpperCase()]).length}`).join(', ');
console.log(`[lorcana] ${cards.length} kaarten in ${out.sets.length} sets (${perLang}) → public/catalogs/lorcana.json`);
