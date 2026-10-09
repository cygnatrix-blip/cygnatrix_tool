/**
 * Shared-vertex export: 3MF and OBJ.
 *
 * STL repeats every vertex for every facet it touches, so a grid mesh stores
 * each corner about six times. Welding them first is not just tidier — it is
 * the difference between a 48 MB file and an 8 MB one at identical geometry,
 * and both these formats require indices anyway.
 *
 * 3MF is the better target of the two for printing: it is a zip of XML that
 * states its units explicitly, where STL is unitless and leaves every slicer
 * guessing whether a number means millimetres or inches.
 */

import type { IndexedMesh, Mesh } from './types';

/** Welds to 1 µm, far finer than any printable feature. */
const WELD_SCALE = 1000;

export function weldMesh(mesh: Mesh): IndexedMesh {
  const p = mesh.positions;
  const lookup = new Map<string, number>();
  const verts: number[] = [];
  const indices = new Uint32Array(mesh.triangleCount * 3);

  for (let t = 0; t < mesh.triangleCount; t += 1) {
    for (let v = 0; v < 3; v += 1) {
      const o = t * 9 + v * 3;
      const x = p[o] ?? 0;
      const y = p[o + 1] ?? 0;
      const z = p[o + 2] ?? 0;
      const key = `${Math.round(x * WELD_SCALE)},${Math.round(y * WELD_SCALE)},${Math.round(z * WELD_SCALE)}`;
      let idx = lookup.get(key);
      if (idx === undefined) {
        idx = verts.length / 3;
        lookup.set(key, idx);
        verts.push(x, y, z);
      }
      indices[t * 3 + v] = idx;
    }
  }

  return {
    vertices: Float32Array.from(verts),
    indices,
    vertexCount: verts.length / 3,
    triangleCount: mesh.triangleCount,
  };
}

const n = (v: number) => (Math.abs(v) < 1e-7 ? '0' : Number(v.toFixed(5)).toString());

/** The XML payload of a 3MF: one mesh, in millimetres. */
export function buildModelXml(mesh: IndexedMesh, title = 'Cygnatrix Tools model'): string {
  const parts: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">',
    '  <metadata name="Application">Cygnatrix Tools</metadata>',
    `  <metadata name="Title">${title.replace(/[<>&]/g, '')}</metadata>`,
    '  <resources>',
    '    <object id="1" type="model">',
    '      <mesh>',
    '        <vertices>',
  ];
  for (let i = 0; i < mesh.vertexCount; i += 1) {
    parts.push(`          <vertex x="${n(mesh.vertices[i * 3] ?? 0)}" y="${n(mesh.vertices[i * 3 + 1] ?? 0)}" z="${n(mesh.vertices[i * 3 + 2] ?? 0)}"/>`);
  }
  parts.push('        </vertices>', '        <triangles>');
  for (let t = 0; t < mesh.triangleCount; t += 1) {
    parts.push(`          <triangle v1="${mesh.indices[t * 3]}" v2="${mesh.indices[t * 3 + 1]}" v3="${mesh.indices[t * 3 + 2]}"/>`);
  }
  parts.push(
    '        </triangles>',
    '      </mesh>',
    '    </object>',
    '  </resources>',
    '  <build>',
    '    <item objectid="1"/>',
    '  </build>',
    '</model>',
  );
  return parts.join('\n');
}

export const CONTENT_TYPES_XML = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;

export const RELS_XML = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;

/** The three entries a minimal valid 3MF package contains. */
export function buildThreeMfEntries(mesh: IndexedMesh, title?: string): Record<string, Uint8Array> {
  const enc = new TextEncoder();
  return {
    '[Content_Types].xml': enc.encode(CONTENT_TYPES_XML),
    '_rels/.rels': enc.encode(RELS_XML),
    '3D/3dmodel.model': enc.encode(buildModelXml(mesh, title)),
  };
}

export function encodeObj(mesh: IndexedMesh, name = 'cygnatrix'): string {
  const out: string[] = ['# Cygnatrix Tools', '# units: millimeters', `o ${name}`];
  for (let i = 0; i < mesh.vertexCount; i += 1) {
    out.push(`v ${n(mesh.vertices[i * 3] ?? 0)} ${n(mesh.vertices[i * 3 + 1] ?? 0)} ${n(mesh.vertices[i * 3 + 2] ?? 0)}`);
  }
  for (let t = 0; t < mesh.triangleCount; t += 1) {
    // OBJ indices are 1-based.
    out.push(`f ${(mesh.indices[t * 3] ?? 0) + 1} ${(mesh.indices[t * 3 + 1] ?? 0) + 1} ${(mesh.indices[t * 3 + 2] ?? 0) + 1}`);
  }
  return out.join('\n');
}
