// @ts-nocheck -- verbatim port of the untyped design-prototype logic; add types incrementally.
// Mock data and pure helpers, ported from the Cardcase design prototype.
import { resolveFill } from './images';

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
/** Languages of the active department's cards, and their names (set from its config by setLanguages). */
export const LANGS: string[] = ['EN', 'DE', 'JA', 'ZH'];
export const LNAME: Record<string, string> = { EN: 'Engels', DE: 'Duits', JA: 'Japans', ZH: 'Chinees' };

/** The active department (set with its catalog by CatalogService). */
export let GAME = 'pokemon';
export function setGame(game: string) { GAME = game; }

export function setLanguages(langs: { code: string; label: string }[]) {
  LANGS.length = 0; LANGS.push(...langs.map(l => l.code));
  for (const k of Object.keys(LNAME)) delete LNAME[k];
  langs.forEach(l => { LNAME[l.code] = l.label; });
}

/** Makes a department's settings the active ones (with its catalog, by CatalogService; in tests directly). */
export function applyGameConfig(config: import('../games/config').GameConfig) {
  setGame(config.game);
  setLanguages(config.languages);
  for (const k of Object.keys(TYPES)) delete TYPES[k];
  Object.assign(TYPES, config.types);
  for (const k of Object.keys(RARITIES)) delete RARITIES[k];
  Object.assign(RARITIES, config.rarities);
  BASIC_RARITIES.length = 0; BASIC_RARITIES.push(...config.basicRarities);
  RECIPES.length = 0; RECIPES.push(...config.recipes);
  for (const k of Object.keys(RSTEPS)) delete RSTEPS[k];
  Object.assign(RSTEPS, config.recipeSteps);
  PREFS.length = 0; PREFS.push(...config.prefs);
  Object.assign(NOUN, config.noun);
  // Step titles name the department's unit ("Kaarten per Pokémon", "Welk personage?").
  for (const k of Object.keys(STEPT)) delete STEPT[k];
  for (const [k, [a, q]] of Object.entries(BASE_STEPT)) STEPT[k] = [a.replace('...', config.noun.one), q.replace('...', config.noun.one)];
  Object.assign(STEPT, config.stepTitles || {});
  Object.assign(PIX, config.icons || {});
  // Decoration material of the department (backgrounds and stickers); the shared set when it has none.
  if (config.deco) {
    BGS.splice(1, BGS.length - 1, ...config.deco.backgrounds);
    STK_ICONS.splice(0, STK_ICONS.length, ...config.deco.stickers);
    STK_TEXT.splice(0, STK_TEXT.length, ...config.deco.texts);
  }
  DEFRECIPE.type = config.recipes[0][0];
  DEFRECIPE.ptype = Object.keys(config.types)[0];
}
export const RAR = { C: ['Gewoon', '●'], U: ['Ongewoon', '◆'], R: ['Zeldzaam', '★'], HR: ['Holo-zeldzaam', '✦'], X: ['Onbekend', '?'] };
export const CONDS = [['M', 'Mint'], ['NM', 'Near Mint'], ['EX', 'Excellent'], ['GD', 'Good'], ['PL', 'Played']];
export const COLS = { 4: 2, 9: 3, 12: 3, 16: 4 };
export const isCard = x => typeof x === 'number';
export const isRes = x => typeof x === 'string';
export const COVERS = ['#E3350D', '#306230', '#E8B92E', '#3E6FB0', '#7A5BC7', '#2B2E36'];
/**
 * The active department's colour categories (Pokémon type, Lorcana ink: key → [label, oklch colour]) and rarities
 * (name → [abbreviation, abbreviation in Asian editions, basic tier]); see games/config.ts. Set by applyGameConfig.
 */
export const TYPES: Record<string, [string, string]> = {};
export const RARITIES: Record<string, [string, string, string]> = {};
/** Rarities that are plain tiers; everything else counts as a special rarity (shown as a badge). */
export const BASIC_RARITIES: string[] = [];

