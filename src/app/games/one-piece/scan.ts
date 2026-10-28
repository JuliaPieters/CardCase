import { CARDS, LANGS } from '../../core/data';
import { nameSim, norm, type CardMatch } from '../../core/text';

/**
 * Recognises a One Piece card from what the scanner read. Bottom right every card prints its card id ("OP01-120",
 * "ST01-012", "EB01-001", "P-001"); a parallel prints the same id as the regular card, so all prints of the id are
 * offered, the regular one first. The name above it confirms it, or decides when the id is unreadable.
 */
export function matchOnePiece(text: string, opts: { numText?: string; limit?: number } = {}): CardMatch[] {
  const known = knownCodes();
  const code = readCode(opts.numText ?? '', known) ?? readCode(text, known);
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

let codes: { cards: any[]; set: Set<string> } | null = null;
/** The card ids of the loaded catalog (built once per catalog). */
function knownCodes(): Set<string> {
  if (codes?.cards !== CARDS) codes = { cards: CARDS, set: new Set(CARDS.map((c) => c.code).filter(Boolean)) };
  return codes.set;
}

/** Letters OCR takes for a digit, and digits it takes for a letter of the set code. */
const DIGIT: Record<string, string> = { O: '0', D: '0', Q: '0', I: '1', L: '1', '|': '1', S: '5', B: '8', Z: '2' };
const PREFIX: Record<string, string> = { '0P': 'OP', OP: 'OP', ST: 'ST', S7: 'ST', '5T': 'ST', EB: 'EB', E8: 'EB', '£8': 'EB', '€8': 'EB', PRB: 'PRB', P: 'P' };

/**
 * The card id in a line of text, read leniently: OCR mixes up O and 0, drops the dash ("STO1012" → "ST01-012") and runs
 * the rarity icon into the number ("0PO1-12063" → "OP01-120"). With `known`, the first reading that is a real card id;
 * without, the first reading.
 */
export function readCode(line: string, known?: Set<string>): string | null {
  const t = line.toUpperCase();
  const re = /(0P|OP|PRB|ST|S7|5T|EB|E8|£8|€8|P)\s*([0-9OIL|SDQ]{2})?\s*[-–—~_.:]?\s*([0-9OIL|SDQBZ]{3})/g;
  const digits = (s: string) => s.replace(/[OIL|SDQBZ]/g, (ch) => DIGIT[ch] ?? ch);
  let first: string | null = null;
  for (let m = re.exec(t); m; m = re.exec(t)) {
    re.lastIndex = m.index + 1;
    const prefix = PREFIX[m[1]];
    const set = m[2] ? digits(m[2]) : '';
    // Only promos ("P-001") have no set number.
    if (!/^\d*$/.test(set) || (!set && prefix !== 'P') || (set && prefix === 'P')) continue;
    const code = prefix + set + '-' + digits(m[3]);
    if (!/-\d{3}$/.test(code)) continue;
    if (!known || known.has(code)) return code;
    first ??= code;
  }
  return known ? null : first;
}
