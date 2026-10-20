import { Injectable } from '@angular/core';
import type { Worker } from 'tesseract.js';

/** Card proportions (63 × 88 mm). */
export const CARD_RATIO = 63 / 88;
/** Width the name strip (top) and number strip (bottom) are scaled to before OCR; the collector number is tiny, so it gets more. */
const NAME_W = 1200;
const NUM_W = 1800;

export type CameraError = 'unsupported' | 'denied' | 'failed';

/** Camera access and on-device text recognition (tesseract.js, loaded on first use). */
@Injectable({ providedIn: 'root' })
export class ScannerService {
  private worker?: Promise<Worker>;

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
   * Accounts for the video being shown with object-fit: cover.
   */
  grabGuide(video: HTMLVideoElement, guide: HTMLElement): HTMLCanvasElement | null {
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return null;
    const vr = video.getBoundingClientRect();
    const gr = guide.getBoundingClientRect();
    const scale = Math.max(vr.width / vw, vr.height / vh);
    const ox = (vr.width - vw * scale) / 2;
    const oy = (vr.height - vh * scale) / 2;
    const sx = Math.max(0, (gr.left - vr.left - ox) / scale);
    const sy = Math.max(0, (gr.top - vr.top - oy) / scale);
    const sw = Math.min(vw - sx, gr.width / scale);
    const sh = Math.min(vh - sy, gr.height / scale);
    return toCanvas(video, sx, sy, sw, sh, sw, sh);
  }

  /** Reads the name strip (top) and number strip (bottom) of one card image. */
  async readCard(src: CanvasImageSource, sx = 0, sy = 0, sw?: number, sh?: number): Promise<string> {
    const w = sw ?? (src as HTMLCanvasElement).width;
    const h = sh ?? (src as HTMLCanvasElement).height;
    const worker = await this.getWorker();
    // Each strip is its own canvas: tesseract reads these far better than rectangles of one big image.
    const strip = (top: number, height: number, dw: number) => toCanvas(src, sx, sy + top * h, w, height * h, dw, (dw * height) / CARD_RATIO);
    const name = await worker.recognize(strip(0.02, 0.12, NAME_W));
    const num = await worker.recognize(strip(0.88, 0.12, NUM_W));
    return name.data.text + '\n' + num.data.text;
  }

  /** Reads all text in an image (used for photos where the card position is unknown). */
  async readAll(src: HTMLCanvasElement): Promise<string> {
    const worker = await this.getWorker();
    return (await worker.recognize(src)).data.text;
  }

  /** Draws an image file (from a photo picker) to a canvas, at most `max` pixels on its long side. */
  async fileToCanvas(file: File, max = 3000): Promise<HTMLCanvasElement> {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = toCanvas(bmp, 0, 0, bmp.width, bmp.height, Math.round(bmp.width * k), Math.round(bmp.height * k));
    bmp.close();
    return c;
  }

  private getWorker(): Promise<Worker> {
    // tesseract.js is CommonJS: depending on the bundler its API is on the namespace or on `default`.
    this.worker ??= import('tesseract.js').then(async (m) => {
      const { createWorker, PSM } = ((m as any).default ?? m) as typeof m;
      const w = await createWorker('eng');
      await w.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
      return w;
    });
    // A failed load (e.g. offline) is retried on the next scan.
    this.worker.catch(() => (this.worker = undefined));
    return this.worker;
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
