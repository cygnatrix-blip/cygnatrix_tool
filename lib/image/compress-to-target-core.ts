/**
 * The exact-size compression algorithm, encoder-agnostic. This file has no
 * canvas/DOM/Worker dependency — `encode` is injected — so the search logic
 * itself is fully unit-testable in Node with a fake encoder, independent of
 * whatever real image codec ends up producing the bytes (see
 * compress-to-target.ts for the real canvas/OffscreenCanvas wiring, and
 * compress-to-target.worker.ts for the Web Worker that runs it off the main
 * thread).
 */

export interface EncodeResult {
  bytes: number;
  blob: Blob;
}

export type Encoder = (quality: number, width: number, height: number) => Promise<EncodeResult>;

export interface CompressToTargetOptions {
  targetBytes: number;
  /** Optional floor — many forms require e.g. 20-50 KB. Default: no floor. */
  minBytes?: number;
  originalWidth: number;
  originalHeight: number;
  /** Default [0.05, 0.98] per spec. */
  qualityRange?: [number, number];
  /** Iterations per binary search. ~8 converges to a fraction of a percent. */
  maxIterations?: number;
  /** Cap on downscale attempts before giving up gracefully. */
  maxDownscaleRounds?: number;
  /** Multiplier applied to width/height each round a target can't be hit by quality alone. */
  downscaleFactor?: number;
  /** Called after every single encode — useful for a progress bar. */
  onProgress?: (attempt: number, maxAttempts: number) => void;
}

export interface CompressToTargetResult {
  blob: Blob;
  finalQuality: number;
  finalWidth: number;
  finalHeight: number;
  finalBytes: number;
  iterations: number;
  downscaleRounds: number;
  originalWidth: number;
  originalHeight: number;
  /** True only if finalBytes is within [minBytes, targetBytes]. */
  metTarget: boolean;
  summary: string;
}

const DEFAULT_QUALITY_RANGE: [number, number] = [0.05, 0.98];
const DEFAULT_MAX_ITERATIONS = 8;
const DEFAULT_MAX_DOWNSCALE_ROUNDS = 6;
const DEFAULT_DOWNSCALE_FACTOR = 0.9;
const MIN_DIMENSION = 16;

interface Candidate {
  bytes: number;
  blob: Blob;
  quality: number;
  width: number;
  height: number;
}

async function binarySearchQuality(
  encode: Encoder,
  width: number,
  height: number,
  targetBytes: number,
  qualityRange: [number, number],
  maxIterations: number,
  onAttempt: () => void,
): Promise<Candidate | null> {
  let lo = qualityRange[0];
  let hi = qualityRange[1];
  let best: Candidate | null = null;

  for (let i = 0; i < maxIterations; i += 1) {
    const quality = (lo + hi) / 2;
    const { bytes, blob } = await encode(quality, width, height);
    onAttempt();

    if (bytes <= targetBytes) {
      // A valid candidate — keep the one closest to (largest under) the target.
      if (!best || bytes > best.bytes) best = { bytes, blob, quality, width, height };
      lo = quality; // room to try a higher quality (bigger, closer to target)
    } else {
      hi = quality; // too big — back off
    }
  }
  return best;
}

/**
 * Refine quality upward from `from` to push size toward — but never past —
 * targetBytes. Used to "pad back up" when a result landed under the minimum.
 */
async function refineUpward(
  encode: Encoder,
  width: number,
  height: number,
  targetBytes: number,
  from: number,
  ceiling: number,
  maxIterations: number,
  onAttempt: () => void,
): Promise<Candidate | null> {
  let lo = from;
  let hi = ceiling;
  let best: Candidate | null = null;

  for (let i = 0; i < maxIterations; i += 1) {
    const quality = (lo + hi) / 2;
    const { bytes, blob } = await encode(quality, width, height);
    onAttempt();
    if (bytes <= targetBytes) {
      if (!best || bytes > best.bytes) best = { bytes, blob, quality, width, height };
      lo = quality;
    } else {
      hi = quality;
    }
  }
  return best;
}

function buildSummary(width: number, height: number, r: Candidate, originalWidth: number, originalHeight: number): string {
  const dims =
    width === originalWidth && height === originalHeight
      ? `${width}×${height}`
      : `${originalWidth}×${originalHeight} → ${width}×${height}`;
  const kb = r.bytes >= 1024 ? `${Math.round(r.bytes / 1024)} KB` : `${r.bytes} B`;
  return `${dims}, quality ${Math.round(r.quality * 100)}%, ${kb}`;
}

export async function compressToTarget(
  encode: Encoder,
  opts: CompressToTargetOptions,
): Promise<CompressToTargetResult> {
  const qualityRange = opts.qualityRange ?? DEFAULT_QUALITY_RANGE;
  const maxIterations = opts.maxIterations ?? DEFAULT_MAX_ITERATIONS;
  const maxDownscaleRounds = opts.maxDownscaleRounds ?? DEFAULT_MAX_DOWNSCALE_ROUNDS;
  const downscaleFactor = opts.downscaleFactor ?? DEFAULT_DOWNSCALE_FACTOR;
  const minBytes = opts.minBytes ?? 0;

  if (opts.targetBytes <= 0) throw new Error('Target size must be greater than zero.');
  if (minBytes > opts.targetBytes) {
    throw new Error('The minimum size cannot be larger than the target size.');
  }

  let width = opts.originalWidth;
  let height = opts.originalHeight;
  let totalIterations = 0;
  let downscaleRounds = 0;
  let best: Candidate | null = null;

  const tick = () => {
    totalIterations += 1;
    opts.onProgress?.(totalIterations, maxIterations * (maxDownscaleRounds + 1) * 2);
  };

  for (let round = 0; round <= maxDownscaleRounds; round += 1) {
    const candidate = await binarySearchQuality(encode, width, height, opts.targetBytes, qualityRange, maxIterations, tick);
    if (candidate) {
      best = candidate;
      break; // hit the target at this size — stop downscaling
    }
    if (round === maxDownscaleRounds) break; // out of attempts — stop, don't shrink further
    // Even the lowest quality at this size exceeds the target — shrink and retry.
    downscaleRounds += 1;
    width = Math.max(MIN_DIMENSION, Math.round(width * downscaleFactor));
    height = Math.max(MIN_DIMENSION, Math.round(height * downscaleFactor));
    if (width <= MIN_DIMENSION && height <= MIN_DIMENSION) break;
  }

  if (!best) {
    // Graceful failure: return the smallest achievable result at the lowest
    // quality and smallest size we tried, rather than throwing. The caller
    // decides how to present "we couldn't quite hit that target" to the user.
    const { bytes, blob } = await encode(qualityRange[0], width, height);
    best = { bytes, blob, quality: qualityRange[0], width, height };
  } else if (best.bytes < minBytes) {
    // Under the floor — pad quality back up as far as possible without
    // crossing the target ceiling.
    const padded = await refineUpward(
      encode,
      best.width,
      best.height,
      opts.targetBytes,
      best.quality,
      qualityRange[1],
      maxIterations,
      tick,
    );
    if (padded && padded.bytes > best.bytes) best = padded;
  }

  return {
    blob: best.blob,
    finalQuality: best.quality,
    finalWidth: best.width,
    finalHeight: best.height,
    finalBytes: best.bytes,
    iterations: totalIterations,
    downscaleRounds,
    originalWidth: opts.originalWidth,
    originalHeight: opts.originalHeight,
    metTarget: best.bytes <= opts.targetBytes && best.bytes >= minBytes,
    summary: buildSummary(best.width, best.height, best, opts.originalWidth, opts.originalHeight),
  };
}
