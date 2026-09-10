import { describe, expect, it } from 'vitest';
import { detectDocument } from '@/lib/scanner/detect';
import { defaultQuad, type Pt } from '@/lib/scanner/geometry';

/** RGBA image: flat `bg` with a brighter quad drawn on top. */
function makeImage(
  w: number,
  h: number,
  quad: [Pt, Pt, Pt, Pt],
  bg = 45,
  fg = 225,
): Uint8ClampedArray {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i += 1) {
    data[i * 4] = bg;
    data[i * 4 + 1] = bg;
    data[i * 4 + 2] = bg;
    data[i * 4 + 3] = 255;
  }
  const [a, b, c, d] = quad;
  const inside = (x: number, y: number) => {
    // point-in-quad via sign of cross products (quad is convex, clockwise)
    const pts = [a, b, c, d];
    let sign = 0;
    for (let k = 0; k < 4; k += 1) {
      const p = pts[k]!;
      const q = pts[(k + 1) % 4]!;
      const cross = (q.x - p.x) * (y - p.y) - (q.y - p.y) * (x - p.x);
      const s = Math.sign(cross);
      if (s !== 0) {
        if (sign === 0) sign = s;
        else if (s !== sign) return false;
      }
    }
    return true;
  };
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (inside(x, y)) {
        const p = (y * w + x) * 4;
        data[p] = fg;
        data[p + 1] = fg;
        data[p + 2] = fg;
      }
    }
  }
  return data;
}

const near = (a: Pt, b: Pt, tol: number) => Math.hypot(a.x - b.x, a.y - b.y) <= tol;

describe('detectDocument', () => {
  it('finds an axis-aligned page against a dark background', () => {
    const W = 420;
    const H = 560;
    const page: [Pt, Pt, Pt, Pt] = [
      { x: 44, y: 52 },
      { x: 372, y: 52 },
      { x: 372, y: 500 },
      { x: 44, y: 500 },
    ];
    const res = detectDocument(makeImage(W, H, page), W, H);
    expect(res).not.toBeNull();
    res!.quad.forEach((p, i) => expect(near(p, page[i]!, 16)).toBe(true));
    expect(res!.score).toBeGreaterThan(0.4);
  });

  it('handles a mildly skewed page', () => {
    const W = 440;
    const H = 560;
    const page: [Pt, Pt, Pt, Pt] = [
      { x: 60, y: 44 },
      { x: 388, y: 60 },
      { x: 372, y: 508 },
      { x: 48, y: 492 },
    ];
    const res = detectDocument(makeImage(W, H, page), W, H);
    expect(res).not.toBeNull();
    res!.quad.forEach((p, i) => expect(near(p, page[i]!, 30)).toBe(true));
  });

  it('returns null for a flat image with no page', () => {
    const W = 300;
    const H = 300;
    const flat = new Uint8ClampedArray(W * H * 4).fill(130);
    for (let i = 3; i < flat.length; i += 4) flat[i] = 255;
    expect(detectDocument(flat, W, H)).toBeNull();
  });
});

describe('defaultQuad', () => {
  it('is an inset rectangle', () => {
    const q = defaultQuad(1000, 800, 0.1);
    expect(q[0]).toEqual({ x: 100, y: 80 });
    expect(q[2]).toEqual({ x: 900, y: 720 });
  });
});
