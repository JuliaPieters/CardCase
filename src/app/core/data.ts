// @ts-nocheck -- verbatim port of the untyped design-prototype logic; add types incrementally.
// Mock data and pure helpers, ported from the Cardcase design prototype.

export const RAW = `Flarekit|Funkfuchs|ヒノコン|火狐仔|fire
Cindrake|Glutdrache|モエドラ|燃龙|fire
Blazehorn|Flammhorn|ホノツノ|焰角兽|fire
Ashmole|Aschmaul|ハイモグ|灰鼹|fire
Pebblup|Kieselkind|コイシン|小石怪|fighting
Brawlor|Raufbold|ナグリン|拳斗士|fighting
Kilnback|Ofenrücken|カマセナ|窑背龟|fire
Sootling|Rußling|ススコ|煤灵|dark
Emberowl|Glutkauz|ヒバズク|火枭|fire
Puffcrest|Puffkamm|フワトサカ|绒冠鸟|colorless
Magmaw|Magmaul|マグマウ|熔岩口|fire
Ironfang|Eisenzahn|テツキバ|铁牙|metal
Pyrewyrm|Feuerwurm|ホムラリュウ|焰蛇龙|dragon
Solaris Rex|Solaris Rex|ソラリスレックス|日冕霸王|fire
Puddlop|Pfützling|ミズポン|水洼蛙|water
Tidepup|Gezeitling|シオワン|潮汐犬|water
Coralisk|Korallisk|サンゴリス|珊瑚蜥|water
Bubblefin|Blasenflosse|アワヒレ|泡鳍鱼|water
Mistray|Nebelrochen|キリエイ|雾鳐|psychic
Shellby|Schalbert|カラッチ|壳宝|water
Driftling|Treibling|ナガレコ|漂流灵|psychic
Frostkelp|Frosttang|コオリモ|冰藻|water
Anchorite|Ankerling|イカリン|锚甲兽|metal
Glimmeel|Glimmaal|ヒカリウナ|闪鳗|electric
Abyssaur|Abyssaurus|シンカイリュウ|深渊龙|dragon
Leviaqua|Leviaqua|レビアクア|海皇鲸|water
Mossaur|Moosaurus|コケザウル|苔藓龙|grass
Sproutle|Sprössling|メブキン|芽芽|grass
Thornpaw|Dornpfote|トゲアシ|棘爪|grass
Fernix|Farnix|シダクス|蕨狐|grass
Gloomoth|Düstermotte|ヤミガ|暗蛾|dark
Barkbear|Borkenbär|キクマ|树皮熊|grass
Spindlet|Spindling|イトムシ|纺丝虫|grass
Hushowl|Stillkauz|シズフクロ|静枭|psychic
Rootrex|Wurzelrex|ネッコレックス|根霸龙|dragon
Bloomira|Blühmira|ハナミラ|花冠姬|grass
Voltwhisk|Voltbart|ビリヒゲ|电须鼠|electric
Zapling|Zischling|ピリコ|小电灵|electric
Sparkhorn|Funkenhorn|スパーツノ|电光角|electric
Coilcat|Spulkatze|コイルネコ|线圈猫|electric
Boltbeak|Blitzschnabel|イナズマバシ|雷喙鸟|electric
Magnetoad|Magnetkröte|ジシャクガエル|磁蛙|metal
Staticune|Statikun|セイデン|静电兽|colorless
Thunderion|Donnerion|ライオネル|雷狮王|electric`;
/** Sets and cards are filled at startup by setCatalog() (real TCGdex data or mockCatalog()). */
export const SETS: any[] = [];
export const LANGS = ['EN', 'DE', 'JA', 'ZH'];
export const LNAME = { EN: 'Engels', DE: 'Duits', JA: 'Japans', ZH: 'Chinees' };
export const TYPES = { fire: ['Vuur', 'oklch(0.80 0.11 40)'], water: ['Water', 'oklch(0.80 0.09 235)'], grass: ['Plant', 'oklch(0.83 0.10 140)'], electric: ['Elektrisch', 'oklch(0.88 0.11 95)'], psychic: ['Psychisch', 'oklch(0.80 0.09 340)'], fighting: ['Vechten', 'oklch(0.76 0.09 60)'], dark: ['Duister', 'oklch(0.64 0.05 290)'], metal: ['Metaal', 'oklch(0.82 0.03 250)'], dragon: ['Draak', 'oklch(0.75 0.09 285)'], colorless: ['Kleurloos', 'oklch(0.90 0.02 90)'] };
export const RAR = { C: ['Gewoon', '●'], U: ['Ongewoon', '◆'], R: ['Zeldzaam', '★'], HR: ['Holo-zeldzaam', '✦'], X: ['Onbekend', '?'] };
export const CONDS = [['M', 'Mint'], ['NM', 'Near Mint'], ['EX', 'Excellent'], ['GD', 'Good'], ['PL', 'Played']];
export const COLS = { 4: 2, 9: 3, 12: 3, 16: 4 };
export const isCard = x => typeof x === 'number';
export const isRes = x => typeof x === 'string';
export const COVERS = ['#E3350D', '#306230', '#E8B92E', '#3E6FB0', '#7A5BC7', '#2B2E36'];
/**
 * Real rarities as TCGdex names them → [international abbreviation, Japanese/Chinese abbreviation, basic tier].
 * The same rarity has a different name in Asian sets (e.g. Illustration rare = IR internationally, AR in Japan).
 */
