/**
 * Automatic document-boundary detection. Pure typed-array code so it runs in the
 * detection Web Worker (real-time preview) and on the main thread (full-res
 * capture), and can be unit-tested with synthetic images.
 *
 * Strategy — tuned for "the page fills most of the frame", which is what the
 * scanner UI asks the user to do: downscale → Sobel gradients → from each side
 * of the frame, scan inward for the first strong edge pixel per row/column →
 * RANSAC-fit a line to each of the four edges → intersect the lines for the four
 * corners. Robust to a busy page interior and to a few stray edge hits; falls
 * back to `null` (→ the UI shows draggable corners at a default inset).
 */

import { gaussianBlur, sobel, toGray, type Gradient } from './edges';
import { isConvexQuad, orderQuad, polyArea, type Pt, type Quad } from './geometry';

export interface DetectResult {
  /** Corners in ORIGINAL image pixels, clockwise [TL, TR, BR, BL]. */
  quad: Quad;
  /** 0..1 confidence from edge support and coverage. */
  score: number;
}

const PROC_MAX = 480;
type Side = 'left' | 'right' | 'top' | 'bottom';

export function detectDocument(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
): DetectResult | null {
  const scale = Math.min(1, PROC_MAX / Math.max(width, height));
  const pw = Math.max(16, Math.round(width * scale));
  const ph = Math.max(16, Math.round(height * scale));
  const small = downscale(rgba, width, height, pw, ph);
  const grad = sobel(gaussianBlur(toGray(small, pw, ph), 1.6));

  let sum = 0;
  for (let i = 0; i < grad.mag.length; i += 1) sum += grad.mag[i]!;
  const threshold = Math.max(24, (sum / grad.mag.length) * 2.4);

  const lines: Record<Side, Line | null> = {
    left: fitEdge(grad, 'left', threshold),
    right: fitEdge(grad, 'right', threshold),
    top: fitEdge(grad, 'top', threshold),
    bottom: fitEdge(grad, 'bottom', threshold),
  };
  if (!lines.left || !lines.right || !lines.top || !lines.bottom) return null;

  const tl = intersect(lines.left, lines.top);
  const tr = intersect(lines.right, lines.top);
  const br = intersect(lines.right, lines.bottom);
  const bl = intersect(lines.left, lines.bottom);
  if (!tl || !tr || !br || !bl) return null;

  const margin = { x: pw * 0.06, y: ph * 0.06 };
  const poly = [tl, tr, br, bl];
  for (const p of poly) {
    if (p.x < -margin.x || p.y < -margin.y || p.x > pw + margin.x || p.y > ph + margin.y) return null;
  }
  if (!isConvexQuad(poly)) return null;

  const coverage = polyArea(poly) / (pw * ph);
  if (coverage < 0.12 || coverage > 1.02) return null;

  const support =
    (lines.left.inliers + lines.right.inliers + lines.top.inliers + lines.bottom.inliers) /
    (2 * (pw + ph));
  const score = Math.min(1, coverage * 0.5 + Math.min(1, support) * 0.5);

  const inv = 1 / scale;
  const quad = orderQuad(
    poly.map((p) => ({ x: clamp(p.x, 0, pw) * inv, y: clamp(p.y, 0, ph) * inv })),
  );
  return { quad, score };
}

/** x = a·y + b (vertical edges) or y = a·x + b (horizontal edges). */
interface Line {
  a: number;
  b: number;
  vertical: boolean;
  inliers: number;
}

function fitEdge(grad: Gradient, side: Side, threshold: number): Line | null {
  const { gx, gy, mag, width: w, height: h } = grad;
  const vertical = side === 'left' || side === 'right';
  const pts: Pt[] = [];

  if (vertical) {
    const limit = Math.floor(w * 0.45);
    for (let y = 2; y < h - 2; y += 1) {
      if (side === 'left') {
        for (let x = 2; x < limit; x += 1) {
          const i = y * w + x;
          if (mag[i]! > threshold && Math.abs(gx[i]!) > Math.abs(gy[i]!) * 1.1) {
            pts.push({ x, y });
            break;
          }
        }
      } else {
        for (let x = w - 3; x > w - 1 - limit; x -= 1) {
          const i = y * w + x;
          if (mag[i]! > threshold && Math.abs(gx[i]!) > Math.abs(gy[i]!) * 1.1) {
            pts.push({ x, y });
            break;
          }
        }
      }
    }
  } else {
    const limit = Math.floor(h * 0.45);
    for (let x = 2; x < w - 2; x += 1) {
      if (side === 'top') {
        for (let y = 2; y < limit; y += 1) {
          const i = y * w + x;
          if (mag[i]! > threshold && Math.abs(gy[i]!) > Math.abs(gx[i]!) * 1.1) {
            pts.push({ x, y });
            break;
          }
        }
      } else {
        for (let y = h - 3; y > h - 1 - limit; y -= 1) {
          const i = y * w + x;
          if (mag[i]! > threshold && Math.abs(gy[i]!) > Math.abs(gx[i]!) * 1.1) {
            pts.push({ x, y });
            break;
          }
        }
      }
    }
  }

  return ransacLine(pts, vertical, vertical ? h : w);
}

