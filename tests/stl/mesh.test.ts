import { describe, expect, it } from 'vitest';
import { buildMesh, countTriangles, meshBounds, resolveHeightMM, signedVolumeMM3 } from '@/lib/stl/mesh';
import { DEFAULT_STL_OPTIONS, type HeightField, type StlOptions, type StlShape } from '@/lib/stl/types';
import { edgeAudit } from './helpers';

function field(width: number, height: number, fn: (x: number, y: number) => number): HeightField {
  const data = new Float32Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) data[y * width + x] = fn(x, y);
  }
  return { width, height, data };
}

const opts = (over: Partial<StlOptions> = {}): StlOptions => ({ ...DEFAULT_STL_OPTIONS, ...over });

const SHAPES: StlShape[] = ['flat', 'curved', 'cylinder'];

describe('buildMesh produces a closed, outward-facing solid', () => {
  for (const shape of SHAPES) {
    it(`${shape}: every directed edge is used exactly once`, () => {
      const f = field(11, 7, (x, y) => ((x * 7 + y * 13) % 11) / 10);
      const mesh = buildMesh(f, opts({ shape, widthMM: 60 }));
      const audit = edgeAudit(mesh.positions, mesh.triangleCount);
      expect(audit.duplicated).toBe(0);
      expect(audit.unpaired).toBe(0);
    });

    it(`${shape}: facets face outward (positive volume)`, () => {
      const f = field(9, 9, (x) => x / 8);
      const mesh = buildMesh(f, opts({ shape, widthMM: 60 }));
      expect(signedVolumeMM3(mesh)).toBeGreaterThan(0);
    });

    it(`${shape}: triangle count matches what was reserved`, () => {
      const f = field(8, 6, () => 0.5);
      const mesh = buildMesh(f, opts({ shape }));
      expect(mesh.triangleCount).toBe(countTriangles(shape, 8, 6));
      expect(mesh.positions.length).toBe(mesh.triangleCount * 9);
    });

    it(`${shape}: a flat image still closes (no zero-area collapse)`, () => {
      const f = field(6, 6, () => 0);
      const mesh = buildMesh(f, opts({ shape, minThicknessMM: 0.8, maxThicknessMM: 3 }));
      const audit = edgeAudit(mesh.positions, mesh.triangleCount);
      expect(audit.duplicated).toBe(0);
      expect(audit.unpaired).toBe(0);
    });
  }
});

describe('physical dimensions', () => {
  it('a flat plate measures exactly the requested width', () => {
    const f = field(20, 10, () => 0.5);
    const mesh = buildMesh(f, opts({ shape: 'flat', widthMM: 120 }));
    const { min, max } = meshBounds(mesh);
    expect(max[0] - min[0]).toBeCloseTo(120, 6);
  });

  it('height follows the image aspect ratio when not given', () => {
    const f = field(20, 10, () => 0.5);
    const o = opts({ shape: 'flat', widthMM: 120 });
    expect(resolveHeightMM(f, o)).toBeCloseTo(60, 6);
    const { min, max } = meshBounds(buildMesh(f, o));
    expect(max[1] - min[1]).toBeCloseTo(60, 6);
  });

  it('an explicit height overrides the aspect ratio', () => {
    const f = field(20, 10, () => 0.5);
    const mesh = buildMesh(f, opts({ shape: 'flat', widthMM: 120, heightMM: 25 }));
    const { min, max } = meshBounds(mesh);
    expect(max[1] - min[1]).toBeCloseTo(25, 6);
  });

  it('thickness spans exactly min..max across the brightness range', () => {
    const f = field(4, 4, (x) => (x < 2 ? 0 : 1));
    const mesh = buildMesh(f, opts({ shape: 'flat', minThicknessMM: 0.8, maxThicknessMM: 3.2 }));
    const { min, max } = meshBounds(mesh);
    expect(min[2]).toBeCloseTo(0, 6); // flat back sits on the bed
    expect(max[2]).toBeCloseTo(3.2, 6);
  });

  it('a relief adds its base beneath the modelled surface', () => {
    const f = field(4, 4, () => 0);
    const mesh = buildMesh(f, opts({ shape: 'flat', mode: 'relief', minThicknessMM: 0, maxThicknessMM: 2, baseThicknessMM: 1.5 }));
    const { max } = meshBounds(mesh);
    expect(max[2]).toBeCloseTo(1.5, 6);
  });

  it('a cylinder wraps the requested circumference', () => {
    const f = field(24, 12, () => 0);
    const mesh = buildMesh(f, opts({ shape: 'cylinder', widthMM: 157.08, minThicknessMM: 0.8, maxThicknessMM: 0.8 }));
    const { min, max } = meshBounds(mesh);
    const innerR = 157.08 / (Math.PI * 2);
    // Outer diameter = 2 × (inner radius + wall).
    expect(max[0] - min[0]).toBeCloseTo((innerR + 0.8) * 2, 1);
  });

  it('a curved panel stands on the bed at z = 0', () => {
    const f = field(12, 8, () => 0.5);
    const mesh = buildMesh(f, opts({ shape: 'curved', curveDegrees: 90 }));
    const { min } = meshBounds(mesh);
    expect(min[2]).toBeCloseTo(0, 6);
  });
});

describe('countTriangles', () => {
  it('grows with grid detail', () => {
    expect(countTriangles('flat', 100, 100)).toBeGreaterThan(countTriangles('flat', 50, 50));
  });

  it('a cylinder needs no end caps, a curved panel does', () => {
    // Same grid: the open arc carries two extra walls down its cut edges.
    const arcOnly = countTriangles('curved', 50, 40) - 4 * 49 * 39 - 4 * 49;
    expect(arcOnly).toBe(4 * 39);
  });
});