export const RARITIES: Record<string, [string, string, string]> = {
  'Common': ['C', 'C', 'C'],
  'Uncommon': ['U', 'U', 'U'],
  'Rare': ['R', 'R', 'R'],
  'Holo Rare': ['Holo', 'R', 'R'],
  'Rare Holo': ['Holo', 'R', 'R'],
  'Promo': ['PR', 'PR', 'R'],
  'None': ['—', '—', 'C'],
  'Double rare': ['RR', 'RR', 'HR'],
  'Triple Rare': ['RRR', 'RRR', 'HR'],
  'Illustration rare': ['IR', 'AR', 'HR'],
  'Special illustration rare': ['SIR', 'SAR', 'HR'],
  'Ultra Rare': ['UR', 'SR', 'HR'],
  'Hyper rare': ['HR', 'UR', 'HR'],
  'Mega Hyper Rare': ['MUR', 'MUR', 'HR'],
  'Mega Attack Rare': ['MAR', 'MAR', 'HR'],
  'Secret Rare': ['SCR', 'SCR', 'HR'],
  'Shiny rare': ['S', 'S', 'HR'],
  'Shiny Ultra Rare': ['SSR', 'SSR', 'HR'],
  'Shiny rare V': ['SV', 'SV', 'HR'],
  'Shiny rare VMAX': ['SVM', 'SVM', 'HR'],
  'Character Rare': ['CHR', 'CHR', 'HR'],
  'Character Super Rare': ['CSR', 'CSR', 'HR'],
  'ACE SPEC Rare': ['ACE', 'ACE', 'HR'],
  'Radiant Rare': ['RAD', 'K', 'HR'],
  'Amazing Rare': ['A', 'A', 'HR'],
  'Holo Rare V': ['V', 'V', 'HR'],
  'Holo Rare VMAX': ['VMAX', 'VMAX', 'HR'],
  'Holo Rare VSTAR': ['VSTAR', 'VSTAR', 'HR'],
  'Rare Holo LV.X': ['LV.X', 'LV.X', 'HR'],
  'Rare PRIME': ['PRIME', 'PRIME', 'HR'],
  'LEGEND': ['LEGEND', 'LEGEND', 'HR'],
  'Classic Collection': ['CLC', 'CLC', 'HR'],
  'Pikachu Rare': ['PIKA', 'PIKA', 'HR'],
  'RGB Rare': ['RGB', 'RGB', 'HR'],
  'Black White Rare': ['BWR', 'BWR', 'HR'],
  'Full Art Trainer': ['FA', 'FA', 'HR'],
  'Futuristic Rare': ['FUT', 'FUT', 'HR'],
};
/** Rarities that are plain tiers; everything else counts as a special rarity. */
export const BASIC_RARITIES = ['Common', 'Uncommon', 'Rare', 'Holo Rare', 'Rare Holo', 'Promo', 'None'];
/** Abbreviation of a card's rarity in its own edition (IR vs AR), or the old tier symbol for mock cards. */
export const rarAbbr = c => { const r = RARITIES[c.rarityName]; if (!r) return c.rarityName ? c.rarityName : RAR[c.rarity][1]; return c.avail[0] === 'EN' || c.avail[0] === 'DE' ? r[0] : r[1]; };
/** "AR · Illustration rare" style label for a card. */
export const rarLabel = c => c.rarityName ? rarAbbr(c) + ' · ' + c.rarityName : RAR[c.rarity][1] + ' ' + RAR[c.rarity][0];
export const RAR_ORDER = { X: -1, C: 0, U: 1, R: 2, HR: 3 };
export const IMGS = [
  { id: 'sunset', name: 'Zonsondergang', fill: 'linear-gradient(165deg,#FFC36B 0%,#FF7A3D 38%,#E3350D 62%,#5A1A3A 100%)' },
  { id: 'lagoon', name: 'Lagune', fill: 'linear-gradient(200deg,#BFF3FF 0%,#5BC0EB 45%,#1E5FA8 100%)' },
  { id: 'meadow', name: 'Weide', fill: 'linear-gradient(180deg,#D8F5A2 0%,#9BBC0F 50%,#306230 100%)' },
  { id: 'night', name: 'Sterrennacht', fill: 'radial-gradient(circle at 20% 30%,#fff 0 1.5px,transparent 2.5px),radial-gradient(circle at 72% 58%,#fff 0 1px,transparent 2px),radial-gradient(circle at 45% 82%,#fff 0 1px,transparent 2px),radial-gradient(circle at 85% 20%,#fff 0 1.5px,transparent 2.5px),linear-gradient(180deg,#1B1F4B,#4B2A6B)' },
  { id: 'holo', name: 'Holo', fill: 'linear-gradient(115deg,#ffb3d9,#ffe9a3 25%,#b8f5d0 50%,#a9dcff 75%,#d6b8ff)' },
  { id: 'plaid', name: 'Ruit', fill: 'repeating-linear-gradient(0deg,rgba(227,53,13,.35) 0 6px,transparent 6px 18px),repeating-linear-gradient(90deg,rgba(227,53,13,.35) 0 6px,transparent 6px 18px),linear-gradient(#F7F3E8,#F7F3E8)' },
  { id: 'lcd', name: 'Pixelscherm', fill: 'repeating-linear-gradient(0deg,rgba(15,56,15,.2) 0 2px,transparent 2px 6px),repeating-linear-gradient(90deg,rgba(15,56,15,.2) 0 2px,transparent 2px 6px),linear-gradient(#9BBC0F,#8BAC0F)' },
  { id: 'dusk', name: 'Schemering', fill: 'linear-gradient(160deg,#F3A6C8,#9D7BD8 55%,#3B3A7A)' },
];
export const BGS = [
  { id: 'none', name: 'Geen', fill: 'none' },
  { id: 'paper', name: 'Ruitjespapier', fill: 'repeating-linear-gradient(0deg,rgba(62,111,176,.2) 0 1px,transparent 1px 14px),repeating-linear-gradient(90deg,rgba(62,111,176,.2) 0 1px,transparent 1px 14px),linear-gradient(#FFFDF6,#FFFDF6)' },
  { id: 'lcd', name: 'LCD-groen', fill: IMGS[6].fill },
  { id: 'stripes', name: 'Rode strepen', fill: 'repeating-linear-gradient(135deg,rgba(227,53,13,.2) 0 10px,transparent 10px 20px),linear-gradient(#F7F3E8,#F7F3E8)' },
  { id: 'night', name: 'Nacht', fill: IMGS[3].fill },
  { id: 'holo', name: 'Holo-zacht', fill: 'linear-gradient(115deg,rgba(255,179,217,.6),rgba(255,233,163,.6) 25%,rgba(184,245,208,.6) 50%,rgba(169,220,255,.6) 75%,rgba(214,184,255,.6)),linear-gradient(#FFFDF6,#FFFDF6)' },
];
export const PIX: Record<string, string[]> = {
  star: ['...#....', '...#....', '..###...', '#######.', '.#####..', '..###...', '.##.##..', '##...##.'],
  heart: ['.##.##..', '#######.', '#######.', '#######.', '.#####..', '..###...', '...#....', '........'],
  bolt: ['....##..', '...##...', '..##....', '.######.', '....##..', '...##...', '..##....', '.#......'],
  sparkle: ['...#....', '...#....', '.#.#.#..', '..###...', '#######.', '..###...', '.#.#.#..', '...#....'],
  drop: ['...#....', '..###...', '..###...', '.#####..', '.#####..', '#######.', '.#####..', '..###...'],
};
export const pixShadow = (k, col) => { const out = []; (PIX[k] || PIX.star).forEach((row, y) => row.split('').forEach((ch, x) => { if (ch === '#') out.push((x * 4) + 'px ' + (y * 4) + 'px 0 ' + col); })); return out.join(','); };
export const STK_ICONS = [['star', '#F6C945'], ['heart', '#E3350D'], ['bolt', '#F6C945'], ['sparkle', '#9BBC0F'], ['drop', '#5BC0EB'], ['star', '#D6B8FF']];
export const STK_TEXT = [['CHASE ★', '#E3350D', '#FFF8EE'], ['NIEUW!', '#9BBC0F', '#0F380F'], ['FAVORIET', '#FFFDF6', '#1A1C22'], ['1E EDITIE', '#2B2E36', '#9BBC0F'], ['HOLO', 'linear-gradient(115deg,#ffb3d9,#ffe9a3,#b8f5d0,#a9dcff)', '#1A1C22']];
export const TEMPLATES = [['center', 'Middenstuk'], ['banner', 'Banner bovenaan'], ['checker', 'Dambord'], ['full', 'Volledige achtergrond']];
export const SIZES = { '1x1': [1, 1], '1x2': [1, 2], '2x1': [2, 1], '2x2': [2, 2] };
export const EMPTYD = { bg: {}, images: [], stickers: [] };
export const DEFCROP = { fill: IMGS[7].fill, name: 'Voorbeeldfoto', w: 2, h: 2, x: 50, y: 50, zoom: 1 };
export function tplAreas(t, cols, rows) {
  if (t === 'center') { const w = cols >= 4 ? 2 : 1, h = rows >= 4 ? 2 : 1; return [{ col: Math.floor((cols - w) / 2), row: Math.floor((rows - h) / 2), w, h }]; }
  if (t === 'banner') return [{ col: 0, row: 0, w: cols, h: 1 }];
  if (t === 'checker') { const a = []; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if ((r + c) % 2 === 0) a.push({ col: c, row: r, w: 1, h: 1 }); return a; }
  return [];
}
export function syncSlots(b) {
  const cols = COLS[b.fmt]; const s = b.slots.map(x => (typeof x === 'string' && x.startsWith('D:')) ? null : x);
  ((b.deco && b.deco.images) || []).forEach(im => { for (let r = im.row; r < im.row + im.h; r++) for (let c = im.col; c < im.col + im.w; c++) { const idx = im.page * b.fmt + r * cols + c; if (idx < s.length && (s[idx] == null || s[idx] === 'B')) s[idx] = 'D:' + im.id; } });
  return s;
}
export function decoPiece(b, x, j) {
  const none = { decoFill: 'none', decoSize: 'cover', decoPos: 'center', decoBuf: false };
  if (!(typeof x === 'string' && x.startsWith('D:'))) return none;
  const im = ((b.deco && b.deco.images) || []).find(i => 'D:' + i.id === x); if (!im) return none;
  const cols = COLS[b.fmt]; const dx = j % cols - im.col, dy = Math.floor(j / cols) - im.row;
  return { decoFill: im.fill, decoSize: (im.w * 100) + '% ' + (im.h * 100) + '%', decoPos: (im.w > 1 ? dx / (im.w - 1) * 100 : 50) + '% ' + (im.h > 1 ? dy / (im.h - 1) * 100 : 50) + '%', decoBuf: !!im.buffer };
}
export const isBufD = (b, x) => typeof x === 'string' && x.startsWith('D:') && !!(((b.deco && b.deco.images) || []).find(i => 'D:' + i.id === x) || {}).buffer;
export function mkShowcase() {
  const b = mkB('b5', 'Showcase', 9, 2, '#306230', [[3, [26, 27, 28, 29, 30, 31]], [9, [32, null, 33, null, null, null, 34, null, 35]]]);
  b.deco = { bg: { 0: { fill: 'repeating-linear-gradient(0deg,oklch(0.83 0.10 140 / 0.35) 0 4px,transparent 4px 12px),repeating-linear-gradient(90deg,oklch(0.83 0.10 140 / 0.35) 0 4px,transparent 4px 12px),linear-gradient(#FFFDF6,#FFFDF6)', label: '' }, 1: { fill: 'linear-gradient(180deg,oklch(0.83 0.10 140 / 0.25),oklch(0.83 0.10 140 / 0.7))', label: 'VERDANT WILDS' } },
    images: [{ id: 'i1', page: 0, col: 0, row: 0, w: 3, h: 1, fill: IMGS[2].fill, x: 50, y: 50, zoom: 1, buffer: false }, { id: 'i2', page: 1, col: 1, row: 1, w: 1, h: 1, fill: IMGS[0].fill, x: 50, y: 50, zoom: 1, buffer: true }],
    stickers: [{ id: 's1', page: 0, x: 88, y: 7, kind: 'icon', icon: 'star', color: '#F6C945', rot: -8 }, { id: 's2', page: 1, x: 24, y: 8, kind: 'text', text: 'CHASE ★', bg: '#E3350D', fg: '#FFF8EE', rot: -6 }, { id: 's3', page: 1, x: 78, y: 52, kind: 'icon', icon: 'sparkle', color: '#9BBC0F', rot: 0 }] };
  b.slots = syncSlots(b); return b;
}
export const KINDS = [['set', 'Setbinder', 'collections_bookmark', 'Een of meer sets op volgorde, met buffers.'], ['smart', 'Themabinder', 'filter_alt', 'Op type, taal, zeldzaamheid of waarde.'], ['trade', 'Ruilbinder', 'swap_horiz', 'Al je dubbele exemplaren, op waarde.'], ['free', 'Vrije binder', 'auto_stories', 'Lege pagina\'s voor favorieten of displays.']];
export function smartCards(o, own) { return CARDS.filter(c => (!o.types.length || o.types.includes(c.type)) && (!o.rars.length || o.rars.includes(c.rarity)) && c.trend >= (o.minVal || 0) && (!o.langs.length || o.langs.some(l => o.ownedOnly ? ((own[c.id] || {})[l] || 0) > 0 : c.avail.includes(l))) && (!o.ownedOnly || tot(own[c.id]) > 0)); }
export function kindDesc(o) {
  if (o.kind === 'set') return SETS.filter(s => o.sets.includes(s.code)).map(s => s.name).join(' · ') || 'Geen sets';
  if (o.kind === 'trade') return 'Dubbelen' + (o.minVal ? ' vanaf € ' + o.minVal : '');
  if (o.kind === 'free') return 'Vrije indeling';
  const p = o.types.map(t => TYPES[t][0]).concat(o.langs, o.rars.map(r => RAR[r][0])); if (o.minVal) p.push('€ ' + o.minVal + '+'); return p.join(' · ') || 'Alle kaarten';
}
export function buildLayout(o) {
  const cols = COLS[o.fmt]; const slots = []; const own = o.owned || {}; const kind = o.kind || 'set';
  const sortFn = (a, b) => o.sort === 'type' ? (a.type.localeCompare(b.type) || a.id - b.id) : o.sort === 'rarity' ? (RAR_ORDER[a.rarity] - RAR_ORDER[b.rarity] || a.id - b.id) : o.sort === 'value' ? (b.trend - a.trend) : o.sort === 'name' ? a.names.EN.localeCompare(b.names.EN) : a.id - b.id;
  let groups = [];
  if (kind === 'set') groups = SETS.filter(s => o.sets.includes(s.code)).map(s => (BYSET[s.code] || []));
  else if (kind === 'smart') { const list = smartCards(o, own); const g = o.group || 'none'; if (g === 'none') groups = [list]; else { const keyOf = c => g === 'set' ? c.set : g === 'type' ? c.type : (LANGS.find(l => ((own[c.id] || {})[l] || 0) > 0) || c.avail[0]); const m = new Map(); list.forEach(c => { const k = keyOf(c); if (!m.has(k)) m.set(k, []); m.get(k).push(c); }); groups = Array.from(m.values()); } }
  else if (kind === 'trade') groups = [CARDS.filter(c => tot(own[c.id]) > 1 && c.trend >= (o.minVal || 0))];
  const useStrat = kind === 'set' || (kind === 'smart' && o.group && o.group !== 'none');
  groups.forEach(g => { const cs = g.slice().sort(sortFn); if (useStrat && o.newPage) while (slots.length % o.fmt) slots.push(null); cs.forEach(c => slots.push(c.id)); if (useStrat && o.buffer) { while (slots.length % cols) slots.push('B'); for (let i = 0; i < o.buffer * cols; i++) slots.push('B'); } });
  let pages = Math.max(kind === 'free' ? (o.freePages || 4) : 2, Math.ceil(slots.length / o.fmt)); if (pages % 2) pages++;
  while (slots.length < pages * o.fmt) slots.push(null);
  return { fmt: o.fmt, pages, slots };
}
export const NAV = [['home', 'Home', 'home'], ['search', 'Zoeken', 'search'], ['collection', 'Collectie', 'style'], ['binders', 'Binders', 'menu_book']];
export const pad = n => String(n).padStart(3, '0');
export const CARDS: any[] = [];
/** Species by national dex number: { name: {EN,DE,JA,ZH}, type }. Filled by setCatalog(). */
export const SP: Record<number, any> = {};
export const BYSP: Record<number, any[]> = {};
/** Cards per set code. */
export const BYSET: Record<string, any[]> = {};
/** Illustrators present in the catalog. */
export const ILLUS: string[] = [];
/** Number of cards per illustrator. */
export const ILLUS_N: Record<string, number> = {};
export const REGIONS = [['kanto', 'Kanto', 1, 151], ['johto', 'Johto', 152, 251], ['hoenn', 'Hoenn', 252, 386], ['sinnoh', 'Sinnoh', 387, 493], ['unova', 'Unova', 494, 649], ['kalos', 'Kalos', 650, 721], ['alola', 'Alola', 722, 809], ['galar', 'Galar', 810, 905], ['paldea', 'Paldea', 906, 1025]];
export const VARL = { regular: 'Standaard', holo: 'Holo', fullart: 'Full art', illus: 'Illustration rare', promo: 'Promo', form: 'Regionale vorm' };
export const tot = o => o ? LANGS.reduce((a, l) => a + (o[l] || 0), 0) : 0;

