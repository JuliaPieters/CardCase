import { Injectable } from '@angular/core';
import type { Worker } from 'tesseract.js';
import { HASH_REGIONS, HASH_SIDE, phash, toGray } from './phash';

/** Card proportions (63 × 88 mm). */
export const CARD_RATIO = 63 / 88;
/** Width the name strip (top) and number strip (bottom) are scaled to before OCR; the collector number is tiny, so it gets more. */
const NAME_W = 1200;
const NUM_W = 1800;

/**
 * Positions tried around the expected card rectangle when hashing, as [scale, dx, dy, angle] (shifts as fractions of
 * the card size, angle in radians): the card rarely sits exactly in the guide or the binder pocket, may be held closer
 * or further away, and a little tilted.
 */
type Crop = readonly [number, number, number, number];
const HASH_CROPS: readonly Crop[] = [
  ...[1, 0.92, 1.08, 0.84, 1.17, 0.76, 1.27, 0.69, 0.62].map((sc): Crop => [sc, 0, 0, 0]),
  ...[1, 0.84].flatMap((sc): Crop[] => [[sc, 0, -0.04, 0], [sc, 0, 0.04, 0], [sc, -0.04, 0, 0], [sc, 0.04, 0, 0]]),
  ...[1, 0.84].flatMap((sc): Crop[] => [-0.11, -0.06, 0.06, 0.11].map((a): Crop => [sc, 0, 0, a])),
];
/** Size a tilted crop is straightened to before hashing its regions. */
const CARD_W = 256;
const CARD_H = Math.round(CARD_W / (63 / 88));

/** A rectangle in source pixels. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type CameraError = 'unsupported' | 'denied' | 'failed';

/** A language choice of the scanner (see GameConfig.scan); decides which OCR models read the name (≈2–3 MB each, downloaded once). */
export type ScanLang = string;

/** Where the name and the collector number are printed, as [top, height] fractions of the card. */
export interface CardStrips {
  name: [number, number];
  number: [number, number];
}
const POKEMON_STRIPS: CardStrips = { name: [0, 0.16], number: [0.86, 0.14] };

/** What was read on a card: all text (for the name), and the bottom strip alone (for the collector number). */
export interface CardText {
  text: string;
  numText: string;
}

/** Camera access and on-device text recognition (tesseract.js, loaded on first use). */
@Injectable({ providedIn: 'root' })
export class ScannerService {
  /** Two OCR workers so the name and the number of a card are read at the same time. */
  private workers: Partial<Record<'name' | 'num', Promise<Worker>>> = {};
  private ocr: string[] = ['eng'];

  /** Switches the name reader to other OCR models; the number reader (digits and Latin letters) stays the same. */
  setLanguage(ocr: string[]) {
    if (ocr.join() === this.ocr.join()) return;
    this.ocr = ocr;
    const old = this.workers.name;
    delete this.workers.name;
    old?.then((w) => w.terminate()).catch(() => {});
  }

  /** Starts downloading the OCR engine (~5 MB the first time, then cached by the browser) before the first frame needs it. */
  warmUp(): Promise<unknown> {
    return Promise.all([this.getWorker('name'), this.getWorker('num')]);
  }

