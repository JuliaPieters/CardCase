import { distance, HASH_SIDE, phash } from './phash';

/** A HASH_SIDE² grayscale test image from a function of (x, y). */
const image = (f: (x: number, y: number) => number) => Float64Array.from({ length: HASH_SIDE * HASH_SIDE }, (_, i) => f(i % HASH_SIDE, Math.floor(i / HASH_SIDE)));
const words = (...hs: [number, number][]) => Uint32Array.from(hs.flat());

describe('phash', () => {
  const blob = (x: number, y: number) => 255 * Math.exp(-((x - 10) ** 2 + (y - 12) ** 2) / 40);
  const stripes = (x: number) => (Math.floor(x / 4) % 2) * 255;

  it('barely changes with brightness, contrast and noise', () => {
    const a = phash(image(blob));
    const b = phash(image((x, y) => 20 + 0.7 * blob(x, y) + ((x * 7 + y * 13) % 5)));
    expect(distance(words(a, a), 0, words(b, b), 0)).toBeLessThan(8);
  });

  it('tells different images apart', () => {
    const a = phash(image(blob));
    const b = phash(image(stripes));
    expect(distance(words(a, a), 0, words(b, b), 0)).toBeGreaterThan(30);
  });

  it('counts differing bits', () => {
    expect(distance(Uint32Array.of(0, 0, 0, 0), 0, Uint32Array.of(1, 3, 0xffffffff, 0), 0)).toBe(35);
  });
});
