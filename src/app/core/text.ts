/** Text helpers for matching what the scanner read against card names, shared by every department's matcher. */

/** One candidate card for scanned text; `conf` is 0–99. */
export interface CardMatch {
  id: number;
  conf: number;
}

/** Lowercase letters (any script) and digits only, accents and kana voicing marks removed, full-width folded. */
export function norm(s: string): string {
  return (s || '')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '');
}

/** How well `name` occurs somewhere in `text` (1 = exact substring), via the fuzzy substring edit distance. */
export function nameSim(name: string, text: string): number {
  const m = name.length;
  if (m < 3 || !text) return 0;
  if (text.includes(name)) return 1;
  let prev = new Array(text.length + 1).fill(0);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= text.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (name[i - 1] === text[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  const d = Math.min(...prev);
  // Short names need an exact hit: one typo in "Mew" is a different word.
  if (m < 5 && d > 0) return 0;
  return Math.max(0, 1 - d / m);
}
