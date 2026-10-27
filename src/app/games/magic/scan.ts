import { CARDS, LANGS } from '../../core/data';
import { nameSim, norm, type CardMatch } from '../../core/text';

/**
 * Recognises a Magic card from what the scanner read. Cards since 2023 print bottom left the collector number and
 * rarity ("0280 C") above the set code and language ("DMU • EN"); older cards often have only the number, or nothing.
 * The name at the top decides when the number is missing or ambiguous.
 */
export function matchMagic(text: string, opts: { numText?: string; limit?: number } = {}): CardMatch[] {
  const line = (opts.numText ?? '').toUpperCase().replace(/[•·∙]/g, ' . ');
  const num = /\b0*(\d{1,4})\s*(?:\/\s*\d{1,4})?\s*[CURMSLTP]?\b/.exec(line)?.[1] ?? null;
  const set = /\b([A-Z0-9]{3,5})\s*\.?\s*(?:EN|DE|FR|IT|ES|JA|PT|RU|KO|ZHS|ZHT)\b/.exec(line)?.[1]?.toLowerCase() ?? null;
  const name = norm(text.split('\n')[0] || text);
  const scored: { id: number; score: number }[] = [];
  for (const c of CARDS) {
    const sim = name.length >= 3 ? nameSim(norm(c.names[LANGS[0]]), name) : 0;
    let score = 0;
    if (num && String(parseInt(c.localId, 10)) === num) {
      if (set && c.set === set) score = 0.6;
      else if (sim >= 0.75) score = 0.25;
      else continue;
      score += 0.39 * sim;
    } else {
      if (sim < 0.8) continue;
      score = 0.4 * sim;
    }
    scored.push({ id: c.id, score });
  }
  scored.sort((a, b) => b.score - a.score || CARDS[b.id].year - CARDS[a.id].year);
  return scored.slice(0, opts.limit ?? 3).map((s) => ({ id: s.id, conf: Math.round(Math.min(0.99, s.score) * 100) }));
}
