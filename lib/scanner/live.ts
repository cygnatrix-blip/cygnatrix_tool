'use client';

import type { DetectResult } from './detect';

/**
 * Thin wrapper around the detection worker: send an RGBA frame, get back the
 * document quad (or null). Only the most recent request matters for a live
 * preview, so callers can fire-and-forget and ignore stale resolves.
 */
export interface LiveDetector {
  detect(rgba: ArrayBuffer, width: number, height: number): Promise<DetectResult | null>;
  close(): void;
}

export function createLiveDetector(): LiveDetector {
  const worker = new Worker('/workers/scanner-detect.js');
  let seq = 0;
  const pending = new Map<number, (r: DetectResult | null) => void>();

  worker.onmessage = (e: MessageEvent<{ id: number; result: DetectResult | null }>) => {
    const cb = pending.get(e.data.id);
    if (cb) {
      pending.delete(e.data.id);
      cb(e.data.result);
    }
  };
  worker.onerror = () => {
    pending.forEach((cb) => cb(null));
    pending.clear();
  };

  return {
    detect(rgba, width, height) {
      const id = (seq += 1);
      return new Promise((resolve) => {
        pending.set(id, resolve);
        worker.postMessage({ id, rgba, width, height }, [rgba]);
      });
    },
    close() {
      worker.terminate();
      pending.clear();
    },
  };
}