/**
 * RANSAC line fit. For vertical edges the model is x = a·y + b; for horizontal,
 * y = a·x + b. Returns null when too few points support any line.
 */
function ransacLine(pts: Pt[], vertical: boolean, span: number): Line | null {
  const minSupport = Math.max(20, span * 0.25);
  if (pts.length < minSupport) return null;

  const indep = (p: Pt) => (vertical ? p.y : p.x);
  const dep = (p: Pt) => (vertical ? p.x : p.y);
  const eps = 2.5;

  let bestInliers: Pt[] = [];
  const iters = 80;
  for (let it = 0; it < iters; it += 1) {
    const p1 = pts[(Math.random() * pts.length) | 0]!;
    const p2 = pts[(Math.random() * pts.length) | 0]!;
    const di = indep(p2) - indep(p1);
    if (Math.abs(di) < 1e-6) continue;
    const a = (dep(p2) - dep(p1)) / di;
    if (Math.abs(a) > 0.7) continue; // must stay near axis-aligned
    const b = dep(p1) - a * indep(p1);
    const inliers = pts.filter((p) => Math.abs(dep(p) - (a * indep(p) + b)) <= eps);
    if (inliers.length > bestInliers.length) bestInliers = inliers;
  }
  if (bestInliers.length < minSupport) return null;

  // Least-squares refine on the inlier set.
  let sx = 0;
  let sy = 0;
  let sxy = 0;
  let sxx = 0;
  const n = bestInliers.length;
  for (const p of bestInliers) {
    const u = indep(p);
    const v = dep(p);
    sx += u;
    sy += v;
    sxy += u * v;
    sxx += u * u;
  }
  const denom = n * sxx - sx * sx || 1e-9;
  const a = (n * sxy - sx * sy) / denom;
  const b = (sy - a * sx) / n;
  return { a, b, vertical, inliers: n };
}

function intersect(l1: Line, l2: Line): Pt | null {
  // One vertical (x = a·y + b), one horizontal (y = a·x + b).
  const v = l1.vertical ? l1 : l2;
  const hor = l1.vertical ? l2 : l1;
  if (v.vertical === hor.vertical) return null;
  // y = ah·x + bh ; x = av·y + bv  →  x = av·(ah·x + bh) + bv
  const denom = 1 - v.a * hor.a;
  if (Math.abs(denom) < 1e-9) return null;
  const x = (v.a * hor.b + v.b) / denom;
  const y = hor.a * x + hor.b;
  return { x, y };
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Box-average downscale of an RGBA buffer. */
function downscale(
  rgba: Uint8ClampedArray,
  sw: number,
  sh: number,
  dw: number,
  dh: number,
): Uint8ClampedArray {
  if (dw === sw && dh === sh) return rgba;
  const out = new Uint8ClampedArray(dw * dh * 4);
  const xr = sw / dw;
  const yr = sh / dh;
  for (let y = 0; y < dh; y += 1) {
    const sy0 = Math.floor(y * yr);
    const sy1 = Math.max(sy0 + 1, Math.floor((y + 1) * yr));
    for (let x = 0; x < dw; x += 1) {
      const sx0 = Math.floor(x * xr);
      const sx1 = Math.max(sx0 + 1, Math.floor((x + 1) * xr));
      let r = 0;
      let g = 0;
      let b = 0;
      let n = 0;
      for (let sy = sy0; sy < sy1 && sy < sh; sy += 1) {
        for (let sx = sx0; sx < sx1 && sx < sw; sx += 1) {
          const p = (sy * sw + sx) * 4;
          r += rgba[p]!;
          g += rgba[p + 1]!;
          b += rgba[p + 2]!;
          n += 1;
        }
      }
      const o = (y * dw + x) * 4;
      out[o] = r / n;
      out[o + 1] = g / n;
      out[o + 2] = b / n;
      out[o + 3] = 255;
    }
  }
  return out;
}
