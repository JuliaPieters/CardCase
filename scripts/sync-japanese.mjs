// Completes the Japanese part of public/catalog.json from the official card database (scripts/jp-official.mjs).
// TCGdex lacks whole eras of Japanese cards (DP up to XY, much of Sword & Shield) and often their rarity,
// illustrator or image:
//  - sets TCGdex has: matched card by card (in order, by name); missing images, rarities, illustrators, types and
//    Pokédex numbers are filled in.
//  - sets it doesn't have are added. Their English names and release dates come from Limitless TCG, or from the
//    table below for sets it doesn't list; a set without a known date gets the year of the set released nearest to it.
//
// Usage: npm run sync-japanese [-- --cached]   (also runs at the end of npm run sync-catalog; --cached fetches no card
// pages and only adds the sets whose details are all in the cache)

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { officialDetails, officialList } from './jp-official.mjs';
import { buildHashes } from './sync-hashes.mjs';

const OUT = new URL('../public/catalog.json', import.meta.url);
const LIMITLESS = 'https://limitlesstcg.com/cards/jp';

/** Sets Limitless doesn't list (it starts at Black & White). */
const KNOWN = {
  DP1: ['Space-Time Creation', 2006],
  DP2: ['Secret of the Lakes', 2007],
  DP3: ['Shining Darkness', 2007],
  DP4: ['Dawn Dash / Moonlit Pursuit', 2007],
  DP5: ['Temple of Anger / Cry from the Mysterious', 2008],
  DPP: ['DP Promotional Cards', 2006],
  'DPt1-B': ["Galactic's Conquest", 2008],
  'DPt2-B': ['Bonds to the End of Time', 2009],
  'DPt3-B': ['Beat of the Frontier', 2009],
  'DPt4-B': ['Advent of Arceus', 2009],
  DPtP: ['DPt Promotional Cards', 2008],
  'L1-Bhg': ['HeartGold Collection', 2009],
  'L1-Bss': ['SoulSilver Collection', 2009],
  'L2-B': ['Reviving Legends', 2010],
  'L3-B': ['Clash at the Summit', 2010],
  LL: ['Lost Link', 2010],
  LP: ['LEGEND Promotional Cards', 2009],
};

/** Rarity icon on the official card page → rarity as TCGdex names it (src/app/core/data.ts RARITIES). */
const RARITY = {
  c: 'Common',
  c_c: 'Common',
  u: 'Uncommon',
  u_c: 'Uncommon',
  r: 'Rare',
  r_c: 'Rare',
  rr: 'Double rare',
  rrr: 'Triple Rare',
  pr: 'Promo',
  tr: 'Triple Rare',
  sr: 'Ultra Rare',
  sr_c: 'Ultra Rare',
  hr: 'Hyper rare',
  ur: 'Hyper rare',
  ur_c: 'Hyper rare',
  ar: 'Illustration rare',
  sar: 'Special illustration rare',
  mur: 'Mega Hyper Rare',
  mar: 'Mega Attack Rare',
  ma: 'Mega Attack Rare',
  s: 'Shiny rare', // up to Black & White a holo rare, see rarityOf()
  s_2: 'Shiny rare',
  ss: 'Holo Rare',
  c2: 'Common',
  u2: 'Uncommon',
  ssr: 'Shiny Ultra Rare',
  chr: 'Character Rare',
  csr: 'Character Super Rare',
  k: 'Radiant Rare',
  a: 'Amazing Rare',
  ace: 'ACE SPEC Rare',
  bwr: 'Black White Rare',
};

/** Rarity of a card from its icon. Before XY, "s" marked a holo rare, and "ss" a ☆ or LEGEND card. */
function rarityOf(d, year, name) {
  if (d.rarity === 's' && year && year < 2013) return 'Holo Rare';
  if (d.rarity === 'ss' && /LEGEND/.test(name)) return 'LEGEND';
  return RARITY[d.rarity] ?? null;
}

/** Type icon on the official card page → TCGdex type. */
const TYPE = {
  grass: 'Grass',
  fire: 'Fire',
  water: 'Water',
  electric: 'Lightning',
  psychic: 'Psychic',
  fighting: 'Fighting',
  dark: 'Darkness',
  steel: 'Metal',
  fairy: 'Fairy',
  dragon: 'Dragon',
  none: 'Colorless',
};

