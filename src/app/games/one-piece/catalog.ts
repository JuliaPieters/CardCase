import { CARD_TYPES, RARITY_NAMES, config } from './config';

/**
 * Expands public/catalogs/one-piece.json (built by `npm run sync-one-piece` from Punk Records, see that script for the
 * format) into the card objects core/data.ts works with.
 */
export function buildCatalog(raw: any) {
  const base: Record<string, string> = raw.imageBase;
  const sets = raw.sets.map((s: any) => ({
    code: s.code,
    name: s.name,
    n: 0,
    year: s.released ? +s.released.slice(0, 4) : 0,
    released: s.released,
    total: s.total,
    kind: s.type,
    avail: [] as string[],
  }));
  const setBy = new Map(sets.map((s: any) => [s.code, s]));
  // Every print of a character (Monkey.D.Luffy in all its cards and parallels) is grouped under its name.
  const groups = new Map<string, number>();
  const cards = raw.cards.map((x: any) => {
    const set: any = setBy.get(x.s);
    set.n++;
    const avail = raw.langs.filter((l: string) => x.i18n[l]);
    for (const l of avail) if (!set.avail.includes(l)) set.avail.push(l);
    const names: Record<string, string> = {};
    const text: Record<string, string> = {};
    const img: Record<string, string> = {};
    const imgBig: Record<string, string> = {};
    const first = x.i18n[avail[0]];
    for (const l of raw.langs) {
      const [name, effect, trigger, path] = x.i18n[l] || first;
      names[l] = name;
      text[l] = [effect, trigger && (l === 'JA' ? '【トリガー】' : '[Trigger] ') + trigger].filter(Boolean).join('\n');
      if (x.i18n[l] && path) {
        img[l] = viaProxy(base[l] + path, 250);
        imgBig[l] = viaProxy(base[l] + path, 700);
      }
    }
    const group = (x.i18n.EN || first)[0];
    if (!groups.has(group)) groups.set(group, 100000 + groups.size);
    const colours = (x.col.length ? x.col : ['none']).map((c: string) => c.toLowerCase());
    const rarityName = RARITY_NAMES[x.r] || x.r;
    const card: any = {
      key: 'one-piece:' + x.k,
      game: 'one-piece',
      set: x.s,
      setName: set.name,
      num: parseInt(x.base.split('-')[1], 10) || 0,
      localId: x.n,
      total: set.total,
      numStr: x.base + (x.par ? ' P' + x.par : x.rep ? ' R' + x.rep : ''),
      code: x.base,
      parallel: x.par,
      reprint: x.rep,
      names,
      spNames: names,
      text,
      type: colours[0],
      colours,
      typeName: CARD_TYPES[x.cat] || x.cat,
      cardType: x.cat,
      subtypes: x.ty,
      attributes: x.attr,
      rarity: config.rarities[rarityName]?.[2] ?? 'X',
      rarityName,
      // Parallels are the alternate-art prints collectors chase; promos are their own kind.
      variant: x.par ? 'fullart' : set.kind === 'promo' ? 'promo' : 'regular',
      category: 0,
      avail,
      sp: groups.get(group)!,
      year: set.year,
      released: set.released,
      illus: null,
      img,
      imgBig,
      imgAlt: null,
      cost: x.cat === 'Leader' ? null : x.c,
      life: x.cat === 'Leader' ? x.c : null,
      power: x.pw,
      counter: x.ct,
      block: x.blk,
      /** Cardmarket product of the English print, else the Japanese one. */
      cardmarketId: x.cm?.EN ?? x.cm?.JA ?? null,
      trend: null,
    };
    // Prices on the day the catalog was built, until fresh ones arrive (core/catalog.ts applies those over them).
    if (x.p) Object.assign(card, { trend: x.p[0], low: x.p[1], avg1: x.p[2] ?? x.p[0], avg7: x.p[3] ?? x.p[0], avg30: x.p[4] ?? x.p[0] });
    return card;
  });
  return { sets, cards };
}

/**
 * The official sites only let their own pages show their card images (Cross-Origin-Resource-Policy: same-site), so they
 * are shown through images.weserv.nl, which also makes them smaller (webp, `w` pixels wide).
 */
const viaProxy = (url: string, w: number) => `https://images.weserv.nl/?url=${encodeURIComponent(url.replace(/^https:\/\//, ''))}&w=${w}&output=webp&q=80`;