/** Abbreviation of a card's rarity in its own edition (IR vs AR), or the old tier symbol for mock cards. */
export const rarAbbr = c => { const r = RARITIES[c.rarityName]; if (!r) return c.rarityName ? c.rarityName : RAR[c.rarity][1]; return c.avail[0] === 'EN' || c.avail[0] === 'DE' ? r[0] : r[1]; };
/** "AR · Illustration rare" style label for a card. */
export const rarLabel = c => c.rarityName ? rarAbbr(c) + ' · ' + c.rarityName : RAR[c.rarity][1] + ' ' + RAR[c.rarity][0];
export const RAR_ORDER = { X: -1, C: 0, U: 1, R: 2, HR: 3 };
/** A drawn scene as a CSS background (300×420, the shape of a 3×3 page; covers any span of pockets). */
const scene = (body: string) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 420' preserveAspectRatio='xMidYMid slice' shape-rendering='crispEdges'>${body}</svg>`)}")`;
const stars = (n: number, seed: number, h: number) => Array.from({ length: n }, (_, i) => { const x = (i * 97 + seed * 31) % 300, y = (i * 53 + seed * 17) % h, z = i % 3 ? 3 : 5; return `<rect x='${x}' y='${y}' width='${z}' height='${z}' fill='#FFF8E0'/>`; }).join('');
/** Default art for Michi-style inserts: scenes that fill pockets instead of cards (users can upload their own). */
export const IMGS = [
  { id: 'sunset', name: 'Zonsondergang', fill: scene(`<rect width='300' height='420' fill='#5A1A3A'/><rect width='300' height='70' fill='#FFC36B'/><rect y='70' width='300' height='50' fill='#FFA24D'/><rect y='120' width='300' height='50' fill='#FF7A3D'/><rect y='170' width='300' height='50' fill='#E3350D'/><circle cx='150' cy='215' r='62' fill='#FFE9A3'/><path d='M0 260 L60 200 L110 240 L170 170 L230 230 L300 190 L300 420 L0 420Z' fill='#7A2448'/><path d='M0 300 L80 250 L150 290 L220 245 L300 285 L300 420 L0 420Z' fill='#3E1230'/><rect y='330' width='300' height='90' fill='#2B0F25'/><rect x='40' y='345' width='60' height='4' fill='#FF7A3D'/><rect x='170' y='362' width='90' height='4' fill='#FF7A3D'/><rect x='90' y='385' width='70' height='4' fill='#E3350D'/>`) },
  { id: 'lagoon', name: 'Lagune', fill: scene(`<rect width='300' height='420' fill='#1E5FA8'/><rect width='300' height='150' fill='#BFF3FF'/><rect x='30' y='40' width='70' height='16' fill='#FFFFFF'/><rect x='45' y='28' width='40' height='14' fill='#FFFFFF'/><rect x='190' y='70' width='80' height='14' fill='#FFFFFF'/><rect y='150' width='300' height='80' fill='#5BC0EB'/><path d='M180 230 L215 175 L250 230Z' fill='#F6E2A6'/><rect x='212' y='150' width='6' height='45' fill='#7A5230'/><path d='M190 150 L215 140 L245 152 L215 147Z' fill='#4E9F3D'/>${Array.from({ length: 9 }, (_, i) => `<rect x='${(i * 70) % 300}' y='${250 + i * 18}' width='40' height='5' fill='#BFF3FF' opacity='.7'/>`).join('')}`) },
  { id: 'meadow', name: 'Weide', fill: scene(`<rect width='300' height='420' fill='#9BD7F5'/><rect x='40' y='50' width='80' height='18' fill='#FFFFFF'/><rect x='58' y='36' width='44' height='16' fill='#FFFFFF'/><rect x='180' y='90' width='70' height='16' fill='#FFFFFF'/><path d='M0 230 Q75 170 150 220 T300 200 L300 420 L0 420Z' fill='#9BBC0F'/><path d='M0 290 Q100 240 200 285 T300 270 L300 420 L0 420Z' fill='#6E9A1A'/><rect y='340' width='300' height='80' fill='#306230'/>${Array.from({ length: 14 }, (_, i) => `<rect x='${(i * 43 + 11) % 290}' y='${300 + (i * 29) % 110}' width='6' height='6' fill='${['#FFF8EE', '#F6C945', '#F3A6C8'][i % 3]}'/>`).join('')}`) },
  { id: 'night', name: 'Sterrennacht', fill: scene(`<rect width='300' height='420' fill='#0F1A3A'/><rect y='200' width='300' height='220' fill='#1E2A5A'/>${stars(40, 3, 260)}<circle cx='225' cy='80' r='34' fill='#FFF3C4'/><circle cx='240' cy='70' r='30' fill='#0F1A3A'/><path d='M0 320 L70 260 L130 300 L200 240 L300 310 L300 420 L0 420Z' fill='#141D40'/><rect y='370' width='300' height='50' fill='#0A1230'/>`) },
  { id: 'holo', name: 'Holo', fill: scene(`<defs><linearGradient id='h' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#ffb3d9'/><stop offset='.25' stop-color='#ffe9a3'/><stop offset='.5' stop-color='#b8f5d0'/><stop offset='.75' stop-color='#a9dcff'/><stop offset='1' stop-color='#d6b8ff'/></linearGradient></defs><rect width='300' height='420' fill='url(#h)'/>${Array.from({ length: 12 }, (_, i) => { const x = (i * 83 + 20) % 280, y = (i * 61 + 30) % 400; return `<path d='M${x} ${y - 12} L${x + 3} ${y - 3} L${x + 12} ${y} L${x + 3} ${y + 3} L${x} ${y + 12} L${x - 3} ${y + 3} L${x - 12} ${y} L${x - 3} ${y - 3}Z' fill='#FFFFFF' opacity='.85'/>`; }).join('')}`) },
  { id: 'plaid', name: 'Ruit', fill: 'repeating-linear-gradient(0deg,rgba(227,53,13,.35) 0 6px,transparent 6px 18px),repeating-linear-gradient(90deg,rgba(227,53,13,.35) 0 6px,transparent 6px 18px),linear-gradient(#F7F3E8,#F7F3E8)' },
  { id: 'lcd', name: 'Pixelscherm', fill: 'repeating-linear-gradient(0deg,rgba(15,56,15,.2) 0 2px,transparent 2px 6px),repeating-linear-gradient(90deg,rgba(15,56,15,.2) 0 2px,transparent 2px 6px),linear-gradient(#9BBC0F,#8BAC0F)' },
  { id: 'dusk', name: 'Bos in de schemering', fill: scene(`<rect width='300' height='420' fill='#3B3A7A'/><rect width='300' height='120' fill='#F3A6C8'/><rect y='120' width='300' height='80' fill='#C38AD8'/><rect y='200' width='300' height='60' fill='#9D7BD8'/>${stars(10, 7, 110)}${Array.from({ length: 8 }, (_, i) => { const x = i * 40 - 5, h = 120 + (i * 37) % 70; return `<path d='M${x + 20} ${420 - h - 60} L${x + 45} ${420 - h} L${x - 5} ${420 - h}Z' fill='#2A2860'/><path d='M${x + 20} ${420 - h - 30} L${x + 50} ${420 - h + 40} L${x - 10} ${420 - h + 40}Z' fill='#232150'/><rect x='${x + 16}' y='${420 - h + 40}' width='8' height='${h}' fill='#1A183E'/>`; }).join('')}<rect y='390' width='300' height='30' fill='#16143A'/>`) },
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
/**
 * Lays out a binder around its decoration, Michi style: an image fills the pockets it covers instead of cards, and
 * the cards (with empty and reserved slots, in their order) flow on into the next free pockets, adding pages when
 * needed. A buffer image only takes pockets that are empty, so a new card can still take its place. The recipe's
 * per-slot labels (warn, alts) move along with their cards.
 */
export function syncSlots(b) {
  const fmt = b.fmt, cols = COLS[fmt]; const isD = x => typeof x === 'string' && x.startsWith('D:');
  const seq = []; b.slots.forEach((x, i) => { if (!isD(x)) seq.push([x, b.warn && b.warn[i], b.alts && b.alts[i]]); });
  while (seq.length && seq[seq.length - 1][0] == null) seq.pop();
  const cover = new Map(), soft = new Map(); let last = -1;
  ((b.deco && b.deco.images) || []).forEach(im => { for (let r = im.row; r < im.row + im.h; r++) for (let c = im.col; c < im.col + im.w; c++) { const idx = im.page * fmt + r * cols + c; (im.buffer ? soft : cover).set(idx, 'D:' + im.id); last = Math.max(last, idx); } });
  const slots = [], warn = {}, alts = {}; let pages = b.pages, k = 0;
  for (let i = 0; k < seq.length || i < pages * fmt || i <= last; i++) {
    if (i >= pages * fmt) pages += 2;
    if (cover.has(i)) { slots.push(cover.get(i)); continue; }
    // A buffer image shows where the next card would otherwise leave the pocket empty.
    const it = seq[k]; if (soft.has(i) && (!it || it[0] == null)) { slots.push(soft.get(i)); if (it) k++; continue; }
    k++; if (!it) { slots.push(null); continue; }
    slots.push(it[0]); if (it[1]) warn[i] = it[1]; if (it[2]) alts[i] = it[2];
  }
  return { slots, pages, warn, alts };
}
/**
 * One pocket's part (`dx`, `dy` pockets from the top left) of art spanning `im.w` × `im.h` pockets: the image covers
 * the whole span at its crop position and zoom, without stretching, and the pocket shows its own part of it.
 * `g` is the gap between pockets, as a CSS length.
 */
export function artPiece(im, dx, dy, g = '0px') {
  return {
    fill: resolveFill(im.fill), pos: (im.x ?? 50) + '% ' + (im.y ?? 50) + '%', zoom: im.zoom || 1,
    w: `calc(${im.w * 100}% + ${im.w - 1} * ${g})`, h: `calc(${im.h * 100}% + ${im.h - 1} * ${g})`,
    l: `calc(${-dx * 100}% - ${dx} * ${g})`, t: `calc(${-dy * 100}% - ${dy} * ${g})`,
  };
}
export function decoPiece(b, x, j) {
  const none = { decoArt: null, decoBuf: false, decoCorner: false };
  if (!(typeof x === 'string' && x.startsWith('D:'))) return none;
  const im = ((b.deco && b.deco.images) || []).find(i => 'D:' + i.id === x); if (!im) return none;
  const cols = COLS[b.fmt]; const dx = j % cols - im.col, dy = Math.floor(j / cols) - im.row;
  // The top right pocket carries the art's remove button.
  return { decoArt: artPiece(im, dx, dy, 'var(--g, 0px)'), decoBuf: !!im.buffer, decoCorner: dx === im.w - 1 && dy === 0 };
}
export const isBufD = (b, x) => typeof x === 'string' && x.startsWith('D:') && !!(((b.deco && b.deco.images) || []).find(i => 'D:' + i.id === x) || {}).buffer;
export function mkShowcase() {
  const b = mkB('b5', 'Showcase', 9, 2, '#306230', [[3, [26, 27, 28, 29, 30, 31]], [9, [32, null, 33, null, null, null, 34, null, 35]]]);
  b.deco = { bg: { 0: { fill: 'repeating-linear-gradient(0deg,oklch(0.83 0.10 140 / 0.35) 0 4px,transparent 4px 12px),repeating-linear-gradient(90deg,oklch(0.83 0.10 140 / 0.35) 0 4px,transparent 4px 12px),linear-gradient(#FFFDF6,#FFFDF6)', label: '' }, 1: { fill: 'linear-gradient(180deg,oklch(0.83 0.10 140 / 0.25),oklch(0.83 0.10 140 / 0.7))', label: 'VERDANT WILDS' } },
    images: [{ id: 'i1', page: 0, col: 0, row: 0, w: 3, h: 1, fill: IMGS[2].fill, x: 50, y: 50, zoom: 1, buffer: false }, { id: 'i2', page: 1, col: 1, row: 1, w: 1, h: 1, fill: IMGS[0].fill, x: 50, y: 50, zoom: 1, buffer: true }],
    stickers: [{ id: 's1', page: 0, x: 88, y: 7, kind: 'icon', icon: 'star', color: '#F6C945', rot: -8 }, { id: 's2', page: 1, x: 24, y: 8, kind: 'text', text: 'CHASE ★', bg: '#E3350D', fg: '#FFF8EE', rot: -6 }, { id: 's3', page: 1, x: 78, y: 52, kind: 'icon', icon: 'sparkle', color: '#9BBC0F', rot: 0 }] };
  return Object.assign(b, syncSlots(b));
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
export const NAV = [['home', 'Home', 'home'], ['search', 'Zoeken', 'search'], ['collection', 'Collectie', 'style'], ['binders', 'Binders', 'menu_book'], ['friends', 'Vrienden', 'group']];
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
 * Copies of other versions than the plain one: an owned entry is { EN: 3, …, foil?: { EN: 1 }, reverse?: { EN: 1 } },
 * the version counts being part of the language counts (3 English cards: one foil, one reverse holo, one plain).
 * Version keys are lowercase, languages uppercase; departments with one version per card never set them.
 */
export const verOf = (o, l, k) => Math.min(o?.[k]?.[l] || 0, o?.[l] || 0);
/** The version keys an owned entry has copies of. */
export const verKeys = o => o ? Object.keys(o).filter(k => o[k] && typeof o[k] === 'object') : [];
export const totVer = (o, k) => o ? LANGS.reduce((a, l) => a + verOf(o, l, k), 0) : 0;
export const foilOf = (o, l) => verOf(o, l, 'foil');
export const totFoil = o => totVer(o, 'foil');
/** Prices of a version of a card ({ trend, low, avg1, avg7, avg30 }), when it has its own. */
export const verPrice = (c, k) => c.vp?.[k] ?? (k === 'foil' ? c.foil : null);
/** Value of the copies of a card in an owned entry, `d` days ago: other versions at their own price when they have one. */
export function ownedValue(c, o, d = 0) {
  const n = tot(o); if (!n) return 0;
  const p = priceAt(c, d); let rest = n; let v = 0;
  for (const k of verKeys(o)) {
    const m = totVer(o, k); if (!m) continue;
    const vp = verPrice(c, k); rest -= m;
    v += m * (vp?.trend ? (c.trend ? p * vp.trend / c.trend : vp.trend) : p);
  }
  return Math.max(0, rest) * p + v;
}

/**
 * Replace the catalog. Cards need: set, setName, num, numStr, names{EN,DE,JA,ZH}, type, rarity, avail, sp, year, variant,
 * illus, trend; optionally img{lang: url}, low, avg1, avg7, avg30 (real prices) and isNew/cat.
 */
/** True when the fictional prototype catalog is loaded (offline / tests): user data is then not persisted. */
export let CATALOG_MOCK = true;

export function setCatalog(sets: any[], cards: any[], updated?: string) {
  CATALOG_MOCK = !!cards.length && !cards[0].key;
  if (updated) UPDATED = updated;
  SETS.length = 0; SETS.push(...sets);
  CARDS.length = 0; cards.forEach((c, i) => CARDS.push(Object.assign(c, { id: i })));
  for (const k of Object.keys(BYSP)) delete BYSP[k];
  for (const k of Object.keys(BYSET)) delete BYSET[k];
  CARDS.forEach(c => { (BYSP[c.sp] = BYSP[c.sp] || []).push(c); (BYSET[c.set] = BYSET[c.set] || []).push(c); });
  // Pokémon: a species per national dex number (other games group by name, with numbers above 1025).
  if (CARDS.some(c => c.sp <= 1025)) for (let d = 1; d <= 1025; d++) {
    const list = (BYSP[d] || []).filter(x => x.variant !== 'form');
    // Species name per language: the shortest card name in that language (drops suffixes like "ex" / "V").
    const nameIn = l => list.filter(x => x.avail.includes(l)).map(x => x.names[l]).sort((a, b) => a.length - b.length)[0];
    const en = nameIn('EN') || nameIn('JA') || nameIn('ZH');
    SP[d] = en ? { name: { EN: en, DE: nameIn('DE') || en, JA: nameIn('JA') || en, ZH: nameIn('ZH') || en }, type: (list.find(x => x.category !== 1 && x.category !== 2) || list[0]).type } : { name: { EN: '#' + pad(d), DE: '#' + pad(d), JA: '#' + pad(d), ZH: '#' + pad(d) }, type: null };
  }
  CARDS.forEach(c => { if (c.sp > 1025) SP[c.sp] = { name: c.spNames || c.names, type: c.type }; });
  for (const k of Object.keys(ILLUS_N)) delete ILLUS_N[k];
  CARDS.forEach(c => { if (c.illus) ILLUS_N[c.illus] = (ILLUS_N[c.illus] || 0) + 1; });
  // Most prolific illustrators first.
  ILLUS.length = 0; ILLUS.push(...Object.keys(ILLUS_N).sort((a, b) => ILLUS_N[b] - ILLUS_N[a]));
  DEFRECIPE.sp = +Object.keys(BYSP).sort((a, b) => BYSP[b].length - BYSP[a].length)[0] || 25;
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
/** Sort key for a card's release: the set's date, or just its year (mock catalog, unknown date). */
export const relKey = c => c.released || (c.year ? c.year + '-00-00' : '');
const RELF = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const RELF_SHORT = new Intl.DateTimeFormat('nl-NL', { month: 'short', year: 'numeric', timeZone: 'UTC' });
/** '12 mei 2023' (short: 'mei 2023'), or the year alone when the exact date is unknown. */
export const relLabel = (c, short = false) => c.released ? (short ? RELF_SHORT : RELF).format(new Date(c.released + 'T00:00:00Z')) : c.year ? String(c.year) : '';
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

/**
 * The active department's binder recipes (see games/config.ts): tiles [key, label, icon, description, colour, text
 * colour], the questions each one asks, version preferences, and how it names what a recipe lists one card of.
 * Set by applyGameConfig.
 */
export const RECIPES: [string, string, string, string, string, string][] = [];
export const RSTEPS: Record<string, string[]> = {};
export const PREFS: [string, string, string, string][] = [];
export const NOUN = { one: 'kaart', many: 'kaarten' };
const BASE_STEPT = { region: ['Regio', 'Welke regio?'], per: ['Kaarten per ...', 'Hoeveel kaarten per ...?'], pref: ['Voorkeursversie', 'Welke versie heeft je voorkeur?'], set: ['Set', 'Welke set?'], order: ['Volgorde', 'In welke volgorde?'], species: ['...', 'Welke ...?'], illus: ['Illustrator', 'Welke illustrator?'], story: ['Verhaal', 'Uit welk verhaal?'], ptype: ['Type', 'Welk type?'], pages: ["Pagina's", "Hoeveel pagina's?"], langs: ['Taal', 'In welke talen?'] };
export const STEPT: Record<string, string[]> = {};
export const DEFRECIPE: any = { type: 'dex', region: 'kanto', custom: false, from: 1, to: 151, forms: true, per: 'one', pref: 'owned', prefSet: 'ART', lang: 'EN', langs: [], fmt: 9, sort: 'dex', buffer: 0, name: '', sp: 25, illus: 'Aiko Mori', ptype: 'fire', set: 'EMB', order: 'oldest', pages: 4 };
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
  // Owned in one of the binder's languages (any language when it has none).
  const langs = r.langs || []; const own = c => langs.length ? langs.some(l => ((owned[c.id] || {})[l] || 0) > 0) : tot(owned[c.id]) > 0;
  const ownL = c => ((owned[c.id] || {})[langs[0] || r.lang] || 0) > 0; const cheap = l => l.slice().sort((a, b) => (a.trend ?? Infinity) - (b.trend ?? Infinity))[0];
  // When the preferred version doesn't exist for a Pokémon, its regular card stands in (the one you have, else the cheapest).
  const regular = warn => { const reg = cands.filter(c => c.variant === 'regular' || c.variant === 'holo'); const pool = reg.length ? reg : cands; return { card: pool.find(own) || cheap(pool), warn }; };
  if (r.pref === 'fullart') { const f = cands.filter(c => c.variant === 'fullart' || c.variant === 'illus'); return f.length ? { card: f.find(own) || cheap(f), alts: f.length } : regular('Geen full art van deze ' + NOUN.one + ' · gewone kaart'); }
  if (r.pref === 'illus') { const f = cands.filter(c => c.variant === 'illus'); return f.length ? { card: f.find(own) || cheap(f), alts: f.length } : regular('Geen IR van deze ' + NOUN.one + ' · gewone kaart'); }
  if (r.pref === 'oldest') return { card: cands.slice().sort((a, b) => a.year - b.year || a.id - b.id)[0] };
  if (r.pref === 'value') return { card: cands.slice().sort((a, b) => b.trend - a.trend)[0] };
  if (r.pref === 'set') { const s = cands.filter(c => c.set === r.prefSet); return s.length ? { card: s.find(own) || cheap(s), alts: s.length } : regular('Niet in ' + ((SETS.find(x => x.code === r.prefSet) || {}).name || r.prefSet) + ' · gewone kaart'); }
  const o = cands.filter(ownL), o2 = cands.filter(own); return { card: o.length ? cheap(o) : o2.length ? cheap(o2) : cheap(cands) };
}
export function recipeItems(r, owned) {
  const own = c => tot(owned[c.id]) > 0;
  // Only cards printed in one of the chosen languages; regional forms ("Alolan Vulpix") are their own entries.
  const langs = r.langs || []; const inLang = c => !langs.length || langs.some(l => c.avail.includes(l));
  const isForm = c => !!c.form || c.variant === 'form';
  const cardsOf = d => (BYSP[d] || []).filter(inLang);
  const one = (sps, f) => sps.map(d => { const cands = cardsOf(d).filter(f); return cands.length ? Object.assign({ sp: d }, pickVersion(cands, r, owned)) : null; }).filter(Boolean);
  let items = [];
  // Type (Pokémon) or ink (Lorcana: a card can have two).
  const ofType = c => c.type === r.ptype || (c.inks || []).includes(r.ptype);
  if (r.type === 'dex' || r.type === 'type') {
    const sps = []; if (r.type === 'dex') { for (let d = Math.max(1, r.from); d <= Math.min(1025, r.to); d++) sps.push(d); } else { for (const d of spKeys()) if ((BYSP[d] || []).some(ofType)) sps.push(d); }
    if (r.per === 'one') {
      items = one(sps, c => !isForm(c) && (r.type !== 'type' || ofType(c)));
      // Each regional form of a Pokémon gets its own slot after the Pokémon.
      if (r.type === 'dex' && r.forms) sps.forEach(d => { const byForm = new Map(); cardsOf(d).filter(isForm).forEach(c => { const k = c.form || c.names.EN; byForm.set(k, [...(byForm.get(k) || []), c]); }); byForm.forEach(cs => items.push(Object.assign({ sp: d, form: true }, pickVersion(cs, r, owned)))); });
    }
    else sps.forEach(d => cardsOf(d).filter(c => (r.type !== 'dex' || r.forms || !isForm(c)) && (r.type !== 'type' || ofType(c))).forEach(c => items.push({ sp: d, card: c, form: isForm(c) })));
  } else if (r.type === 'illus') { const cs = CARDS.filter(c => c.illus === r.illus && inLang(c)); if (r.per === 'one') items = one(Array.from(new Set(cs.map(c => c.sp))), c => c.illus === r.illus); else items = cs.map(c => ({ sp: c.sp, card: c })); }
  else if (r.type === 'story') { const cs = CARDS.filter(c => c.story === r.story && inLang(c)); if (r.per === 'one') items = one(Array.from(new Set(cs.map(c => c.sp))), c => c.story === r.story); else items = cs.map(c => ({ sp: c.sp, card: c })); }
  else if (r.type === 'fullart') items = CARDS.filter(c => c.variant === 'fullart' && inLang(c)).map(c => ({ sp: c.sp, card: c }));
  else if (r.type === 'master') items = (BYSET[r.set] || []).filter(c => r.special !== false || c.variant !== 'fullart').map(c => ({ sp: c.sp, card: c }));
  else if (r.type === 'single') items = cardsOf(r.sp).map(c => ({ sp: c.sp, card: c }));
  const so = r.sort;
  if (r.type === 'master') items.sort((a, b) => r.order === 'type' ? (a.card.type.localeCompare(b.card.type) || a.card.num - b.card.num) : r.order === 'value' ? b.card.trend - a.card.trend : a.card.num - b.card.num);
  else if (r.type === 'single' || r.type === 'fullart') items.sort((a, b) => r.order === 'value' ? b.card.trend - a.card.trend : r.order === 'owned' ? ((own(b.card) ? 1 : 0) - (own(a.card) ? 1 : 0)) || a.card.year - b.card.year : a.card.year - b.card.year || a.card.id - b.card.id);
  else items.sort((a, b) => so === 'set' ? (a.card.set.localeCompare(b.card.set) || a.card.num - b.card.num) : so === 'value' ? b.card.trend - a.card.trend : so === 'name' ? a.card.names.EN.localeCompare(b.card.names.EN) : (a.sp - b.sp) || ((a.form ? 1 : 0) - (b.form ? 1 : 0)) || a.card.year - b.card.year);
  return items;
}
export function buildRecipe(r, owned) {
  const cols = COLS[r.fmt]; const slots = []; const warn = {}; const alts = {}; let ownedN = 0, cost = 0, formsN = 0;
  const items = r.type === 'empty' ? [] : recipeItems(r, owned);
  items.forEach(it => { if (it.warn) warn[slots.length] = it.warn; if (it.alts > 1) alts[slots.length] = it.alts; slots.push(it.card.id); if (tot(owned[it.card.id]) > 0) ownedN++; else cost += it.card.trend; if (it.form) formsN++; });
  if (r.buffer && r.type !== 'empty') { while (slots.length % cols) slots.push('B'); for (let i = 0; i < r.buffer * cols; i++) slots.push('B'); }
  let pages = Math.max(r.type === 'empty' ? r.pages : 2, Math.ceil(slots.length / r.fmt)); if (pages % 2) pages++;
  while (slots.length < pages * r.fmt) slots.push(null);
  return { fmt: r.fmt, pages, slots, warn, alts, n: items.length, ownedN, cost, formsN };
}
export function regLabel(r) { const g = REGIONS.find(x => x[0] === r.region); return r.custom ? '#' + pad(r.from) + '–#' + pad(r.to) : g[1] + ' #' + pad(g[2]) + '–#' + pad(g[3]); }
/** Every species (Pokémon) or character group (other games), in dex order or by name. */
export const spKeys = () => Object.keys(BYSP).map(Number).filter(d => SP[d]).sort((a, b) => a <= 1025 && b <= 1025 ? a - b : SP[a].name.EN.localeCompare(SP[b].name.EN));
/** "#025 Pikachu" for a Pokémon, just the name for a character. */
export const spLabel = d => (d <= 1025 ? '#' + pad(d) + ' ' : '') + (SP[d] ? SP[d].name.EN : '');
export function autoName(r) { if (r.type === 'story') return r.story; if (r.type === 'fullart') return 'Full art'; if (r.type === 'dex') return r.custom ? 'Dex #' + pad(r.from) + '–#' + pad(r.to) : REGIONS.find(x => x[0] === r.region)[1] + '-dex'; if (r.type === 'master') return ((SETS.find(s => s.code === r.set) || {}).name || r.set) + ' master set'; if (r.type === 'single') return 'Alles van ' + SP[r.sp].name.EN; if (r.type === 'illus') return 'Kunst van ' + r.illus; if (r.type === 'type') return TYPES[r.ptype][0] + '-binder'; return 'Nieuwe binder'; }
export function langLabel(r) { const l = r.langs || []; return l.length ? l.map(x => LNAME[x]).join(' + ') : 'Alle talen'; }
export function recipeLabel(r) {
  const lang = langLabel(r).toUpperCase();
  const per = r.per === 'one' ? 'ÉÉN PER ' + NOUN.one.toUpperCase() : 'ALLE VERSIES'; const pref = r.per === 'one' ? (PREFS.find(p => p[0] === r.pref) || PREFS[0])[1].toUpperCase() : '';
  if (r.type === 'dex') return ['REGIO-DEX', regLabel(r).toUpperCase(), lang, per, pref, r.forms ? '+ VORMEN' : ''].filter(Boolean).join(' · ');
  if (r.type === 'type') return [STEPT.ptype[0].toUpperCase(), TYPES[r.ptype][0].toUpperCase(), lang, per, pref].filter(Boolean).join(' · ');
  if (r.type === 'illus') return ['ILLUSTRATOR', r.illus.toUpperCase(), lang, per, pref].filter(Boolean).join(' · ');
  if (r.type === 'master') return 'MASTER SET · ' + ((SETS.find(s => s.code === r.set) || {}).name || r.set).toUpperCase();
  if (r.type === 'single') return 'ÉÉN ' + NOUN.one.toUpperCase() + ' · ' + spLabel(r.sp).toUpperCase() + ' · ' + lang + ' · ALLE VERSIES';
  if (r.type === 'story') return [STEPT.story[0].toUpperCase(), (r.story || '').toUpperCase(), lang, per, pref].filter(Boolean).join(' · ');
  if (r.type === 'fullart') return 'FULL ART · ' + lang;
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