/** Name for comparing: full-width folded, no spaces or punctuation, lowercase. */
const key = (s) =>
  (s || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s・·.'’\-]/g, '');

/** Walks two name lists in order and pairs equal names, skipping a few unmatched items on either side. */
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

/** Limitless TCG's Japanese sets: Map<lowercase code, { code, name, released }>. */
async function limitlessSets() {
  const res = await fetch(LIMITLESS, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Cardcase catalog sync)' },
  });
  if (!res.ok) throw new Error(`${res.status} ${LIMITLESS}`);
  const html = await res.text();
  const months = {
    Jan: 1,
    Feb: 2,
    Mar: 3,
    Apr: 4,
    May: 5,
    Jun: 6,
    Jul: 7,
    Aug: 8,
    Sep: 9,
    Oct: 10,
    Nov: 11,
    Dec: 12,
  };
  const sets = new Map();
  for (const row of html.split('<tr').slice(1)) {
    const code = /href="\/cards\/jp\/([^"]+)"/.exec(row)?.[1];
    const name = /alt="[^"]*"[^>]*>\s*([^<]+)<span/.exec(row)?.[1];
    if (!code || !name) continue;
    const d = />(\d{1,2}) (\w{3}) (\d{2})</.exec(row);
    const released = d ? `20${d[3]}-${String(months[d[2]]).padStart(2, '0')}-${d[1].padStart(2, '0')}` : null;
    const clean = name
      .trim()
      .replace(/&#0?39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&');
    sets.set(code.toLowerCase(), { code, name: clean, released });
  }
  return sets;
}

/**
 * Limitless set for an official image folder. The folder codes differ a bit: "BW1-Bb" = BW1b, "BW5-Brz" = BW5z,
 * "MMB-P" = MMBp, and starter-set halves ("HSZt", "HSZp") are one set there.
 */
function limitlessFor(folder, lim) {
  const f = folder.toLowerCase();
  const tries = [f, f.replace(/-br?(?=[a-z])/, ''), f.replace(/-b$/, ''), f.replace('-', ''), f.replace(/[a-z]$/, '')];
  for (const t of tries) if (lim.has(t)) return lim.get(t);
  // One folder for several decks of one product ("SA" = Starter Set V Fire, Grass, …): name it after the product.
  const parts = [...lim.values()].filter((s) => s.code.length === folder.length + 1 && s.code.startsWith(folder));
  if (!parts.length) return null;
  let name = parts[0].name;
  for (const p of parts) while (!p.name.startsWith(name)) name = name.slice(0, -1);
  name = name.trim().replace(/[\s&/-]+$/, '');
  return {
    code: folder,
    name: name.length >= 8 ? name : parts.map((p) => p.name).join(' / '),
    released: parts[0].released,
  };
}

/** Japanese series a set belongs to, by release year (same names as TCGdex's Japanese series). */
function serieOf(year, released) {
  const d = released ?? `${year}-06-01`;
  if (d < '2010-09-01') return 'ダイヤモンド&パール';
  if (d < '2013-07-01') return 'ブラック&ホワイト';
  if (d < '2016-12-01') return 'XY';
  if (d < '2019-12-01') return 'サン＆ムーン';
  if (d < '2023-01-01') return '剣と盾';
  if (d < '2025-08-01') return 'ポケモンカードゲーム スカーレット&バイオレット';
  return 'ポケモンカードゲーム MEGA';
}

/** Takes out the sets an earlier run added (they have no TCGdex `api`), so a rerun starts from TCGdex's data. */
function removeAdded(raw) {
  const keep = raw.sets.map((s) => !(s.lang === 'JA' && s.api === null));
  const newIdx = [];
  raw.sets = raw.sets.filter((s, i) => {
    newIdx[i] = keep[i] ? newIdx.filter((x) => x != null).length : null;
    return keep[i];
  });
  raw.cards = raw.cards.filter((row) => keep[row[0]]).map((row) => [newIdx[row[0]], ...row.slice(1)]);
}

