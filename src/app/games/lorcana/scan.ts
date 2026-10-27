import { CARDS, LANGS } from '../../core/data';
import { nameSim, norm, type CardMatch } from '../../core/text';

/**
 * Recognises a Lorcana card from what the scanner read. Bottom left every card prints its number, the set size or promo
 * series, the language and the set: "12/204 • EN • 5", "205/204 • EN • 1" (Enchanted: above the set size),
 * "8/P1 • EN • 1", "1/31 • EN • Q1". The name and version in the banner confirm it, or decide when the number is
 * unreadable.
 */
export function matchLorcana(text: string, opts: { numText?: string; limit?: number } = {}): CardMatch[] {
  const line = (opts.numText ?? text).toUpperCase().replace(/[|\\]/g, '/').replace(/[•·∙]/g, ' . ');
  const printed = readLine(line);
  const name = norm(text);
  const scored: { id: number; score: number }[] = [];
  const nameScore = (c: any) =>
    name.length >= 3 ? Math.max(...LANGS.filter((l) => c.avail.includes(l)).map((l) => Math.max(nameSim(norm(c.names[l]), name), 0.9 * nameSim(norm(c.spNames[l]), name)))) : 0;
  for (const c of CARDS) {
    let score = 0;
    if (printed) {
      if (c.localId.toUpperCase() !== printed.num) continue;
      // The set when it was read; otherwise the set size (204 is shared by most sets, so the name has to help).
      if (printed.set && c.set.toUpperCase() === printed.set) score = 0.6;
      else if (printed.promo && c.set.toUpperCase() === printed.promo) score = 0.6;
      else if (printed.total && c.total === printed.total) score = 0.3;
      else continue;
      if (printed.lang && c.avail.includes(printed.lang)) score += 0.05;
      score += 0.35 * nameScore(c);
    } else {
      const sim = nameScore(c);
      if (sim < 0.75) continue;
      score = 0.4 * sim;
    }
    scored.push({ id: c.id, score });
  }
  scored.sort((a, b) => b.score - a.score || CARDS[b.id].year - CARDS[a.id].year);
  return scored.slice(0, opts.limit ?? 3).map((s) => ({ id: s.id, conf: Math.round(Math.min(0.99, s.score) * 100) }));
}

interface PrintedLine {
  num: string;
  total: number | null;
  promo: string | null;
  lang: string | null;
  set: string | null;
}

/** "12/204 . EN . 5" (OCR's take on it) → its parts; null without a readable number. */
export function readLine(line: string): PrintedLine | null {
  const m = /(\d{1,3}[A-E]?)\s*\/\s*(P\s?\d|\d{1,3})/.exec(line.replace(/O(?=\d)|(?<=\d)O/g, '0'));
  if (!m) return null;
  const after = line.slice(m.index + m[0].length);
  const lang = /\b(EN|FR|DE|IT|JA|ZH)\b/.exec(after)?.[1] ?? null;
  const set = lang ? (/^\W*(Q\d|\d{1,2})\b/.exec(after.slice(after.indexOf(lang) + 2))?.[1] ?? null) : null;
  const t = m[2].replace(/\s/g, '');
  return { num: m[1], total: /^\d+$/.test(t) ? +t : null, promo: t.startsWith('P') ? t : null, lang, set };
}
