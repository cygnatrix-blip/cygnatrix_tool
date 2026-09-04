/**
 * Runs the exact-size compression search off the main thread using
 * OffscreenCanvas, so a large photo never freezes the tab. Bundled
 * automatically by Next/webpack via `new Worker(new URL(...))` — see
 * compress-to-target.ts for how the main thread talks to this file.
 */
import { compressToTarget, type CompressToTargetResult, type Encoder } from './compress-to-target-core';

export interface WorkerRequest {
  id: number;
  bitmap: ImageBitmap;
  mime: 'image/jpeg' | 'image/webp';
  targetBytes: number;
  minBytes?: number;
  qualityRange?: [number, number];
  maxIterations?: number;
  maxDownscaleRounds?: number;
  downscaleFactor?: number;
}

export type WorkerResponse =
  | { id: number; type: 'progress'; attempt: number; maxAttempts: number }
  | { id: number; type: 'done'; result: CompressToTargetResult }
  | { id: number; type: 'error'; message: string };

function makeEncoder(bitmap: ImageBitmap, mime: string): Encoder {
  return async (quality, width, height) => {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('OffscreenCanvas 2D context is not available.');
    if (mime === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob = await canvas.convertToBlob({ type: mime, quality });
    return { bytes: blob.size, blob };
  };
}

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const req = e.data;
  try {
    const encode = makeEncoder(req.bitmap, req.mime);
    const result = await compressToTarget(encode, {
      targetBytes: req.targetBytes,
      minBytes: req.minBytes,
      originalWidth: req.bitmap.width,
      originalHeight: req.bitmap.height,
      qualityRange: req.qualityRange,
      maxIterations: req.maxIterations,
      maxDownscaleRounds: req.maxDownscaleRounds,
      downscaleFactor: req.downscaleFactor,
      onProgress: (attempt, maxAttempts) => {
        const msg: WorkerResponse = { id: req.id, type: 'progress', attempt, maxAttempts };
        (self as unknown as Worker).postMessage(msg);
      },
    });
    req.bitmap.close();
    const msg: WorkerResponse = { id: req.id, type: 'done', result };
    (self as unknown as Worker).postMessage(msg);
  } catch (err) {
    const msg: WorkerResponse = {
      id: req.id,
      type: 'error',
      message: err instanceof Error ? err.message : 'Compression failed.',
    };
    (self as unknown as Worker).postMessage(msg);
  }
};
