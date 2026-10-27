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
//           base (LorcanaJSON id of the regular print, for Enchanted/Epic/Iconic),
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
