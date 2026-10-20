// Perceptual hash of card images, shared by the app (camera frames) and scripts/sync-hashes.mjs (catalog photos),
// so both sides compute exactly the same thing. No imports: Node runs this file directly.

/** Side of the grayscale square an image region is scaled to before hashing. */
export const HASH_SIDE = 32;
/** Bytes per card in public/card-hashes.bin: one 64-bit hash per region below. */
export const HASH_BYTES = 16;
/**
 * Regions of a card that are hashed, as [x, y, width, height] fractions: the whole card, and the artwork box
 * (where cards differ most; in full-art cards it is simply part of the art).
 */
export const HASH_REGIONS: readonly (readonly [number, number, number, number])[] = [
  [0, 0, 1, 1],
  [0.08, 0.1, 0.84, 0.42],
];

const COS: Float64Array[] = Array.from({ length: 8 }, (_, u) =>
  Float64Array.from({ length: HASH_SIDE }, (_, x) => Math.cos(((2 * x + 1) * u * Math.PI) / (2 * HASH_SIDE))),
);

/** Luminance (0–255) of HASH_SIDE² RGB(A) pixels. `channels` is 3 for RGB, 4 for RGBA. */
export function toGray(pixels: ArrayLike<number>, channels: number): Float64Array {
  const n = HASH_SIDE * HASH_SIDE;
  const g = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const p = i * channels;
    g[i] = 0.299 * pixels[p] + 0.587 * pixels[p + 1] + 0.114 * pixels[p + 2];
  }
  return g;
}

/**
 * 64-bit DCT hash of a HASH_SIDE² grayscale image, as two uint32 words: one bit per low-frequency coefficient,
 * set when it is above the median. Robust to brightness, contrast, blur and small shifts.
 */
export function phash(gray: Float64Array): [number, number] {
  const coef = new Float64Array(64);
  for (let v = 0; v < 8; v++) {
    for (let u = 0; u < 8; u++) {
      let sum = 0;
      for (let y = 0; y < HASH_SIDE; y++) {
        const cy = COS[v][y];
        const row = y * HASH_SIDE;
        for (let x = 0; x < HASH_SIDE; x++) sum += gray[row + x] * COS[u][x] * cy;
      }
      coef[v * 8 + u] = sum;
    }
  }
  // The DC term (overall brightness) is left out of the median.
  const median = Array.from(coef.subarray(1)).sort((a, b) => a - b)[31];
  let lo = 0;
  let hi = 0;
  for (let i = 0; i < 64; i++) {
    if (coef[i] > median) {
      if (i < 32) lo |= 1 << i;
      else hi |= 1 << (i - 32);
    }
  }
  return [lo >>> 0, hi >>> 0];
}

/** Number of differing bits between two hashes of HASH_BYTES (as uint32 words at offsets a and b). */
export function distance(x: Uint32Array, a: number, y: Uint32Array, b: number): number {
  let d = 0;
  for (let k = 0; k < HASH_BYTES / 4; k++) d += popcount(x[a + k] ^ y[b + k]);
  return d;
}

function popcount(v: number): number {
  v -= (v >>> 1) & 0x55555555;
  v = (v & 0x33333333) + ((v >>> 2) & 0x33333333);
  return (((v + (v >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
}
