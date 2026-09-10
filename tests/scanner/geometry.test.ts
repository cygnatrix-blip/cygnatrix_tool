import { describe, expect, it } from 'vitest';
import {
  applyMatrix,
  invertMatrix3,
  isConvexQuad,
  orderQuad,
  outputSize,
  polyArea,
  signedArea,
  simplifyPolygon,
  solveHomography,
  type Pt,
} from '@/lib/scanner/geometry';

describe('orderQuad', () => {
  it('returns clockwise [TL, TR, BR, BL] regardless of input order', () => {
    const corners: Pt[] = [
      { x: 300, y: 400 }, // BR
      { x: 10, y: 20 }, // TL
      { x: 300, y: 20 }, // TR
      { x: 10, y: 400 }, // BL
    ];
    const q = orderQuad(corners);
    expect(q[0]).toEqual({ x: 10, y: 20 });
    expect(q[1]).toEqual({ x: 300, y: 20 });
    expect(q[2]).toEqual({ x: 300, y: 400 });
    expect(q[3]).toEqual({ x: 10, y: 400 });
  });
});

describe('polygon helpers', () => {
  it('computes area and winding', () => {
    const sq: Pt[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];
    expect(polyArea(sq)).toBe(100);
    expect(signedArea(sq)).toBeGreaterThan(0); // clockwise in image space
  });

  it('detects convex vs non-convex quads', () => {
    expect(
      isConvexQuad([
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ]),
    ).toBe(true);
    // bow-tie
    expect(
      isConvexQuad([
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 10, y: 0 },
        { x: 0, y: 10 },
      ]),
    ).toBe(false);
  });
});

describe('solveHomography', () => {
  it('maps the unit square onto a quad exactly', () => {
    const quad: Pt[] = [
      { x: 100, y: 50 },
      { x: 500, y: 80 },
      { x: 460, y: 620 },
      { x: 60, y: 560 },
    ];
    const unit: Pt[] = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ];
    const h = solveHomography(unit, quad);
    unit.forEach((u, i) => {
      const p = applyMatrix(h, u);
      expect(p.x).toBeCloseTo(quad[i]!.x, 4);
      expect(p.y).toBeCloseTo(quad[i]!.y, 4);
    });
  });

  it('invertMatrix3 round-trips a point', () => {
    const h = solveHomography(
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 },
      ],
      [
        { x: 3, y: 1 },
        { x: 9, y: 2 },
        { x: 8, y: 7 },
        { x: 1, y: 6 },
      ],
    );
    const inv = invertMatrix3(h);
    const there = applyMatrix(h, { x: 0.3, y: 0.7 });
    const back = applyMatrix(inv, there);
    expect(back.x).toBeCloseTo(0.3, 6);
    expect(back.y).toBeCloseTo(0.7, 6);
  });
});

describe('outputSize', () => {
  it('preserves the quad edge lengths', () => {
    const { width, height } = outputSize([
      { x: 0, y: 0 },
      { x: 400, y: 0 },
      { x: 400, y: 560 },
      { x: 0, y: 560 },
    ]);
    expect(width).toBe(400);
    expect(height).toBe(560);
  });

  it('clamps the long side', () => {
    const { width, height } = outputSize(
      [
        { x: 0, y: 0 },
        { x: 8000, y: 0 },
        { x: 8000, y: 4000 },
        { x: 0, y: 4000 },
      ],
      2600,
    );
    expect(Math.max(width, height)).toBe(2600);
    expect(width / height).toBeCloseTo(2, 1);
  });
});

describe('simplifyPolygon', () => {
  it('drops a redundant collinear point', () => {
    const line: Pt[] = [
      { x: 0, y: 0 },
      { x: 5, y: 0.2 },
      { x: 10, y: 0 },
    ];
    expect(simplifyPolygon(line, 1)).toHaveLength(2);
  });
});
