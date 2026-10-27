import { CARD_TYPES, config } from './config';

/**
 * Expands public/catalogs/lorcana.json (built by `npm run sync-lorcana` from LorcanaJSON, see that script for the
 * format) into the card objects core/data.ts works with.
 */
export function buildCatalog(raw: any) {
  const base: string = raw.imageBase;
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
  // Every version of a character ("Ariel – On Human Legs", "Ariel – Spectacular Singer") is grouped under its name.
  const groups = new Map<string, number>();
  const cards = raw.cards.map((x: any) => {
    const set: any = setBy.get(x.s);
    set.n++;
    const avail = raw.langs.filter((l: string) => x.i18n[l]);
    for (const l of avail) if (!set.avail.includes(l)) set.avail.push(l);
    const names: Record<string, string> = {};
    const spNames: Record<string, string> = {};
    const img: Record<string, string> = {};
    const imgBig: Record<string, string> = {};
    const text: Record<string, string> = {};
    const version: Record<string, string> = {};
    for (const l of raw.langs) {
      const [name, ver, txt, thumb, full] = x.i18n[l] || x.i18n.EN;
      names[l] = ver ? name + ' – ' + ver : name;
      spNames[l] = name;
      version[l] = ver;
      text[l] = txt;
      if (x.i18n[l]) {
        if (thumb) img[l] = base + thumb;
        if (full) imgBig[l] = base + full;
      }
    }
    const en = x.i18n.EN[0];
    if (!groups.has(en)) groups.set(en, 100000 + groups.size);
    const num = parseInt(x.n, 10) || 0;
    const inks = (x.ink.length ? x.ink : ['none']).map((i: string) => i.toLowerCase());
    return {
      key: 'lorcana:' + x.k,
      game: 'lorcana',
      set: x.s,
      setName: set.name,
      num,
      localId: x.n,
      total: set.total,
      numStr: set.total ? x.n + '/' + set.total : x.n,
      names,
      spNames,
      version,
      text,
      type: inks[0],
      inks,
      typeName: CARD_TYPES[x.t] || x.t,
      cardType: x.t,
      subtypes: x.sub,
      rarity: config.rarities[x.r]?.[2] ?? 'X',
      rarityName: x.r,
      variant: x.r === 'Enchanted' || x.r === 'Epic' || x.r === 'Iconic' ? 'fullart' : set.kind === 'promo' ? 'promo' : 'regular',
      category: 0,
      avail,
      sp: groups.get(en)!,
      year: set.year,
      released: set.released,
      illus: x.art.join(', '),
      img,
      imgBig,
      imgAlt: null,
      cost: x.c,
      inkwell: !!x.iw,
      lore: x.l,
      strength: x.st,
      willpower: x.w,
      moveCost: x.mv,
      story: x.story,
      foilTypes: x.foil,
      /** Only printed as foil (Enchanted, Epic, Iconic…): its price is the foil price. */
      foilOnly: !x.foil.includes('None'),
      cardmarketId: x.cm,
      trend: null,
    };
  });
  return { sets, cards };
}
