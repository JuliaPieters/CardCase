import { CARD_TYPES } from './config';

/** Formats in the order of the catalog's legality bit mask (scripts/sync-magic.mjs). */
export const FORMATS = ['standard', 'pioneer', 'modern', 'legacy', 'vintage', 'pauper', 'commander'];
const COLOUR_BITS: [number, string][] = [
  [1, 'white'],
  [2, 'blue'],
  [4, 'black'],
  [8, 'red'],
  [16, 'green'],
];
const RARITY_NAMES: Record<string, string> = { c: 'Common', u: 'Uncommon', r: 'Rare', m: 'Mythic', s: 'Special', b: 'Bonus' };

const colours = (mask: number) => COLOUR_BITS.filter(([b]) => mask & b).map(([, k]) => k);
/** The Scryfall id back from its base64url form. */
const uuid = (b64: string) => {
  const h = Array.from(atob(b64.replace(/-/g, '+').replace(/_/g, '/')), (ch) => ch.charCodeAt(0).toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};
const image = (id: string, size: string) => `https://cards.scryfall.io/${size}/front/${id[0]}/${id[1]}/${id}.jpg`;
/** The main card type of a type line ("Legendary Creature — Elf" → Creature). */
const mainType = (line: string) => Object.keys(CARD_TYPES).find((t) => line.split('—')[0].includes(t)) || 'Other';

/** Expands public/catalogs/magic.json (built by `npm run sync-magic` from Scryfall) into the app's card objects. */
export function buildCatalog(raw: any, langs: string[]) {
  const str = (i: number) => (i >= 0 ? raw.strings[i] : null);
  const sets = raw.sets.map((x: any) => ({ code: x.code, name: x.name, n: 0, year: x.released ? +x.released.slice(0, 4) : 0, released: x.released, kind: x.type, avail: [] as string[] }));
  const groups = new Map<string, number>();
  const cards = raw.cards.map((t: any[]) => {
    const [b64, nameI, setI, num, rar, colourMask, identityMask, cmc, typeI, eur, eurFoil, legal, finish, flags, artistI, rank, costI, kws, restricted, maxCopies, partnerI, langMask] = t;
    const set = sets[setI];
    set.n++;
    const id = uuid(b64);
    const name = str(nameI);
    if (!groups.has(name)) groups.set(name, 100000 + groups.size);
    const typeLine = str(typeI) || '';
    const cs = colours(colourMask);
    const names = Object.fromEntries(langs.map((l) => [l, name]));
    // English and the other languages it was printed in (scripts/sync-magic.mjs: bit i is langs[i + 1]); a catalog
    // from before that was known offers them all.
    const avail = langMask == null ? langs : langs.filter((_, i) => i === 0 || langMask & (1 << (i - 1)));
    const special = flags & (2 | 4 | 8 | 16);
    const foilOnly = !(finish & 1);
    return {
      key: 'magic:' + set.code + '-' + num,
      game: 'magic',
      set: set.code,
      setName: set.name,
      num: parseInt(num, 10) || 0,
      localId: num,
      total: null,
      numStr: num,
      names,
      spNames: names,
      // Colour category: one colour, several (multi) or none (colourless).
      type: cs.length === 1 ? cs[0] : cs.length > 1 ? 'multi' : 'colorless',
      colours: cs,
      identity: colours(identityMask),
      typeName: CARD_TYPES[mainType(typeLine)] || 'Overig',
      cardType: mainType(typeLine),
      typeLine,
      rarity: rar === 'c' ? 'C' : rar === 'u' ? 'U' : rar === 'r' ? 'R' : 'HR',
      rarityName: RARITY_NAMES[rar],
      variant: special ? 'fullart' : flags & 1 ? 'promo' : 'regular',
      category: 0,
      avail,
      sp: groups.get(name)!,
      year: set.year,
      released: set.released,
      illus: str(artistI) || '',
      scryfallId: id,
      img: { [langs[0]]: image(id, 'normal') },
      imgBig: { [langs[0]]: image(id, 'large') },
      imgAlt: null,
      cmc,
      manaCost: str(costI) || '',
      legal: Object.fromEntries(FORMATS.map((f, i) => [f, !!(legal & (1 << i))])),
      /** Formats where it is restricted: at most one copy (Vintage). */
      restricted: Object.fromEntries(FORMATS.map((f, i) => [f, !!((restricted || 0) & (1 << i))])),
      basicLand: !!(flags & 32),
      anyNumber: !!(flags & 64),
      /** "A deck can have up to seven cards named …": its own maximum (0: the format's). */
      maxCopies: maxCopies || 0,
      /** Its text says it can be your commander (some planeswalkers). */
      commanderText: !!(flags & 128),
      /** "Partner with …": the name of the one card it may lead with. */
      partnerWith: partnerI != null && partnerI >= 0 ? str(partnerI) : null,
      keywords: (kws || []).map(str),
      rank: rank || null,
      foilTypes: [finish & 1 ? 'None' : null, finish & 2 ? 'Foil' : null, finish & 4 ? 'Etched' : null].filter(Boolean),
      foilOnly,
      // Prices of the day the catalog was built (Cardmarket via Scryfall), until fresh ones arrive.
      trend: foilOnly ? eurFoil : eur,
      low: null,
      avg1: null,
      avg7: null,
      avg30: null,
      foil: !foilOnly && eurFoil ? { trend: eurFoil, low: null, avg1: null, avg7: null, avg30: null } : null,
    };
  });
  // A set is available in every language one of its cards was printed in.
  const setLangs = sets.map(() => new Set<string>());
  raw.cards.forEach((t: any[], i: number) => cards[i].avail.forEach((l: string) => setLangs[t[2]].add(l)));
  sets.forEach((x: any, i: number) => (x.avail = langs.filter((l) => setLangs[i].has(l))));
  return { sets, cards };
}
