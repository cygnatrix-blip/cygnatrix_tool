'use client';

import { decodeImage } from './canvas';
import type { CompressToTargetResult } from './compress-to-target-core';
import type { WorkerRequest, WorkerResponse } from './compress-to-target.worker';

export type { CompressToTargetResult } from './compress-to-target-core';

export interface CompressToTargetJobOptions {
  targetBytes: number;
  minBytes?: number;
  mime: 'image/jpeg' | 'image/webp';
  onProgress?: (fraction: number) => void;
}

let nextId = 1;

/**
 * Compress `file` to hit `targetBytes` (and, optionally, stay above `minBytes`)
 * exactly — no quality slider, no guessing. Runs the binary-search/downscale
 * engine in a Web Worker with OffscreenCanvas so the tab never freezes, even
 * on a large photo.
 */
export function compressToTargetSize(file: Blob, opts: CompressToTargetJobOptions): Promise<CompressToTargetResult> {
  return new Promise((resolve, reject) => {
    (async () => {
      const decoded = await decodeImage(file);
      // Precompiled by scripts/build-worker.mjs (predev/prebuild) — see that
      // file for why this isn't `new Worker(new URL('./…worker.ts', …))`.
      const worker = new Worker('/workers/compress-to-target.js');
      const id = nextId++;

      worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const msg = e.data;
        if (msg.id !== id) return;
        if (msg.type === 'progress') {
          opts.onProgress?.(Math.min(1, msg.attempt / Math.max(1, msg.maxAttempts)));
        } else if (msg.type === 'done') {
          worker.terminate();
          resolve(msg.result);
        } else if (msg.type === 'error') {
          worker.terminate();
          reject(new Error(msg.message));
        }
      };
      worker.onerror = (e) => {
        worker.terminate();
        reject(new Error(e.message || 'Compression failed in the background worker.'));
      };

      const request: WorkerRequest = {
        id,
        bitmap: decoded.bitmap,
        mime: opts.mime,
        targetBytes: opts.targetBytes,
        minBytes: opts.minBytes,
      };
      worker.postMessage(request, [decoded.bitmap]);
    })().catch(reject);
  });
}

/** Quick-pick target sizes shown as chips in the UI, per spec. */
export const TARGET_SIZE_PRESETS: { label: string; bytes: number }[] = [
  { label: '20 KB', bytes: 20 * 1024 },
  { label: '50 KB', bytes: 50 * 1024 },
  { label: '100 KB', bytes: 100 * 1024 },
  { label: '200 KB', bytes: 200 * 1024 },
  { label: '500 KB', bytes: 500 * 1024 },
  { label: '1 MB', bytes: 1024 * 1024 },
];