  /** Starts the rear camera in the given video element. Throws a CameraError. */
  async startCamera(video: HTMLVideoElement): Promise<MediaStream> {
    if (!navigator.mediaDevices?.getUserMedia) throw 'unsupported' as CameraError;
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 3840 }, height: { ideal: 2160 } },
      });
    } catch (err) {
      const name = (err as DOMException)?.name;
      throw (name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'failed') as CameraError;
    }
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    await video.play().catch(() => {});
    return stream;
  }

  stopCamera(stream: MediaStream | null | undefined) {
    stream?.getTracks().forEach((t) => t.stop());
  }

  hasTorch(stream: MediaStream | null | undefined): boolean {
    const track = stream?.getVideoTracks()[0];
    return !!(track?.getCapabilities?.() as { torch?: boolean } | undefined)?.torch;
  }

  async setTorch(stream: MediaStream, on: boolean) {
    await stream.getVideoTracks()[0]?.applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] });
  }

  /**
   * The part of the camera image that is under `guide` on screen, as a canvas.
   * Accounts for the video being shown with object-fit: cover. `margin` widens (or, negative, narrows) the area on
   * every side: 0.1 = 10%, for a card held closer than the guide, -0.08 for one held further away.
   */
  grabGuide(video: HTMLVideoElement, guide: HTMLElement, margin = 0): HTMLCanvasElement | null {
    const r = this.guideRect(video, guide);
    if (!r) return null;
    const mx = r.w * margin;
    const my = r.h * margin;
    const sx = Math.max(0, r.x - mx);
    const sy = Math.max(0, r.y - my);
    const sw = Math.min(video.videoWidth - sx, r.w + 2 * mx);
    const sh = Math.min(video.videoHeight - sy, r.h + 2 * my);
    return toCanvas(video, sx, sy, sw, sh, sw, sh);
  }

  /** Where `guide` (on screen) is in the camera image, in video pixels; the video is shown with object-fit: cover. */
  guideRect(video: HTMLVideoElement, guide: HTMLElement): Rect | null {
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return null;
    const vr = video.getBoundingClientRect();
    const g = guide.getBoundingClientRect();
    const scale = Math.max(vr.width / vw, vr.height / vh);
    const ox = (vr.width - vw * scale) / 2;
    const oy = (vr.height - vh * scale) / 2;
    return { x: (g.left - vr.left - ox) / scale, y: (g.top - vr.top - oy) / scale, w: g.width / scale, h: g.height / scale };
  }

  /**
   * Perceptual hashes (see phash.ts) of the card expected at `r` in `src` (of size srcW × srcH), at several positions
   * and sizes around it (HASH_CROPS, or `crops`). HASH_BYTES per variant, for CardHashes.search().
   */
  hashCard(src: CanvasImageSource, srcW: number, srcH: number, r: Rect, crops = HASH_CROPS): Uint32Array {
    const words: number[] = [];
    for (const [s, dx, dy, a] of crops) {
      const w = r.w * s;
      const h = r.h * s;
      const cx = r.x + r.w / 2 + dx * r.w;
      const cy = r.y + r.h / 2 + dy * r.h;
      const x = cx - w / 2;
      const y = cy - h / 2;
      // Skip crops that fall mostly outside the image.
      if (x < -0.05 * w || y < -0.05 * h || x + w > srcW + 0.05 * w || y + h > srcH + 0.05 * h) continue;
      if (!a) {
        for (const [rx, ry, rw, rh] of HASH_REGIONS) words.push(...this.hashRegion(src, x + rx * w, y + ry * h, rw * w, rh * h));
        continue;
      }
      // Tilted: straighten the crop into a card-sized canvas first, then hash its regions from there.
      this.card ??= canvas(CARD_W, CARD_H).getContext('2d')!;
      const ctx = this.card;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.translate(CARD_W / 2, CARD_H / 2);
      ctx.rotate(-a);
      ctx.scale(CARD_W / w, CARD_H / h);
      ctx.translate(-cx, -cy);
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(src, 0, 0);
      for (const [rx, ry, rw, rh] of HASH_REGIONS) words.push(...this.hashRegion(ctx.canvas, rx * CARD_W, ry * CARD_H, rw * CARD_W, rh * CARD_H));
    }
    return Uint32Array.from(words);
  }

  private card?: CanvasRenderingContext2D;

  private c64?: CanvasRenderingContext2D;
  private c32?: CanvasRenderingContext2D;

  /** Same steps as hashImage() in scripts/sync-hashes.mjs: scale to 64², then 32², grayscale, DCT hash. */
  private hashRegion(src: CanvasImageSource, x: number, y: number, w: number, h: number): [number, number] {
    this.c64 ??= canvas(HASH_SIDE * 2).getContext('2d')!;
    this.c32 ??= canvas(HASH_SIDE).getContext('2d', { willReadFrequently: true })!;
    this.c64.imageSmoothingQuality = 'high';
    this.c64.drawImage(src, x, y, w, h, 0, 0, HASH_SIDE * 2, HASH_SIDE * 2);
    this.c32.imageSmoothingQuality = 'high';
    this.c32.drawImage(this.c64.canvas, 0, 0, HASH_SIDE, HASH_SIDE);
    return phash(toGray(this.c32.getImageData(0, 0, HASH_SIDE, HASH_SIDE).data, 4));
  }

  /** Reads the name strip (top) and number strip (bottom) of one card image; pass the result to matchCards as text + numText. */
  async readCard(src: CanvasImageSource, sx = 0, sy = 0, sw?: number, sh?: number, strips: CardStrips = POKEMON_STRIPS): Promise<CardText> {
    const w = sw ?? (src as HTMLCanvasElement).width;
    const h = sh ?? (src as HTMLCanvasElement).height;
    // Each strip is its own canvas: tesseract reads these far better than rectangles of one big image. Narrow strips read
    // best (taller ones pull in HP and artwork), so position tolerance comes from the caller trying several crops.
    // Upscaling a small camera crop beyond ~3× adds no detail, only work.
    const strip = (top: number, height: number, target: number) => {
      const dw = Math.min(target, w * 3);
      return toCanvas(src, sx, sy + top * h, w, height * h, dw, (dw * height * h) / w);
    };
    const [name, num] = await Promise.all([
      this.getWorker('name').then((wk) => wk.recognize(strip(...strips.name, NAME_W))),
      this.getWorker('num').then((wk) => wk.recognize(strip(...strips.number, NUM_W))),
    ]);
    return { text: name.data.text + '\n' + num.data.text, numText: num.data.text };
  }

  /** Reads all text in an image (used for photos where the card position is unknown). */
  async readAll(src: HTMLCanvasElement): Promise<string> {
    return (await (await this.getWorker('name')).recognize(src)).data.text;
  }

  /** Draws an image file (from a photo picker) to a canvas, at most `max` pixels on its long side. */
  async fileToCanvas(file: File, max = 3000): Promise<HTMLCanvasElement> {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = toCanvas(bmp, 0, 0, bmp.width, bmp.height, Math.round(bmp.width * k), Math.round(bmp.height * k));
    bmp.close();
    return c;
  }

  private getWorker(kind: 'name' | 'num'): Promise<Worker> {
    let w = this.workers[kind];
    if (!w) {
      // tesseract.js is CommonJS: depending on the bundler its API is on the namespace or on `default`.
      w = this.workers[kind] = import('tesseract.js').then(async (m) => {
        const { createWorker, PSM } = ((m as any).default ?? m) as typeof m;
        const worker = await createWorker(kind === 'num' ? 'eng' : this.ocr);
        await worker.setParameters({
          tessedit_pageseg_mode: PSM.SPARSE_TEXT,
          // The number strip only holds collector numbers ("025/198", "TG05/TG30"), set codes ("SV2a") and language codes.
          ...(kind === 'num' ? { tessedit_char_whitelist: '0123456789/ ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz' } : {}),
        });
        return worker;
      });
      // A failed load (e.g. offline) is retried on the next scan.
      const cur = w;
      w.catch(() => this.workers[kind] === cur && delete this.workers[kind]);
    }
    return w;
  }
}

function canvas(w: number, h = w): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/** Copies a region of `src` into a new canvas of dw × dh. */
function toCanvas(src: CanvasImageSource, sx: number, sy: number, sw: number, sh: number, dw: number, dh: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(dw));
  c.height = Math.max(1, Math.round(dh));
  const ctx = c.getContext('2d')!;
  ctx.drawImage(src, sx, sy, sw, sh, 0, 0, c.width, c.height);
  return c;
}
