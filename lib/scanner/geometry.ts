/**
 * Pure geometry for the document scanner: quad ordering, perspective solve and
 * polygon simplification. No DOM, no OpenCV — everything here is unit-tested and
 * runs in the detection Web Worker as well as on the main thread.
 */

export interface Pt {
  x: number;
  y: number;
}

/** Four corners, always stored clockwise as [top-left, top-right, bottom-right, bottom-left]. */
export type Quad = [Pt, Pt, Pt, Pt];

export const dist = (a: Pt, b: Pt): number => Math.hypot(a.x - b.x, a.y - b.y);

/** Signed area × 2 (shoelace). Positive = clockwise in image space (y grows down). */
export function signedArea(poly: Pt[]): number {
  let s = 0;
  for (let i = 0; i < poly.length; i += 1) {
    const a = poly[i]!;
    const b = poly[(i + 1) % poly.length]!;
    s += a.x * b.y - b.x * a.y;
  }
  return s / 2;
}

export const polyArea = (poly: Pt[]): number => Math.abs(signedArea(poly));

/** True when no interior angle reflexes — i.e. the 4 points form a simple convex quad. */
export function isConvexQuad(poly: Pt[]): boolean {
  if (poly.length !== 4) return false;
  let sign = 0;
  for (let i = 0; i < 4; i += 1) {
    const a = poly[i]!;
    const b = poly[(i + 1) % 4]!;
    const c = poly[(i + 2) % 4]!;
    const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    if (cross !== 0) {
      const s = Math.sign(cross);
      if (sign === 0) sign = s;
      else if (s !== sign) return false;
    }
  }
  return true;
}

/**
 * Put four arbitrary corners into a stable clockwise [TL, TR, BR, BL] order.
 * TL is the corner with the smallest x+y; winding is fixed by the shoelace sign.
 */
export function orderQuad(pts: Pt[]): Quad {
  if (pts.length !== 4) throw new Error('orderQuad expects exactly 4 points');
  const cx = (pts[0]!.x + pts[1]!.x + pts[2]!.x + pts[3]!.x) / 4;
  const cy = (pts[0]!.y + pts[1]!.y + pts[2]!.y + pts[3]!.y) / 4;
  const byAngle = [...pts].sort(
    (a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx),
  );
  // Ensure clockwise (image space): shoelace > 0.
  if (signedArea(byAngle) < 0) byAngle.reverse();
  let start = 0;
  let best = Infinity;
  byAngle.forEach((p, i) => {
    const key = p.x + p.y;
    if (key < best) {
      best = key;
      start = i;
    }
  });
  return [
    byAngle[start]!,
    byAngle[(start + 1) % 4]!,
    byAngle[(start + 2) % 4]!,
    byAngle[(start + 3) % 4]!,
  ];
}

/** Target raster size for a de-warped quad, preserving its dominant edge lengths. */
export function outputSize(quad: Quad, maxLongSide = 2600): { width: number; height: number } {
  const [tl, tr, br, bl] = quad;
  const width = Math.max(dist(tl, tr), dist(bl, br));
  const height = Math.max(dist(tl, bl), dist(tr, br));
  let w = Math.max(1, Math.round(width));
  let h = Math.max(1, Math.round(height));
  const longest = Math.max(w, h);
  if (longest > maxLongSide) {
    const k = maxLongSide / longest;
    w = Math.max(1, Math.round(w * k));
    h = Math.max(1, Math.round(h * k));
  }
  return { width: w, height: h };
}

export type Matrix3 = [number, number, number, number, number, number, number, number, number];

/**
 * Solve the 3×3 homography H such that H · from[i] ≈ to[i] (homogeneous), with
 * h33 fixed to 1. Direct-linear-transform → 8×8 solve by Gaussian elimination.
 */