/**
 * Replace the catalog. Cards need: set, setName, num, numStr, names{EN,DE,JA,ZH}, type, rarity, avail, sp, year, variant,
 * illus, trend; optionally img{lang: url}, low, avg1, avg7, avg30 (real prices) and isNew/cat.
 */
/** True when the fictional prototype catalog is loaded (offline / tests): user data is then not persisted. */
export let CATALOG_MOCK = true;

export function setCatalog(sets: any[], cards: any[], updated?: string) {
  CATALOG_MOCK = !cards[0]?.uid;
  if (updated) UPDATED = updated;
  SETS.length = 0; SETS.push(...sets);
  CARDS.length = 0; cards.forEach((c, i) => CARDS.push(Object.assign(c, { id: i })));
  for (const k of Object.keys(BYSP)) delete BYSP[k];
  for (const k of Object.keys(BYSET)) delete BYSET[k];
  CARDS.forEach(c => { (BYSP[c.sp] = BYSP[c.sp] || []).push(c); (BYSET[c.set] = BYSET[c.set] || []).push(c); });
  for (let d = 1; d <= 1025; d++) {
    const list = (BYSP[d] || []).filter(x => x.variant !== 'form');
    // Species name per language: the shortest card name in that language (drops suffixes like "ex" / "V").
    const nameIn = l => list.filter(x => x.avail.includes(l)).map(x => x.names[l]).sort((a, b) => a.length - b.length)[0];
    const en = nameIn('EN') || nameIn('JA') || nameIn('ZH');
    SP[d] = en ? { name: { EN: en, DE: nameIn('DE') || en, JA: nameIn('JA') || en, ZH: nameIn('ZH') || en }, type: (list.find(x => x.category !== 1 && x.category !== 2) || list[0]).type } : { name: { EN: '#' + pad(d), DE: '#' + pad(d), JA: '#' + pad(d), ZH: '#' + pad(d) }, type: null };
  }
  CARDS.forEach(c => { if (c.sp > 1025) SP[c.sp] = { name: c.names, type: c.type }; });
  for (const k of Object.keys(ILLUS_N)) delete ILLUS_N[k];
  CARDS.forEach(c => { if (c.illus) ILLUS_N[c.illus] = (ILLUS_N[c.illus] || 0) + 1; });
  // Most prolific illustrators first.
  ILLUS.length = 0; ILLUS.push(...Object.keys(ILLUS_N).sort((a, b) => ILLUS_N[b] - ILLUS_N[a]));
  DEFRECIPE.set = SETS[0]?.code; DEFRECIPE.prefSet = (SETS[1] || SETS[0])?.code; DEFRECIPE.illus = ILLUS[0] || '';
}

