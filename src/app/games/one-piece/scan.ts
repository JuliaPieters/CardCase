import { CARDS, LANGS } from '../../core/data';
import { nameSim, norm, type CardMatch } from '../../core/text';

/**
 * Recognises a One Piece card from what the scanner read. Bottom right every card prints its card id ("OP01-120",
 * "ST01-012", "EB01-001", "P-001"); a parallel prints the same id as the regular card, so all prints of the id are
 * offered, the regular one first. The name above it confirms it, or decides when the id is unreadable.
 */
export function matchOnePiece(text: string, opts: { numText?: string; limit?: number } = {}): CardMatch[] {
  const code = readCode(opts.numText ?? '') ?? readCode(text);
  const name = norm(text.split('\n')[0] || text);
  const nameScore = (c: any) => (name.length >= 3 ? Math.max(...LANGS.filter((l) => c.avail.includes(l)).map((l) => nameSim(norm(c.names[l]), name))) : 0);
  const scored: { id: number; score: number }[] = [];
  for (const c of CARDS) {
    let score = 0;
    if (code) {
      if (c.code !== code) continue;
      score = 0.6 + 0.35 * nameScore(c) - (c.parallel ? 0.02 : 0) - (c.reprint ? 0.01 : 0);
    } else {
      const sim = nameScore(c);
      if (sim < 0.8) continue;
      score = 0.4 * sim;
    }
    scored.push({ id: c.id, score });
  }
  scored.sort((a, b) => b.score - a.score || CARDS[b.id].year - CARDS[a.id].year);
  return scored.slice(0, opts.limit ?? 3).map((s) => ({ id: s.id, conf: Math.round(Math.min(0.99, s.score) * 100) }));
}

/** The card id in a line of text, read leniently: "OPO1-12O" → "OP01-120". */
export function readCode(line: string): string | null {
  const m = /\b(OP|ST|EB|PRB|P)\s*([0-9OIl]{0,2})\s*[-–]\s*([0-9OIl]{3})\b/i.exec(line.toUpperCase().replace(/[|]/g, 'I'));
  if (!m) return null;
  const digits = (s: string) => s.replace(/O/g, '0').replace(/[IL]/g, '1');
  return m[1] + digits(m[2]) + '-' + digits(m[3]);
}
