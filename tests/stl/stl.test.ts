import { describe, expect, it } from 'vitest';
import {
  BINARY_STL_FACET_BYTES,
  BINARY_STL_HEADER_BYTES,
  binaryStlSize,
  buildFlatNormals,
  encodeAsciiStl,
  encodeBinaryStl,
} from '@/lib/stl/stl';
import { buildMesh } from '@/lib/stl/mesh';
import { DEFAULT_STL_OPTIONS, type HeightField, type Mesh } from '@/lib/stl/types';

/** One triangle in the z = 0 plane, wound so its normal points at +z. */
const unitTriangle: Mesh = {
  positions: Float32Array.from([0, 0, 0, 1, 0, 0, 0, 1, 0]),
  triangleCount: 1,
};

const flatField = (w: number, h: number): HeightField => ({
  width: w,
  height: h,
  data: new Float32Array(w * h).fill(0.5),
});

describe('binaryStlSize', () => {
  it('matches the format: 84-byte head plus 50 bytes a facet', () => {
    expect(binaryStlSize(0)).toBe(BINARY_STL_HEADER_BYTES);
    expect(binaryStlSize(1000)).toBe(BINARY_STL_HEADER_BYTES + 1000 * BINARY_STL_FACET_BYTES);
  });
});

describe('encodeBinaryStl', () => {
  it('writes a buffer of exactly the predicted length', () => {
    const buf = encodeBinaryStl(unitTriangle);
    expect(buf.byteLength).toBe(binaryStlSize(1));
  });

  it('records the triangle count little-endian at offset 80', () => {
    const mesh = buildMesh(flatField(6, 6), DEFAULT_STL_OPTIONS);
    const view = new DataView(encodeBinaryStl(mesh));
    expect(view.getUint32(80, true)).toBe(mesh.triangleCount);
  });

  it('derives the facet normal from the winding', () => {
    const view = new DataView(encodeBinaryStl(unitTriangle));
    expect(view.getFloat32(84, true)).toBeCloseTo(0, 6);
    expect(view.getFloat32(88, true)).toBeCloseTo(0, 6);
    expect(view.getFloat32(92, true)).toBeCloseTo(1, 6);
  });

  it('round-trips the vertices it was given', () => {
    const view = new DataView(encodeBinaryStl(unitTriangle));
    const vertexOffset = 84 + 12;
    const read = Array.from({ length: 9 }, (_, i) => view.getFloat32(vertexOffset + i * 4, true));
    expect(read).toEqual([0, 0, 0, 1, 0, 0, 0, 1, 0]);
  });

  it('never lets the header spill into the facet count', () => {
    const buf = encodeBinaryStl(unitTriangle, 'x'.repeat(500));
    expect(new DataView(buf).getUint32(80, true)).toBe(1);
  });

  it('emits a zero normal for a degenerate facet instead of NaN', () => {
    const degenerate: Mesh = { positions: Float32Array.from([1, 1, 1, 1, 1, 1, 1, 1, 1]), triangleCount: 1 };
    const view = new DataView(encodeBinaryStl(degenerate));
    for (let i = 0; i < 3; i += 1) expect(view.getFloat32(84 + i * 4, true)).toBe(0);
  });
});

describe('encodeAsciiStl', () => {
  it('opens and closes the solid', () => {
    const text = encodeAsciiStl(unitTriangle, 'demo');
    expect(text.startsWith('solid demo')).toBe(true);
    expect(text.trimEnd().endsWith('endsolid demo')).toBe(true);
  });

  it('writes one facet block per triangle', () => {
    const mesh = buildMesh(flatField(5, 5), DEFAULT_STL_OPTIONS);
    const text = encodeAsciiStl(mesh);
    expect(text.match(/facet normal/g)?.length).toBe(mesh.triangleCount);
    expect(text.match(/vertex /g)?.length).toBe(mesh.triangleCount * 3);
  });

  it('is far bulkier than binary, which is why binary is the default', () => {
    const mesh = buildMesh(flatField(20, 20), DEFAULT_STL_OPTIONS);
    const ascii = new TextEncoder().encode(encodeAsciiStl(mesh)).byteLength;
    expect(ascii).toBeGreaterThan(encodeBinaryStl(mesh).byteLength * 3);
  });
});

describe('buildFlatNormals', () => {
  it('gives all three vertices of a facet the same normal', () => {
    const n = buildFlatNormals(unitTriangle);
    expect(Array.from(n)).toEqual([0, 0, 1, 0, 0, 1, 0, 0, 1]);
  });

  it('produces one normal per vertex', () => {
    const mesh = buildMesh(flatField(7, 5), DEFAULT_STL_OPTIONS);
    expect(buildFlatNormals(mesh).length).toBe(mesh.positions.length);
  });

  it('returns unit-length normals', () => {
    const mesh = buildMesh(flatField(6, 6), { ...DEFAULT_STL_OPTIONS, shape: 'curved' });
    const n = buildFlatNormals(mesh);
    for (let i = 0; i < n.length; i += 3) {
      expect(Math.hypot(n[i]!, n[i + 1]!, n[i + 2]!)).toBeCloseTo(1, 4);
    }
  });
});
