/** Triangle mesh → STL bytes, binary or ASCII. */

import type { Mesh } from './types';

/** 80-byte header + uint32 count + 50 bytes per facet. */
export const BINARY_STL_HEADER_BYTES = 84;
export const BINARY_STL_FACET_BYTES = 50;

export function binaryStlSize(triangleCount: number): number {
  return BINARY_STL_HEADER_BYTES + triangleCount * BINARY_STL_FACET_BYTES;
}

function facetNormal(
  ax: number, ay: number, az: number,
  bx: number, by: number, bz: number,
  cx: number, cy: number, cz: number,
): [number, number, number] {
  const ux = bx - ax, uy = by - ay, uz = bz - az;
  const vx = cx - ax, vy = cy - ay, vz = cz - az;
  const nx = uy * vz - uz * vy;
  const ny = uz * vx - ux * vz;
  const nz = ux * vy - uy * vx;
  const len = Math.hypot(nx, ny, nz);
  // A degenerate sliver has no meaningful normal; zero is what the format
  // says to write, and every slicer recomputes from winding anyway.
  if (len === 0) return [0, 0, 0];
  return [nx / len, ny / len, nz / len];
}

/**
 * Binary STL — the format to prefer. It is about six times smaller than ASCII
 * for the same mesh and parses without any float formatting ambiguity.
 */
export function encodeBinaryStl(mesh: Mesh, header = 'Cygnatrix Tools image-to-STL'): ArrayBuffer {
  const buffer = new ArrayBuffer(binaryStlSize(mesh.triangleCount));
  const view = new DataView(buffer);

  const headerBytes = new TextEncoder().encode(header).slice(0, 79);
  new Uint8Array(buffer, 0, 80).set(headerBytes);
  view.setUint32(80, mesh.triangleCount, true);

  const p = mesh.positions;
  let off = BINARY_STL_HEADER_BYTES;
  for (let t = 0; t < mesh.triangleCount; t += 1) {
    const o = t * 9;
    const ax = p[o] ?? 0, ay = p[o + 1] ?? 0, az = p[o + 2] ?? 0;
    const bx = p[o + 3] ?? 0, by = p[o + 4] ?? 0, bz = p[o + 5] ?? 0;
    const cx = p[o + 6] ?? 0, cy = p[o + 7] ?? 0, cz = p[o + 8] ?? 0;
    const [nx, ny, nz] = facetNormal(ax, ay, az, bx, by, bz, cx, cy, cz);

    view.setFloat32(off, nx, true);
    view.setFloat32(off + 4, ny, true);
    view.setFloat32(off + 8, nz, true);
    view.setFloat32(off + 12, ax, true);
    view.setFloat32(off + 16, ay, true);
    view.setFloat32(off + 20, az, true);
    view.setFloat32(off + 24, bx, true);
    view.setFloat32(off + 28, by, true);
    view.setFloat32(off + 32, bz, true);
    view.setFloat32(off + 36, cx, true);
    view.setFloat32(off + 40, cy, true);
    view.setFloat32(off + 44, cz, true);
    view.setUint16(off + 48, 0, true); // attribute byte count
    off += BINARY_STL_FACET_BYTES;
  }

  return buffer;
}

const f = (v: number) => (Object.is(v, -0) ? 0 : v).toExponential(6);

/** ASCII STL — human-readable, and what a few older CAD importers still want. */
export function encodeAsciiStl(mesh: Mesh, name = 'cygnatrix'): string {
  const p = mesh.positions;
  const out: string[] = [`solid ${name}`];
  for (let t = 0; t < mesh.triangleCount; t += 1) {
    const o = t * 9;
    const ax = p[o] ?? 0, ay = p[o + 1] ?? 0, az = p[o + 2] ?? 0;
    const bx = p[o + 3] ?? 0, by = p[o + 4] ?? 0, bz = p[o + 5] ?? 0;
    const cx = p[o + 6] ?? 0, cy = p[o + 7] ?? 0, cz = p[o + 8] ?? 0;
    const [nx, ny, nz] = facetNormal(ax, ay, az, bx, by, bz, cx, cy, cz);
    out.push(`  facet normal ${f(nx)} ${f(ny)} ${f(nz)}`);
    out.push('    outer loop');
    out.push(`      vertex ${f(ax)} ${f(ay)} ${f(az)}`);
    out.push(`      vertex ${f(bx)} ${f(by)} ${f(bz)}`);
    out.push(`      vertex ${f(cx)} ${f(cy)} ${f(cz)}`);
    out.push('    endloop');
    out.push('  endfacet');
  }
  out.push(`endsolid ${name}`);
  return out.join('\n');
}

/**
 * Per-vertex normals equal to the facet normal, for flat-shaded preview. Kept
 * out of `Mesh` because the STL writer derives normals itself and the preview
 * is the only thing that needs them resident.
 */
export function buildFlatNormals(mesh: Mesh): Float32Array {
  const p = mesh.positions;
  const normals = new Float32Array(mesh.triangleCount * 9);
  for (let t = 0; t < mesh.triangleCount; t += 1) {
    const o = t * 9;
    const [nx, ny, nz] = facetNormal(
      p[o] ?? 0, p[o + 1] ?? 0, p[o + 2] ?? 0,
      p[o + 3] ?? 0, p[o + 4] ?? 0, p[o + 5] ?? 0,
      p[o + 6] ?? 0, p[o + 7] ?? 0, p[o + 8] ?? 0,
    );
    for (let v = 0; v < 3; v += 1) {
      normals[o + v * 3] = nx;
      normals[o + v * 3 + 1] = ny;
      normals[o + v * 3 + 2] = nz;
    }
  }
  return normals;
}
