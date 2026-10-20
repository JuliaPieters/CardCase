import { Injectable } from '@angular/core';
import type { Worker } from 'tesseract.js';

/** Card proportions (63 × 88 mm). */
export const CARD_RATIO = 63 / 88;
/** Width the name strip (top) and number strip (bottom) are scaled to before OCR; the collector number is tiny, so it gets more. */
const NAME_W = 1200;
const NUM_W = 1800;

export type CameraError = 'unsupported' | 'denied' | 'failed';

/** Language of the cards being scanned; decides which OCR model reads the name (≈2–3 MB each, downloaded once). */
export type ScanLang = 'EN' | 'JA' | 'ZH';
const OCR_LANGS: Record<ScanLang, string[]> = { EN: ['eng'], JA: ['jpn'], ZH: ['chi_tra', 'chi_sim'] };

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
  private lang: ScanLang = 'EN';

  /** Switches the name reader to another card language; the number reader (digits and Latin letters) stays the same. */
  setLanguage(lang: ScanLang) {
    if (lang === this.lang) return;
    this.lang = lang;
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
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return null;
    const vr = video.getBoundingClientRect();
    const g = guide.getBoundingClientRect();
    const mx = g.width * margin;
    const my = g.height * margin;
    const gr = { left: g.left - mx, top: g.top - my, width: g.width + 2 * mx, height: g.height + 2 * my };
    const scale = Math.max(vr.width / vw, vr.height / vh);
    const ox = (vr.width - vw * scale) / 2;
    const oy = (vr.height - vh * scale) / 2;
    const sx = Math.max(0, (gr.left - vr.left - ox) / scale);
    const sy = Math.max(0, (gr.top - vr.top - oy) / scale);
    const sw = Math.min(vw - sx, gr.width / scale);
    const sh = Math.min(vh - sy, gr.height / scale);
    return toCanvas(video, sx, sy, sw, sh, sw, sh);
  }

  /** Reads the name strip (top) and number strip (bottom) of one card image; pass the result to matchCards as text + numText. */
  async readCard(src: CanvasImageSource, sx = 0, sy = 0, sw?: number, sh?: number): Promise<CardText> {
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
      this.getWorker('name').then((wk) => wk.recognize(strip(0, 0.16, NAME_W))),
      this.getWorker('num').then((wk) => wk.recognize(strip(0.86, 0.14, NUM_W))),
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
        const worker = await createWorker(kind === 'num' ? 'eng' : OCR_LANGS[this.lang]);
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

/** Copies a region of `src` into a new canvas of dw × dh. */
function toCanvas(src: CanvasImageSource, sx: number, sy: number, sw: number, sh: number, dw: number, dh: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(dw));
  c.height = Math.max(1, Math.round(dh));
  const ctx = c.getContext('2d')!;
  ctx.drawImage(src, sx, sy, sw, sh, 0, 0, c.width, c.height);
  return c;
}
