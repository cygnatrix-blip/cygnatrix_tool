import { describe, expect, it } from 'vitest';
import { buildMask, insideHeart, maskOptionsFor, pruneIsolated } from '@/lib/stl/outline';
import { buildMesh, countMaskedTriangles, signedVolumeMM3 } from '@/lib/stl/mesh';
import { DEFAULT_STL_OPTIONS, type HeightField, type Outline, type StlOptions } from '@/lib/stl/types';
import { edgeAudit } from './helpers';

const opts = (over: Partial<StlOptions> = {}): StlOptions => ({ ...DEFAULT_STL_OPTIONS, ...over });

function maskedField(width: number, height: number, o: StlOptions): HeightField {
  const data = new Float32Array(width * height).fill(0.5);
  const mask = buildMask(width, height, maskOptionsFor(o, o.widthMM, o.widthMM));
  return { width, height, data, mask: mask ? pruneIsolated(mask, width, height) : undefined };
}

describe('insideHeart', () => {
  it('contains the centre and the classic cusp points', () => {
    expect(insideHeart(0, 0)).toBe(true);
    expect(insideHeart(0, -1)).toBe(true); // bottom point sits on the curve
  });

  it('excludes far-away points', () => {
    expect(insideHeart(3, 3)).toBe(false);
    expect(insideHeart(0, -3)).toBe(false);
  });

  it('is symmetric about the vertical axis, as a heart must be', () => {
    for (const [x, y] of [[0.4, 0.3], [0.9, -0.2], [0.2, 0.9]]) {
      expect(insideHeart(x!, y!)).toBe(insideHeart(-x!, y!));
    }
  });
});

describe('buildMask', () => {
  it('returns nothing for a plain rectangle, so the cheap mesh path is used', () => {
    expect(buildMask(10, 10, { outline: 'rectangle', cornerFracX: 0.1, cornerFracY: 0.1 })).toBeUndefined();
  });

  it('still builds a mask for a rectangle once a hole is punched', () => {
    const mask = buildMask(20, 20, {
      outline: 'rectangle', cornerFracX: 0.1, cornerFracY: 0.1,
      holeRadiusFracX: 0.1, holeRadiusFracY: 0.1, holeCentreU: 0.5, holeCentreV: 0.2,
    });
    expect(mask).toBeDefined();
    expect(mask!.some((v) => v === 0)).toBe(true);
  });

  it('drops the corners of an ellipse but keeps the middle', () => {
    const mask = buildMask(21, 21, { outline: 'ellipse', cornerFracX: 0, cornerFracY: 0 })!;
    expect(mask[0]).toBe(0); // corner
    expect(mask[10 * 21 + 10]).toBe(1); // centre
  });

  it('rounds only the corners, leaving the edge midpoints intact', () => {
    const mask = buildMask(41, 41, { outline: 'rounded', cornerFracX: 0.25, cornerFracY: 0.25 })!;
    expect(mask[0]).toBe(0); // corner cut away
    expect(mask[20]).toBe(1); // middle of the top edge kept
    expect(mask[20 * 41]).toBe(1); // middle of the left edge kept
  });

  it('cuts a heart that is symmetric and keeps its centre', () => {
    const w = 41;
    const mask = buildMask(w, w, { outline: 'heart', cornerFracX: 0, cornerFracY: 0 })!;
    expect(mask[Math.floor(w / 2) * w + Math.floor(w / 2)]).toBe(1);
    for (let y = 0; y < w; y += 1) {
      for (let x = 0; x < Math.floor(w / 2); x += 1) {
        expect(mask[y * w + x]).toBe(mask[y * w + (w - 1 - x)]);
      }
    }
  });

  it('a heart keeps less material than a rectangle but is far from empty', () => {
    const w = 61;
    const mask = buildMask(w, w, { outline: 'heart', cornerFracX: 0, cornerFracY: 0 })!;
    const kept = mask.reduce((a, b) => a + b, 0) / (w * w);
    expect(kept).toBeGreaterThan(0.3);
    expect(kept).toBeLessThan(0.85);
  });
});

