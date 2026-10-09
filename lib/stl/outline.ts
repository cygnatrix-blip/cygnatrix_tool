/**
 * Silhouettes and holes, expressed as a per-sample mask.
 *
 * Everything cut-out is handled here rather than in the mesh builder, so a
 * heart, an oval, rounded corners and a hanging hole all reach the geometry as
 * the same thing: a grid of in/out flags. The mesh builder then only has to
 * know how to wall off a boundary, whatever shape that boundary happens to be.
 */

import type { Outline, StlOptions } from './types';

/**
 * The classic implicit heart, (x² + y² − 1)³ − x²y³ ≤ 0, which is negative
 * inside the curve. Chosen over a parametric outline because a point-inside
 * test is exactly what a mask needs.
 */
export function insideHeart(x: number, y: number): boolean {
  const a = x * x + y * y - 1;
  return a * a * a - x * x * y * y * y <= 0;
}

/** Maps a 0..1 grid position onto the heart's own extent, with a little air. */
function heartAt(u: number, v: number): boolean {
  const x = (u - 0.5) * 2.6;
  // The curve spans about -1 (bottom point) to 1.25 (top of the lobes).
  const y = 1.25 - v * 2.35;
  return insideHeart(x, y);
}

function roundedAt(u: number, v: number, rx: number, ry: number): boolean {
  // Only the corner quadrants need a radius test; the rest is a plain box.
  const dx = u < rx ? rx - u : u > 1 - rx ? u - (1 - rx) : 0;
  const dy = v < ry ? ry - v : v > 1 - ry ? v - (1 - ry) : 0;
  if (dx === 0 || dy === 0) return true;
  return (dx / rx) ** 2 + (dy / ry) ** 2 <= 1;
}

function ellipseAt(u: number, v: number): boolean {
  const dx = (u - 0.5) * 2;
  const dy = (v - 0.5) * 2;
  return dx * dx + dy * dy <= 1;
}

export interface MaskOptions {
  outline: Outline;
  /** Corner radius as a fraction of each axis, for the rounded outline. */
  cornerFracX: number;
  cornerFracY: number;
  /** Hanging hole, in grid fractions. Radius 0 means no hole. */
  holeRadiusFracX?: number;
  holeRadiusFracY?: number;
  holeCentreU?: number;
  holeCentreV?: number;
}

/**
 * Pure: the in/out flag for every grid sample. Returns undefined when the
 * whole rectangle is kept, so the common case costs nothing and the mesh
 * builder can take its cheaper path.
 */
export function buildMask(width: number, height: number, opts: MaskOptions): Uint8Array | undefined {
  const hasHole = (opts.holeRadiusFracX ?? 0) > 0 && (opts.holeRadiusFracY ?? 0) > 0;
  if (opts.outline === 'rectangle' && !hasHole) return undefined;

  const mask = new Uint8Array(width * height);
  const rx = Math.max(1e-4, Math.min(0.5, opts.cornerFracX));
  const ry = Math.max(1e-4, Math.min(0.5, opts.cornerFracY));

  for (let y = 0; y < height; y += 1) {
    // Sample at the centre of each cell so the silhouette is symmetric.
    const v = height === 1 ? 0.5 : y / (height - 1);
    for (let x = 0; x < width; x += 1) {
      const u = width === 1 ? 0.5 : x / (width - 1);

      let inside: boolean;
      if (opts.outline === 'heart') inside = heartAt(u, v);
      else if (opts.outline === 'ellipse') inside = ellipseAt(u, v);
      else if (opts.outline === 'rounded') inside = roundedAt(u, v, rx, ry);
      else inside = true;

      if (inside && hasHole) {
        const du = (u - (opts.holeCentreU ?? 0.5)) / (opts.holeRadiusFracX ?? 1);
        const dv = (v - (opts.holeCentreV ?? 0.1)) / (opts.holeRadiusFracY ?? 1);
        if (du * du + dv * dv <= 1) inside = false;
      }

      mask[y * width + x] = inside ? 1 : 0;
    }
  }
  return mask;
}

/** Translates the millimetre-denominated options into grid fractions. */
export function maskOptionsFor(opts: StlOptions, widthMM: number, heightMM: number): MaskOptions {
  const holeR = opts.hangingHoleMM / 2;
  return {
    outline: opts.outline,
    cornerFracX: opts.cornerRadiusMM / Math.max(1e-6, widthMM),
    cornerFracY: opts.cornerRadiusMM / Math.max(1e-6, heightMM),
    holeRadiusFracX: holeR / Math.max(1e-6, widthMM),
    holeRadiusFracY: holeR / Math.max(1e-6, heightMM),
    holeCentreU: 0.5,
    holeCentreV: opts.hangingHoleInsetMM / Math.max(1e-6, heightMM),
  };
}

/**
 * Drops samples that are kept but have no kept neighbour. A lone sample would
 * become a loose one-cell island floating beside the model — printable in
 * theory, debris in practice.
 */
export function pruneIsolated(mask: Uint8Array, width: number, height: number): Uint8Array {
  const out = Uint8Array.from(mask);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!mask[y * width + x]) continue;
      const left = x > 0 && mask[y * width + x - 1];
      const right = x < width - 1 && mask[y * width + x + 1];
      const up = y > 0 && mask[(y - 1) * width + x];
      const down = y < height - 1 && mask[(y + 1) * width + x];
      if (!left && !right && !up && !down) out[y * width + x] = 0;
    }
  }
  return out;
}