/** With `fetchMissing` false, only cached card details are used (no card pages are fetched). */
export async function addJapanese(raw, log = console.log, { fetchMissing = true } = {}) {
  const list = (await officialList()).filter((c) => c.path && !c.path.startsWith('noimage'));
  const details = await officialDetails(
    list.map((c) => c.id),
    log,
    { fetchMissing },
  );
  const lim = await limitlessSets();

  removeAdded(raw);
  const strIdx = new Map(raw.strings.map((s, i) => [s, i]));
  const str = (s) => {
    if (s == null) return -1;
    if (!strIdx.has(s)) strIdx.set(s, raw.strings.push(s) - 1);
    return strIdx.get(s);
  };

  const byFolder = new Map();
  for (const c of list) {
    const folder = c.path.split('/')[1];
    if (!byFolder.has(folder)) byFolder.set(folder, []);
    byFolder.get(folder).push(c);
  }

  // Sets TCGdex has: fill in what's missing, card by card.
  const rowsBySet = new Map();
  raw.cards.forEach((row, i) => {
    if (!rowsBySet.has(row[0])) rowsBySet.set(row[0], []);
    rowsBySet.get(row[0]).push(i);
  });
  const filled = { img: 0, rarity: 0, illus: 0, dex: 0, type: 0 };
  /** Lowest official card id per folder with a known year, to date the sets without one. */
  const dated = [];
  raw.sets.forEach((set, s) => {
    if (set.lang !== 'JA') return;
    const entries = byFolder.get(set.id);
    if (!entries) return;
    byFolder.delete(set.id);
    if (set.year) dated.push([entries[0].id, set.year]);
    const rows = (rowsBySet.get(s) ?? []).sort((a, b) =>
      raw.cards[a][1].localeCompare(raw.cards[b][1], 'en', { numeric: true }),
    );
    // First by number and name (promos aren't listed in number order), then the rest by name order.
    const num = (id) => (id || '').replace(/^0+(?=.)/, '');
    const byNum = new Map();
    entries.forEach((e, j) => byNum.set(num(details.get(e.id)?.localId) + '|' + key(e.name), j));
    const pairs = [];
    const usedJ = new Set();
    const restI = [];
    rows.forEach((r, i) => {
      const j = byNum.get(num(raw.cards[r][1]) + '|' + key(raw.cards[r][2]));
      if (j != null && !usedJ.has(j)) (pairs.push([i, j]), usedJ.add(j));
      else restI.push(i);
    });
    const restJ = entries.map((_, j) => j).filter((j) => !usedJ.has(j));
    for (const [a, b] of align(
      restI.map((i) => key(raw.cards[rows[i]][2])),
      restJ.map((j) => key(entries[j].name)),
    ))
      pairs.push([restI[a], restJ[b]]);
    for (const [i, j] of pairs) {
      const row = raw.cards[rows[i]];
      const e = entries[j];
      const d = details.get(e.id);
      if (!(row[8] & 1 && set.img) && !row[10]) {
        row[10] = 'J:' + e.path;
        filled.img++;
      }
      if (!d) continue;
      const rarity = rarityOf(d, set.year, e.name);
      if (rarity && (row[4] < 0 || raw.strings[row[4]] === 'None')) {
        row[4] = str(rarity);
        filled.rarity++;
      }
      if (d.illus && row[7] < 0) {
        row[7] = str(d.illus);
        filled.illus++;
      }
      if (d.dex && !row[6]) {
        row[6] = d.dex;
        filled.dex++;
      }
      if (TYPE[d.type] && row[5] < 0) {
        row[5] = str(TYPE[d.type]);
        filled.type++;
      }
    }
  });
  log(
    `[ja] aangevuld: ${filled.img} afbeeldingen, ${filled.rarity} zeldzaamheden, ${filled.illus} illustratoren, ${filled.dex} dex-nummers, ${filled.type} types`,
  );

  // Sets TCGdex doesn't have. Folders that are parts of one product on Limitless become one set.
  const groups = new Map();
  for (const [folder, entries] of byFolder) {
    const meta = KNOWN[folder]
      ? { code: folder, name: KNOWN[folder][0], released: null, year: KNOWN[folder][1] }
      : limitlessFor(folder, lim);
    const code = meta?.code ?? folder;
    if (!groups.has(code)) groups.set(code, { code, meta, entries: [] });
    groups.get(code).entries.push(...entries);
  }
  for (const g of groups.values()) {
    g.entries.sort((a, b) => a.id - b.id);
    g.year = g.meta?.year ?? (Number(g.meta?.released?.slice(0, 4)) || null);
    if (g.year) dated.push([g.entries[0].id, g.year]);
  }
  dated.sort((a, b) => a[0] - b[0]);
  const nearestYear = (id) =>
    dated.reduce((best, d) => (Math.abs(d[0] - id) < Math.abs(best[0] - id) ? d : best), dated[0])?.[1] ?? null;

  // Pokédex number by Japanese name, for cards whose page has none (EX, GX, BREAK, "G[ギンガ]" cards and the like).
  const dexByName = new Map();
  for (const row of raw.cards) {
    const n = key(row[2]);
    if (row[6] && row[6] <= 1025 && raw.sets[row[0]].lang === 'JA' && !dexByName.has(n)) dexByName.set(n, row[6]);
  }
  for (const c of list) if (details.get(c.id)?.dex) dexByName.set(key(c.name), details.get(c.id).dex);
  const dexOf = (name) => {
    const n = key(name)
      .replace(/[\[［(（].*$/, '')
      .replace(/^(メガ|ゲンシ|ダーク|ライト|アローラ|ガラル|ヒスイ|パルデア)/, '')
      .replace(/(ex|gx|v|vmax|vstar|vunion|break|legend|lv\.?x|prime|gl|fb|[g四cmfe☆δ]|でんせつ|\d+)+$/, '');
    return dexByName.get(n) ?? 0;
  };

  let addedSets = 0;
  let addedCards = 0;
  const incomplete = [];
  for (const g of groups.values()) {
    // Collector numbers (and with them the cards' uids, which collections refer to) need every card's details.
    if (g.entries.some((e) => !details.has(e.id))) {
      incomplete.push(g.code);
      continue;
    }
    const year = g.year ?? nearestYear(g.entries[0].id);
    // Decks of one product share a folder: the same card in several decks is listed once per deck (kept once), and
    // decks with their own numbering ("…/037" and "…/034") become separate parts.
    const byTotal = new Map();
    const seen = new Set();
    for (const e of g.entries) {
      const d = details.get(e.id);
      const dupe = d.localId && d.localId + '|' + key(e.name);
      if (dupe && seen.has(dupe)) continue;
      if (dupe) seen.add(dupe);
      const t = d.total ?? '';
      if (!byTotal.has(t)) byTotal.set(t, []);
      byTotal.get(t).push(e);
    }
    // Cards without a total (energy, promos) go with the largest part.
    const parts = [...byTotal.entries()].filter(([t]) => t !== '').map(([, es]) => es);
    const loose = byTotal.get('') ?? [];
    if (!parts.length) parts.push(loose);
    else if (loose.length) parts.reduce((a, b) => (b.length > a.length ? b : a)).push(...loose);
    parts.forEach((entries, p) => {
      const suffix = parts.length > 1 ? `-${p + 1}` : '';
      const totals = entries.map((e) => Number(details.get(e.id)?.total)).filter(Boolean);
      const official = totals.length ? Math.max(...totals) : entries.length;
      const setIdx = raw.sets.length;
      raw.sets.push({
        code: 'JA-' + g.code + suffix,
        id: g.code + suffix,
        api: null,
        lang: 'JA',
        name: (g.meta?.name ?? g.code) + (suffix ? ` (${p + 1})` : ''),
        serie: serieOf(year, g.meta?.released),
        year,
        released: g.meta?.released ?? null,
        official,
        img: null,
        imgDE: null,
        hasDE: false,
      });
      addedSets++;
      const used = new Set();
      entries.forEach((e, i) => {
        const d = details.get(e.id) ?? {};
        let localId = d.localId ?? String(i + 1).padStart(3, '0');
        while (used.has(localId)) localId += '+';
        used.add(localId);
        const kind = /\/\d+_([PTE])_/.exec(e.path)?.[1];
        raw.cards.push([
          setIdx,
          localId,
          e.name,
          null,
          str(rarityOf(d, year, e.name)),
          str(TYPE[d.type] ?? null),
          d.dex || (kind === 'P' || !kind ? dexOf(e.name) : 0),
          str(d.illus ?? null),
          0,
          kind === 'T' ? 1 : kind === 'E' ? 2 : 0,
          'J:' + e.path,
        ]);
        addedCards++;
      });
    });
  }
  if (incomplete.length)
    log(`[ja] ${incomplete.length} sets overgeslagen, details nog niet compleet: ${incomplete.join(' ')}`);
  const unknown = [...groups.values()].filter((g) => !g.meta).map((g) => g.code);
  log(
    `[ja] ${addedSets} sets met ${addedCards} kaarten toegevoegd${unknown.length ? ` (zonder naam: ${unknown.join(' ')})` : ''}`,
  );
  const icons = [...new Set([...details.values()].map((d) => d.rarity).filter((r) => r && !(r in RARITY)))];
  if (icons.length) log(`[ja] onbekende zeldzaamheid-iconen: ${icons.join(' ')}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const raw = JSON.parse(await readFile(OUT, 'utf8'));
  await addJapanese(raw, console.log, { fetchMissing: !process.argv.includes('--cached') });
  // The rows changed, so this is a new catalog version with its own scanner index.
  raw.generated = new Date().toISOString();
  await writeFile(OUT, JSON.stringify(raw));
  console.log('\nScanner-index bijwerken…');
  await buildHashes();
  console.log('Klaar → public/catalog.json');
}