describe('pruneIsolated', () => {
  it('removes a lone sample that would print as loose debris', () => {
    const mask = new Uint8Array(9);
    mask[4] = 1; // centre only, no neighbours
    expect(Array.from(pruneIsolated(mask, 3, 3))).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('keeps samples that have a neighbour', () => {
    const mask = Uint8Array.from([0, 0, 0, 0, 1, 1, 0, 0, 0]);
    expect(Array.from(pruneIsolated(mask, 3, 3))).toEqual([0, 0, 0, 0, 1, 1, 0, 0, 0]);
  });
});

const OUTLINES: Outline[] = ['rounded', 'ellipse', 'heart'];

describe('masked panels stay printable solids', () => {
  for (const outline of OUTLINES) {
    it(`${outline}: every directed edge is used exactly once`, () => {
      const o = opts({ shape: 'flat', outline, widthMM: 80 });
      const field = maskedField(37, 31, o);
      expect(field.mask).toBeDefined();
      const mesh = buildMesh(field, o);
      const audit = edgeAudit(mesh.positions, mesh.triangleCount);
      expect(audit.duplicated).toBe(0);
      expect(audit.unpaired).toBe(0);
    });

    it(`${outline}: faces point outward`, () => {
      const o = opts({ shape: 'flat', outline, widthMM: 80 });
      expect(signedVolumeMM3(buildMesh(maskedField(31, 27, o), o))).toBeGreaterThan(0);
    });
  }

  it('a hanging hole leaves the panel closed around it', () => {
    const o = opts({ shape: 'flat', outline: 'rounded', widthMM: 80, hangingHoleMM: 10, hangingHoleInsetMM: 12 });
    const field = maskedField(45, 45, o);
    expect(field.mask!.some((v) => v === 0)).toBe(true);
    const mesh = buildMesh(field, o);
    const audit = edgeAudit(mesh.positions, mesh.triangleCount);
    expect(audit.duplicated).toBe(0);
    expect(audit.unpaired).toBe(0);
  });

  it('reserves exactly the triangles it emits', () => {
    const o = opts({ shape: 'flat', outline: 'heart', widthMM: 80 });
    const field = maskedField(33, 29, o);
    const mesh = buildMesh(field, o);
    expect(mesh.triangleCount).toBe(countMaskedTriangles(field.mask!, 33, 29));
  });
});

describe('concave curve', () => {
  it('stays a closed solid', () => {
    const o = opts({ shape: 'curved', concave: true, widthMM: 90 });
    const field: HeightField = { width: 17, height: 13, data: new Float32Array(17 * 13).fill(0.4) };
    const mesh = buildMesh(field, o);
    const audit = edgeAudit(mesh.positions, mesh.triangleCount);
    expect(audit.duplicated).toBe(0);
    expect(audit.unpaired).toBe(0);
    expect(signedVolumeMM3(mesh)).toBeGreaterThan(0);
  });

  it('a concave cylinder also closes', () => {
    const o = opts({ shape: 'cylinder', concave: true, widthMM: 120 });
    const field: HeightField = { width: 24, height: 12, data: new Float32Array(24 * 12).fill(0.6) };
    const audit = edgeAudit(buildMesh(field, o).positions, buildMesh(field, o).triangleCount);
    expect(audit.duplicated).toBe(0);
    expect(audit.unpaired).toBe(0);
  });
});

describe('orientUpright', () => {
  it('stands the panel on the bed, swapping its height into Z', () => {
    const o = opts({ shape: 'flat', widthMM: 100, heightMM: 60, orientUpright: true });
    const field: HeightField = { width: 9, height: 9, data: new Float32Array(81).fill(0.5) };
    const mesh = buildMesh(field, o);
    let minZ = Infinity, maxZ = -Infinity, maxX = -Infinity, minX = Infinity;
    for (let i = 0; i < mesh.triangleCount * 9; i += 3) {
      const x = mesh.positions[i] ?? 0;
      const z = mesh.positions[i + 2] ?? 0;
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
    }
    expect(minZ).toBeCloseTo(0, 6); // sits on the bed
    expect(maxZ - minZ).toBeCloseTo(60, 6); // the panel's height is now vertical
    expect(maxX - minX).toBeCloseTo(100, 6);
  });

  it('is still a closed solid after being stood up', () => {
    const o = opts({ shape: 'flat', orientUpright: true });
    const field: HeightField = { width: 11, height: 9, data: new Float32Array(99).fill(0.3) };
    const mesh = buildMesh(field, o);
    const audit = edgeAudit(mesh.positions, mesh.triangleCount);
    expect(audit.duplicated).toBe(0);
    expect(audit.unpaired).toBe(0);
  });
});