/** The original prototype catalog (fictional sets), used offline and in tests. */
export function mockCatalog() {
  const ROWS = RAW.trim().split('\n').map(l => l.trim().split('|'));
  const MOCK_ILLUS = ['Aiko Mori', 'Jonas Veld', 'Mika Tanabe', 'Rui Okada', 'Lena Brandt', 'Sora Ishii'];
  const sets: any[] = [
    { code: 'EMB', name: 'Ember Dawn', n: 14, avail: ['EN', 'DE', 'JA', 'ZH'] },
    { code: 'TDL', name: 'Tidal Echo', n: 12, avail: ['EN', 'DE', 'JA', 'ZH'] },
    { code: 'VRD', name: 'Verdant Wilds', n: 10, avail: ['EN', 'DE', 'JA'] },
    { code: 'STC', name: 'Static Surge', n: 8, avail: ['EN', 'JA', 'ZH'] },
  ];
  const cards: any[] = [];
  let k = 0; sets.forEach(s => { for (let i = 0; i < s.n; i++) { const r = ROWS[k]; const rar = i === s.n - 1 ? 'HR' : (i === s.n - 2 || i === Math.floor(s.n / 2)) ? 'R' : (i % 3 === 2 ? 'U' : 'C'); cards.push({ set: s.code, setName: s.name, num: i + 1, numStr: pad(i + 1) + '/' + pad(s.n), names: { EN: r[0], DE: r[1], JA: r[2], ZH: r[3] }, type: r[4], rarity: rar, avail: s.avail }); k++; } });
  const sp: Record<number, any> = {};
  const A = ['Bra', 'Clo', 'Dra', 'Fen', 'Gli', 'Hop', 'Kri', 'Lum', 'Mor', 'Nib', 'Pip', 'Quo', 'Ras', 'Sno', 'Tri', 'Vel', 'Wix', 'Zor', 'Bel', 'Cra', 'Dun', 'Fiz', 'Gro', 'Jin', 'Kel', 'Mav', 'Ori', 'Pes', 'Rul', 'Tav'];
  const B = ['bit', 'dle', 'mon', 'pup', 'zor', 'kin', 'fly', 'rex', 'tail', 'scale', 'burr', 'wing', 'moth', 'shell', 'fang', 'horn', 'leaf', 'spark', 'drop', 'claw', 'nix', 'paw', 'lop', 'quill'];
  const KA = ['ヒ', 'ミ', 'コ', 'ラ', 'ト', 'ナ', 'ポ', 'ゴ', 'ピ', 'ズ', 'モ', 'サ', 'ク', 'ル'], KB = ['ラン', 'ポン', 'ドン', 'リス', 'キン', 'ビー', 'ガル', 'ニャ', 'ボウ', 'ロス', 'ミン', 'タロ'];
  const ZA = ['火', '水', '叶', '雷', '影', '岩', '风', '星', '月', '铁', '花', '雾', '云', '沙'], ZB = ['狐', '龙', '鸟', '虫', '熊', '猫', '蛇', '鱼', '兽', '灵', '鼠', '鹿'];
  const TK = Object.keys(TYPES);
  for (let d = 1; d <= 1025; d++) {
    if (d <= cards.length) { const c = cards[d - 1]; sp[d] = { name: c.names, type: c.type }; continue; }
    const en = A[(d * 7) % A.length] + B[(d * 13 + Math.floor(d / 30)) % B.length];
    sp[d] = { name: { EN: en, DE: en, JA: KA[(d * 5) % KA.length] + KB[(d * 3) % KB.length], ZH: ZA[(d * 11) % ZA.length] + ZB[(d * 7) % ZB.length] }, type: TK[(d * 11 + Math.floor(d / 7)) % TK.length] };
  }
  const SETYEAR = { EMB: 2024, TDL: 2024, VRD: 2025, STC: 2025 };
  cards.forEach((c, i) => { c.sp = i + 1; c.year = SETYEAR[c.set]; c.variant = c.rarity === 'HR' ? 'holo' : 'regular'; });
  const hs = n => ((n * 2654435761) >>> 0) % 1000 / 10;
  const ex = { CLS: [], ART: [], PRM: [], RGN: [] };
  for (let d = 1; d <= 1025; d++) { const x = hs(d); ex.CLS.push([d, 'regular', x < 70 ? 'C' : 'U']); if (x < 30) ex.ART.push([d, d % 2 ? 'fullart' : 'illus', 'HR']); else if (x < 44) ex.PRM.push([d, 'promo', 'U']); if (d <= 151 && x >= 91) ex.RGN.push([d, 'form', 'R']); }
  [6, 25, 94].forEach(d => ex.PRM.push([d, 'promo', 'R', true]));
  [['CLS', 'Classic Archive', ['EN', 'DE', 'JA', 'ZH'], 2016], ['ART', 'Art Gallery', ['EN', 'JA'], 2023], ['PRM', "Promo's", ['EN', 'DE', 'JA', 'ZH'], 2022], ['RGN', 'Regionale vormen', ['EN', 'DE', 'JA'], 2025]].forEach(([code, name, avail, year]) => {
    const list = ex[code]; sets.push({ code, name, n: list.length, avail, year, cat: true });
    list.forEach(([d, variant, rar, isNew], i) => { const s = sp[d]; const nm = variant === 'form' ? { EN: s.name.EN + ' ◇', DE: s.name.DE + ' ◇', JA: s.name.JA + '◇', ZH: s.name.ZH + '◇' } : s.name; cards.push({ set: code, setName: name, num: i + 1, numStr: pad(i + 1) + '/' + pad(list.length), names: nm, type: s.type, rarity: rar, avail, sp: d, year: isNew ? 2026 : year, variant, isNew: !!isNew, cat: true }); });
  });
  const PBASE = { C: [0.08, 0.35], U: [0.25, 1.2], R: [1.8, 7.5], HR: [9, 48] };
  cards.forEach((c, i) => { c.illus = MOCK_ILLUS[(i * 5 + c.sp) % MOCK_ILLUS.length]; const r = ((i * 9301 + 49297) % 233280) / 233280; const [a, b] = PBASE[c.rarity]; c.trend = Math.round((a + (b - a) * r) * 100) / 100; c.drift = ((i * 37) % 35 - 15) / 100; });
  return { sets, cards };
}
function catOwn(c) { const x = ((c.id * 7919 + c.sp * 31) >>> 0) % 100; const kanto = c.sp <= 151; let p = c.set === 'CLS' ? (kanto ? 64 : 16) : c.set === 'RGN' ? 40 : c.set === 'ART' ? (kanto ? 14 : 8) : 8; if (c.isNew) p = 0; const n = { EN: 0, DE: 0, JA: 0, ZH: 0 }; if (x < p) { if (x % 5 === 0 && c.avail.includes('JA')) n.JA = 1; else n.EN = 1; if (x % 11 === 0) n.EN += 1; } return n; }

