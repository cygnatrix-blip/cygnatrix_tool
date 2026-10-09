/**
 * @vitest-environment jsdom
 *
 * jsdom so the generated 3MF XML can be put through a real parser. A string
 * check would pass on markup no slicer could actually open.
 */
import { describe, expect, it } from 'vitest';
import { buildModelXml, buildThreeMfEntries, encodeObj, weldMesh } from '@/lib/stl/indexed';
import { buildMesh } from '@/lib/stl/mesh';
import { encodeBinaryStl } from '@/lib/stl/stl';
import { DEFAULT_STL_OPTIONS, type HeightField, type Mesh } from '@/lib/stl/types';

const flatField = (w: number, h: number): HeightField => ({
  width: w,
  height: h,
  data: new Float32Array(w * h).fill(0.5),
});

/** Two triangles sharing an edge — four unique corners, six raw vertices. */
const sharedEdge: Mesh = {
  positions: Float32Array.from([
    0, 0, 0, 1, 0, 0, 1, 1, 0,
    0, 0, 0, 1, 1, 0, 0, 1, 0,
  ]),
  triangleCount: 2,
};

describe('weldMesh', () => {
  it('collapses repeated corners into shared vertices', () => {
    const m = weldMesh(sharedEdge);
    expect(m.vertexCount).toBe(4);
    expect(m.triangleCount).toBe(2);
    expect(m.indices.length).toBe(6);
  });

  it('keeps the geometry — every index resolves to its original point', () => {
    const m = weldMesh(sharedEdge);
    for (let t = 0; t < m.triangleCount; t += 1) {
      for (let v = 0; v < 3; v += 1) {
        const idx = m.indices[t * 3 + v]!;
        const o = t * 9 + v * 3;
        expect(m.vertices[idx * 3]).toBeCloseTo(sharedEdge.positions[o]!, 5);
        expect(m.vertices[idx * 3 + 1]).toBeCloseTo(sharedEdge.positions[o + 1]!, 5);
        expect(m.vertices[idx * 3 + 2]).toBeCloseTo(sharedEdge.positions[o + 2]!, 5);
      }
    }
  });

  it('cuts a real grid mesh down several-fold, which is the point', () => {
    const mesh = buildMesh(flatField(24, 24), DEFAULT_STL_OPTIONS);
    const welded = weldMesh(mesh);
    expect(welded.vertexCount).toBeLessThan(mesh.triangleCount * 3 * 0.5);
  });

  it('never emits an index past the vertex list', () => {
    const welded = weldMesh(buildMesh(flatField(12, 9), DEFAULT_STL_OPTIONS));
    for (const i of welded.indices) expect(i).toBeLessThan(welded.vertexCount);
  });
});

describe('3MF', () => {
  it('declares millimetres, which is exactly what STL cannot', () => {
    const xml = buildModelXml(weldMesh(sharedEdge));
    expect(xml).toContain('unit="millimeter"');
  });

  it('writes one vertex and one triangle element each', () => {
    const m = weldMesh(sharedEdge);
    const xml = buildModelXml(m);
    expect(xml.match(/<vertex /g)?.length).toBe(m.vertexCount);
    expect(xml.match(/<triangle /g)?.length).toBe(m.triangleCount);
  });

  it('is well-formed enough to parse as XML', () => {
    const xml = buildModelXml(weldMesh(buildMesh(flatField(6, 6), DEFAULT_STL_OPTIONS)));
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    expect(doc.querySelector('parsererror')).toBeNull();
    expect(doc.documentElement.nodeName).toBe('model');
  });

  it('strips characters that would break the XML', () => {
    expect(buildModelXml(weldMesh(sharedEdge), 'a<b>&c')).not.toContain('a<b>');
  });

  it('packages the three entries the format requires', () => {
    const entries = buildThreeMfEntries(weldMesh(sharedEdge));
    expect(Object.keys(entries).sort()).toEqual(['3D/3dmodel.model', '[Content_Types].xml', '_rels/.rels']);
    for (const bytes of Object.values(entries)) expect(bytes.byteLength).toBeGreaterThan(0);
  });

  it('points its relationship at the model part', () => {
    const rels = new TextDecoder().decode(buildThreeMfEntries(weldMesh(sharedEdge))['_rels/.rels']!);
    expect(rels).toContain('/3D/3dmodel.model');
  });
});

describe('OBJ', () => {
  it('uses 1-based indices, as the format requires', () => {
    const obj = encodeObj(weldMesh(sharedEdge));
    const faces = obj.split('\n').filter((l) => l.startsWith('f '));
    for (const f of faces) {
      for (const idx of f.slice(2).split(' ')) expect(Number(idx)).toBeGreaterThanOrEqual(1);
    }
  });

  it('writes one v line per vertex and one f line per triangle', () => {
    const m = weldMesh(buildMesh(flatField(8, 6), DEFAULT_STL_OPTIONS));
    const obj = encodeObj(m);
    expect(obj.split('\n').filter((l) => l.startsWith('v ')).length).toBe(m.vertexCount);
    expect(obj.split('\n').filter((l) => l.startsWith('f ')).length).toBe(m.triangleCount);
  });

  it('beats binary STL on size for the same geometry', () => {
    const mesh = buildMesh(flatField(30, 30), DEFAULT_STL_OPTIONS);
    const obj = new TextEncoder().encode(encodeObj(weldMesh(mesh))).byteLength;
    expect(obj).toBeLessThan(encodeBinaryStl(mesh).byteLength);
  });
});
