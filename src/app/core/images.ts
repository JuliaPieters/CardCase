import { signal } from '@angular/core';

/**
 * Images the user uploaded for their binders. A binder refers to one by its fill 'img:<id>'; the picture itself is a
 * JPEG data URL kept in this browser (IndexedDB) and, for an account, in its own Firestore document
 * (users/{uid}/images/{id}), since a binder document can't hold pictures (Firestore documents max out at 1 MB).
 */
export interface StoredImage {
  id: string;
  name: string;
  data: string;
  added: number;
}

/** Loaded pictures by id; read by `resolveFill`, so pages redraw when a picture arrives. */
export const IMG_DATA = signal<Record<string, string>>({});

export const isImgRef = (fill: unknown): fill is string => typeof fill === 'string' && fill.startsWith('img:');

/** CSS background for a fill: uploaded pictures by reference, anything else as it is ('none' until a picture loads). */
export function resolveFill(fill: string): string {
  if (!isImgRef(fill)) return fill;
  const data = IMG_DATA()[fill.slice(4)];
  return data ? `url("${data}")` : 'none';
}

export function rememberImage(id: string, data: string) {
  IMG_DATA.update((m) => (m[id] === data ? m : { ...m, [id]: data }));
}

/** Data URLs stay well under Firestore's 1 MB per document. */
const MAX_DATA = 700_000;

/** Scales a picture down (long side at most 1400 px, plenty for a few pockets) and encodes it as JPEG. */
export async function compressImage(file: Blob): Promise<string> {
  const bmp = await createImageBitmap(file);
  for (const [side, quality] of [[1400, 0.85], [1100, 0.8], [900, 0.72], [700, 0.65]] as const) {
    const k = Math.min(1, side / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * k);
    canvas.height = Math.round(bmp.height * k);
    const ctx = canvas.getContext('2d')!;
    // JPEG has no transparency: transparent parts become white rather than black.
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const data = canvas.toDataURL('image/jpeg', quality);
    if (data.length <= MAX_DATA || side === 700) return data;
  }
  throw new Error('unreachable');
}

// IndexedDB: localStorage is too small for pictures.
const DB = 'cardcase';
const STORE = 'images';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function putLocalImage(img: StoredImage): Promise<void> {
  try {
    const db = await open();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(img);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[images] lokaal opslaan mislukt', err);
  }
}

/** Every picture kept in this browser, oldest first; they're registered in `IMG_DATA` too. */
export async function loadLocalImages(): Promise<StoredImage[]> {
  try {
    const db = await open();
    const all = await new Promise<StoredImage[]>((resolve, reject) => {
      const req = db.transaction(STORE).objectStore(STORE).getAll();
      req.onsuccess = () => resolve(req.result as StoredImage[]);
      req.onerror = () => reject(req.error);
    });
    IMG_DATA.update((m) => ({ ...m, ...Object.fromEntries(all.map((i) => [i.id, i.data])) }));
    return all.sort((a, b) => a.added - b.added);
  } catch (err) {
    console.warn('[images] lokaal laden mislukt', err);
    return [];
  }
}

/** Ids of the uploaded pictures a set of binders uses. */
export function imageRefs(binders: any[]): string[] {
  const ids = new Set<string>();
  for (const b of binders || []) {
    const d = b.deco || {};
    for (const im of d.images || []) if (isImgRef(im.fill)) ids.add(im.fill.slice(4));
    for (const bg of Object.values(d.bg || {}) as any[]) if (bg && isImgRef(bg.fill)) ids.add(bg.fill.slice(4));
  }
  return [...ids];
}