export function solveHomography(from: Pt[], to: Pt[]): Matrix3 {
  if (from.length !== 4 || to.length !== 4) throw new Error('solveHomography needs 4↔4 points');
  const a: number[][] = [];
  const b: number[] = [];
  for (let i = 0; i < 4; i += 1) {
    const { x, y } = from[i]!;
    const { x: u, y: v } = to[i]!;
    a.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    b.push(u);
    a.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    b.push(v);
  }
  const h = gaussSolve(a, b);
  return [h[0]!, h[1]!, h[2]!, h[3]!, h[4]!, h[5]!, h[6]!, h[7]!, 1];
}

/** Apply a 3×3 homography to a point. */
export function applyMatrix(m: Matrix3, p: Pt): Pt {
  const d = m[6] * p.x + m[7] * p.y + m[8] || 1e-12;
  return {
    x: (m[0] * p.x + m[1] * p.y + m[2]) / d,
    y: (m[3] * p.x + m[4] * p.y + m[5]) / d,
  };
}

export function invertMatrix3(m: Matrix3): Matrix3 {
  const [a, b, c, d, e, f, g, h, i] = m;
  const A = e * i - f * h;
  const B = f * g - d * i;
  const C = d * h - e * g;
  const det = a * A + b * B + c * C;
  if (Math.abs(det) < 1e-12) throw new Error('Matrix is not invertible');
  const inv = 1 / det;
  return [
    A * inv,
    (c * h - b * i) * inv,
    (b * f - c * e) * inv,
    B * inv,
    (a * i - c * g) * inv,
    (c * d - a * f) * inv,
    C * inv,
    (b * g - a * h) * inv,
    (a * e - b * d) * inv,
  ];
}

/** Gaussian elimination with partial pivoting for a square system. */
function gaussSolve(matrix: number[][], rhs: number[]): number[] {
  const n = rhs.length;
  const m = matrix.map((row, i) => [...row, rhs[i]!]);
  for (let col = 0; col < n; col += 1) {
    let pivot = col;
    for (let r = col + 1; r < n; r += 1) {
      if (Math.abs(m[r]![col]!) > Math.abs(m[pivot]![col]!)) pivot = r;
    }
    if (Math.abs(m[pivot]![col]!) < 1e-12) throw new Error('Singular system in homography solve');
    [m[col], m[pivot]] = [m[pivot]!, m[col]!];
    const pv = m[col]![col]!;
    for (let c = col; c <= n; c += 1) m[col]![c]! /= pv;
    for (let r = 0; r < n; r += 1) {
      if (r === col) continue;
      const factor = m[r]![col]!;
      if (factor === 0) continue;
      for (let c = col; c <= n; c += 1) m[r]![c]! -= factor * m[col]![c]!;
    }
  }
  return m.map((row) => row[n]!);
}

/**
 * Ramer–Douglas–Peucker polyline simplification. Used to reduce a traced contour
 * to its corner points so a 4-vertex result can be recognised as a page.
 */
export function simplifyPolygon(points: Pt[], epsilon: number): Pt[] {
  if (points.length < 3) return [...points];
  const keep = new Array<boolean>(points.length).fill(false);
  keep[0] = true;
  keep[points.length - 1] = true;

  const stack: [number, number][] = [[0, points.length - 1]];
  while (stack.length) {
    const [start, end] = stack.pop()!;
    let maxDist = 0;
    let index = -1;
    const a = points[start]!;
    const b = points[end]!;
    for (let i = start + 1; i < end; i += 1) {
      const d = perpendicularDistance(points[i]!, a, b);
      if (d > maxDist) {
        maxDist = d;
        index = i;
      }
    }
    if (maxDist > epsilon && index !== -1) {
      keep[index] = true;
      stack.push([start, index], [index, end]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

/** A sensible fallback quad (inset rectangle) when detection fails or is absent. */
export function defaultQuad(width: number, height: number, inset = 0.06): Quad {
  const mx = width * inset;
  const my = height * inset;
  return [
    { x: mx, y: my },
    { x: width - mx, y: my },
    { x: width - mx, y: height - my },
    { x: mx, y: height - my },
  ];
}

function perpendicularDistance(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-9) return dist(p, a);
  return Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x) / len;
}