/** Price `d` days ago. Real cards interpolate between Cardmarket's trend/avg1/avg7/avg30; mock cards use a synthetic curve. */
export const priceAt = (c, d) => {
  if (c.trend == null) return 0;
  if (c.avg30 != null) {
    const pts = [[0, c.trend], [1, c.avg1 ?? c.trend], [7, c.avg7 ?? c.trend], [30, c.avg30]];
    for (let i = 1; i < pts.length; i++) if (d <= pts[i][0]) { const [d0, p0] = pts[i - 1], [d1, p1] = pts[i]; return p0 + (p1 - p0) * (d - d0) / (d1 - d0); }
    return c.avg30;
  }
  return Math.max(0.02, c.trend * (1 - c.drift * Math.pow(d / 30, 0.6) + 0.05 * (Math.sin(d * 0.45 + c.id) - Math.sin(c.id))));
};
export const priceInfo = c => { const s = Array.from({ length: 30 }, (_, i) => priceAt(c, 29 - i)); const avg = n => s.slice(-n).reduce((a, b) => a + b, 0) / n; const p7 = priceAt(c, 7); return { trend: c.trend, low: c.low ?? Math.round(c.trend * 78) / 100, avg7: c.avg7 ?? avg(7), avg30: c.avg30 ?? avg(30), chg: p7 ? (c.trend - p7) / p7 * 100 : 0, series: s }; };
export const EURF = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
export const eur = n => n == null || Number.isNaN(n) ? '€ —' : EURF.format(n);
export const pctf = n => (n >= 0 ? '+' : '−') + Math.abs(n).toFixed(1).replace('.', ',') + '%';
/** Date shown next to prices ('Prijzen via Cardmarket · bijgewerkt op …'). */
export let UPDATED = '20 oktober 2026';
export const chgStyle = (n, dark) => n >= 0 ? (dark ? { bg: '#0F380F', fg: '#9BBC0F' } : { bg: '#306230', fg: '#F7F3E8' }) : { bg: '#E3350D', fg: '#FFF8EE' };
export function initOwned() {
  const o = {}, d = {};
  CARDS.forEach(c => {
    if (c.cat) { o[c.id] = catOwn(c); d[c.id] = 60 + (c.id * 17) % 300; return; }
    const h = (c.id * 7919 + 13) % 13; const n = { EN: 0, DE: 0, JA: 0, ZH: 0 };
    if (c.set === 'STC') { n.EN = 1 + (c.id % 2); n.JA = c.id % 3 === 0 ? 1 : 0; }
    else if (h < 8) { n.EN = h % 3; n.DE = h % 4 === 1 ? 1 : 0; n.JA = (h % 5 === 0 || h === 3) ? 1 : 0; n.ZH = h === 7 ? 1 : 0; }
    LANGS.forEach(l => { if (!c.avail.includes(l)) n[l] = 0; });
    if (h < 8 && !tot(n)) n.EN = 1;
    o[c.id] = n; d[c.id] = (c.id * 13 + 5) % 40;
  });
  o[13] = { EN: 0, DE: 0, JA: 0, ZH: 0 }; o[25] = { EN: 1, DE: 0, JA: 1, ZH: 0 }; o[1] = { EN: 2, DE: 1, JA: 1, ZH: 0 };
  [1, 25].forEach(id => LANGS.forEach(l => { if (CARDS[id] && !CARDS[id].avail.includes(l)) o[id][l] = 0; }));
  return { o, d };
}
export const range = (a, b) => Array.from({ length: b - a }, (_, i) => a + i);
export function mkB(id, name, fmt, pages, cover, place) { const slots = Array(pages * fmt).fill(null); place.forEach(([st, ids]) => ids.forEach((c, i) => { slots[st + i] = c; })); return { id, name, fmt, pages, cover, slots, deco: { bg: {}, images: [], stickers: [] } }; }

