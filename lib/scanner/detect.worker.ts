/// <reference lib="webworker" />

/**
 * Runs {@link detectDocument} off the main thread so the live camera preview
 * stays smooth. Bundled to `public/workers/scanner-detect.js` by
 * `scripts/build-worker.mjs` (predev / prebuild).
 */

import { detectDocument } from './detect';

interface Req {
  id: number;
  rgba: ArrayBuffer;
  width: number;
  height: number;
}

self.onmessage = (e: MessageEvent<Req>) => {
  const { id, rgba, width, height } = e.data;
  let result = null;
  try {
    result = detectDocument(new Uint8ClampedArray(rgba), width, height);
  } catch {
    result = null;
  }
  (self as unknown as Worker).postMessage({ id, result });
};