export const RECIPES = [['dex', 'Regio-dex', 'dex', 'Alle Pokémon uit een regio, op dex-nummer.', '#E3350D', '#FFF8EE'], ['master', 'Master set', 'master', 'Elke kaart uit één set, inclusief varianten.', '#3E6FB0', '#FFF8EE'], ['single', 'Eén Pokémon, alle versies', 'egg', 'Elke versie van je favoriet naast elkaar.', '#E8B92E', '#1A1C22'], ['illus', 'Illustrator', 'brush', 'Alle kaarten van één tekenaar.', '#7A5BC7', '#FFF8EE'], ['type', 'Type', 'flame', 'Alles van één type, bijvoorbeeld Vuur.', '#306230', '#FFF8EE'], ['empty', 'Leeg beginnen', 'page', 'Lege pagina\'s om zelf te vullen of te decoreren.', '#FFFDF6', '#1A1C22']];
export const RSTEPS = { dex: ['region', 'per', 'pref'], master: ['set', 'order'], single: ['species', 'order'], illus: ['illus', 'per', 'pref'], type: ['ptype', 'per', 'pref'], empty: ['pages'] };
export const STEPT = { region: ['Regio', 'Welke regio?'], per: ['Kaarten per Pokémon', 'Hoeveel kaarten per Pokémon?'], pref: ['Voorkeursversie', 'Welke versie heeft je voorkeur?'], set: ['Set', 'Welke set?'], order: ['Volgorde', 'In welke volgorde?'], species: ['Pokémon', 'Welke Pokémon?'], illus: ['Illustrator', 'Welke illustrator?'], ptype: ['Type', 'Welk type?'], pages: ["Pagina's", "Hoeveel pagina's?"] };
export const PREFS = [['owned', 'Wat ik al heb, anders goedkoopste', 'Je eigen kaarten eerst; ontbrekende zo goedkoop mogelijk.', 'savings'], ['fullart', 'Full art / illustration rare', 'De mooiste versie, als die bestaat.', 'palette'], ['oldest', 'Oudste versie', 'Zo dicht mogelijk bij het origineel.', 'history'], ['value', 'Meest waardevol', 'De topversie van elke Pokémon.', 'diamond'], ['set', 'Uit een specifieke set', 'Kies een set; anders een alternatief.', 'collections_bookmark']];
export const DEFRECIPE = { type: 'dex', region: 'kanto', custom: false, from: 1, to: 151, forms: true, per: 'one', pref: 'owned', prefSet: 'ART', lang: 'EN', fmt: 9, sort: 'dex', buffer: 0, name: '', sp: 25, illus: 'Aiko Mori', ptype: 'fire', set: 'EMB', order: 'oldest', pages: 4 };
Object.assign(PIX, {
  dex: ['########', '#..#...#', '#..#...#', '########', '#...#..#', '#...#..#', '########', '........'],
  master: ['..#####.', '..#...#.', '.#####.#', '.#...#.#', '#####.#.', '#...#.#.', '#...##..', '#####...'],
  egg: ['...##...', '..####..', '.######.', '.##.###.', '########', '####.###', '.######.', '..####..'],
  brush: ['......##', '.....###', '....###.', '...###..', '..###...', '.##.....', '###.....', '##......'],
  flame: ['...#....', '..##....', '..###.#.', '.####.#.', '.######.', '########', '###..###', '.######.'],
  page: ['########', '#......#', '#..##..#', '#.####.#', '#.####.#', '#..##..#', '#......#', '########'],
});
export const pixShadowU = (k, col, u) => { const out = []; (PIX[k] || PIX.star).forEach((row, y) => row.split('').forEach((ch, x) => { if (ch === '#') out.push((x * u) + 'px ' + (y * u) + 'px 0 ' + col); })); return out.join(','); };
export function pickVersion(cands, r, owned) {
  const own = c => tot(owned[c.id]) > 0; const ownL = c => ((owned[c.id] || {})[r.lang] || 0) > 0; const cheap = l => l.slice().sort((a, b) => a.trend - b.trend)[0];
  if (r.pref === 'fullart') { const f = cands.filter(c => c.variant === 'fullart' || c.variant === 'illus'); return f.length ? { card: f.find(own) || f[0] } : { card: cands.find(own) || cheap(cands), warn: 'Geen full art beschikbaar · alternatief gekozen' }; }
  if (r.pref === 'oldest') return { card: cands.slice().sort((a, b) => a.year - b.year || a.id - b.id)[0] };
  if (r.pref === 'value') return { card: cands.slice().sort((a, b) => b.trend - a.trend)[0] };
  if (r.pref === 'set') { const s = cands.filter(c => c.set === r.prefSet); return s.length ? { card: s[0] } : { card: cands.find(own) || cheap(cands), warn: 'Niet in ' + ((SETS.find(x => x.code === r.prefSet) || {}).name || r.prefSet) + ' · alternatief gekozen' }; }
  const o = cands.filter(ownL), o2 = cands.filter(own); return { card: o.length ? cheap(o) : o2.length ? cheap(o2) : cheap(cands) };
}
export function recipeItems(r, owned) {
  const own = c => tot(owned[c.id]) > 0;
  const one = (sps, f) => sps.map(d => { const cands = (BYSP[d] || []).filter(f); return cands.length ? Object.assign({ sp: d }, pickVersion(cands, r, owned)) : null; }).filter(Boolean);
  let items = [];
  if (r.type === 'dex' || r.type === 'type') {
    const sps = []; if (r.type === 'dex') { for (let d = Math.max(1, r.from); d <= Math.min(1025, r.to); d++) sps.push(d); } else { for (let d = 1; d <= 1025; d++) if (SP[d].type === r.ptype) sps.push(d); }
    if (r.per === 'one') { items = one(sps, c => c.variant !== 'form'); if (r.type === 'dex' && r.forms) sps.forEach(d => (BYSP[d] || []).filter(c => c.variant === 'form').forEach(c => items.push(Object.assign({ sp: d, form: true }, pickVersion([c], r, owned))))); }
    else sps.forEach(d => (BYSP[d] || []).filter(c => r.type !== 'dex' || r.forms || c.variant !== 'form').forEach(c => items.push({ sp: d, card: c, form: c.variant === 'form' })));
  } else if (r.type === 'illus') { const cs = CARDS.filter(c => c.illus === r.illus); if (r.per === 'one') items = one(Array.from(new Set(cs.map(c => c.sp))), c => c.illus === r.illus); else items = cs.map(c => ({ sp: c.sp, card: c })); }
  else if (r.type === 'master') items = (BYSET[r.set] || []).map(c => ({ sp: c.sp, card: c }));
  else if (r.type === 'single') items = (BYSP[r.sp] || []).map(c => ({ sp: c.sp, card: c }));
  const so = r.sort;
  if (r.type === 'master') items.sort((a, b) => r.order === 'type' ? (a.card.type.localeCompare(b.card.type) || a.card.num - b.card.num) : r.order === 'value' ? b.card.trend - a.card.trend : a.card.num - b.card.num);
  else if (r.type === 'single') items.sort((a, b) => r.order === 'value' ? b.card.trend - a.card.trend : r.order === 'owned' ? ((own(b.card) ? 1 : 0) - (own(a.card) ? 1 : 0)) || a.card.year - b.card.year : a.card.year - b.card.year || a.card.id - b.card.id);
  else items.sort((a, b) => so === 'set' ? (a.card.set.localeCompare(b.card.set) || a.card.num - b.card.num) : so === 'value' ? b.card.trend - a.card.trend : so === 'name' ? a.card.names.EN.localeCompare(b.card.names.EN) : (a.sp - b.sp) || ((a.form ? 1 : 0) - (b.form ? 1 : 0)) || a.card.year - b.card.year);
  return items;
}
export function buildRecipe(r, owned) {
  const cols = COLS[r.fmt]; const slots = []; const warn = {}; let ownedN = 0, cost = 0, formsN = 0;
  const items = r.type === 'empty' ? [] : recipeItems(r, owned);
  items.forEach(it => { if (it.warn) warn[slots.length] = it.warn; slots.push(it.card.id); if (tot(owned[it.card.id]) > 0) ownedN++; else cost += it.card.trend; if (it.form) formsN++; });
  if (r.buffer && r.type !== 'empty') { while (slots.length % cols) slots.push('B'); for (let i = 0; i < r.buffer * cols; i++) slots.push('B'); }
  let pages = Math.max(r.type === 'empty' ? r.pages : 2, Math.ceil(slots.length / r.fmt)); if (pages % 2) pages++;
  while (slots.length < pages * r.fmt) slots.push(null);
  return { fmt: r.fmt, pages, slots, warn, n: items.length, ownedN, cost, formsN };
}
export function regLabel(r) { const g = REGIONS.find(x => x[0] === r.region); return r.custom ? '#' + pad(r.from) + '–#' + pad(r.to) : g[1] + ' #' + pad(g[2]) + '–#' + pad(g[3]); }
export function autoName(r) { if (r.type === 'dex') return r.custom ? 'Dex #' + pad(r.from) + '–#' + pad(r.to) : REGIONS.find(x => x[0] === r.region)[1] + '-dex'; if (r.type === 'master') return ((SETS.find(s => s.code === r.set) || {}).name || r.set) + ' master set'; if (r.type === 'single') return 'Alles van ' + SP[r.sp].name.EN; if (r.type === 'illus') return 'Kunst van ' + r.illus; if (r.type === 'type') return TYPES[r.ptype][0] + '-binder'; return 'Nieuwe binder'; }
export function recipeLabel(r) {
  const per = r.per === 'one' ? 'ÉÉN PER POKÉMON' : 'ALLE VERSIES'; const pref = r.per === 'one' ? (PREFS.find(p => p[0] === r.pref) || PREFS[0])[1].toUpperCase() : '';
  if (r.type === 'dex') return ['REGIO-DEX', regLabel(r).toUpperCase(), per, pref, r.forms ? '+ VORMEN' : ''].filter(Boolean).join(' · ');
  if (r.type === 'type') return ['TYPE', TYPES[r.ptype][0].toUpperCase(), per, pref].filter(Boolean).join(' · ');
  if (r.type === 'illus') return ['ILLUSTRATOR', r.illus.toUpperCase(), per, pref].filter(Boolean).join(' · ');
  if (r.type === 'master') return 'MASTER SET · ' + ((SETS.find(s => s.code === r.set) || {}).name || r.set).toUpperCase();
  if (r.type === 'single') return 'ÉÉN POKÉMON · #' + pad(r.sp) + ' ' + SP[r.sp].name.EN.toUpperCase() + ' · ALLE VERSIES';
  return 'LEEG · ' + r.pages + " PAGINA'S";
}
export function mkRecipeBinder(own) { const r = Object.assign({}, DEFRECIPE, { pref: 'fullart' }); const res = buildRecipe(r, own); return { id: 'b6', name: 'Kanto-dex', fmt: r.fmt, pages: res.pages, cover: '#E8B92E', slots: res.slots, warn: res.warn, recipe: r, suggestOn: true, dismissed: [], kind: 'recipe', desc: 'Kanto · één per Pokémon · full art', deco: { bg: {}, images: [], stickers: [] } }; }
const mainSets = () => SETS.filter(s => !s.cat);
const hasJA = () => CARDS.some(c => c.avail.includes('JA'));
const bkinds = () => ({ b1: ['set', mainSets().slice(0, 3).map(s => s.name).join(' · ')], b2: ['smart', hasJA() ? 'Japans · in bezit' : 'Duits · in bezit'], b3: ['set', (mainSets()[3] || mainSets()[0]).name], b4: ['trade', 'Dubbelen · op waarde'], b5: ['free', 'Display met decoraties'] });
export const withKinds = list => { const K = bkinds(); return list.map(b => Object.assign(b, { kind: b.kind || (K[b.id] || ['set'])[0], desc: b.desc || (K[b.id] || ['', ''])[1] })); };
export const initBinders = (own) => withKinds([
  mkB('b1', 'Starterbinder', 9, 6, '#E3350D', [[0, [0, 1, ...range(3, 14), 'E:015', 'E:016', 'B', 'B', 'B']], [18, [...range(14, 26), 'B', 'B', 'B', 'B', 'B', 'B']], [36, range(26, 36)]]),
  mkB('b2', hasJA() ? 'Japanse favorieten' : 'Duitse favorieten', 4, 4, '#306230', [[0, [2, 15, 27, 36, 38, 40, 1, 18]]]),
  mkB('b3', mainSets()[3] ? mainSets()[3].name : 'Favorieten', 12, 2, '#E8B92E', [[0, range(36, 44)]]),
  mkB('b4', 'Ruilmap', 16, 2, '#3E6FB0', [[0, [4, 9, 16, 20, 28, 31]]]),
  mkShowcase(),
  mkRecipeBinder(own),
]);
