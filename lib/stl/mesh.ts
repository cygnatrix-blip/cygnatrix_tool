/**
 * Height field → closed triangle mesh.
 *
 * Everything here exists to keep the result **watertight and consistently
 * wound**, because a slicer will happily produce garbage from a mesh with a
 * hole or a flipped facet and the failure only shows up on the printer. Every
 * surface is therefore generated against a shared perimeter so edges match
 * exactly, and `tests/stl/mesh.test.ts` checks that each directed edge appears
 * exactly once — the condition that proves both properties at the same time.
 */

import type { HeightField, Mesh, StlOptions, StlShape } from './types';

/** Thickness in mm at a grid point, given its 0..1 material value. */
function thicknessAt(value: number, opts: StlOptions): number {
  const base = opts.mode === 'relief' ? Math.max(0, opts.baseThicknessMM) : 0;
  const span = Math.max(0, opts.maxThicknessMM - opts.minThicknessMM);
  return base + opts.minThicknessMM + value * span;
}

class TriangleSink {
  private readonly buf: Float32Array;
  private n = 0;

  constructor(capacity: number) {
    this.buf = new Float32Array(capacity * 9);
  }

  push(
    ax: number, ay: number, az: number,
    bx: number, by: number, bz: number,
    cx: number, cy: number, cz: number,
  ): void {
    const o = this.n * 9;
    this.buf[o] = ax; this.buf[o + 1] = ay; this.buf[o + 2] = az;
    this.buf[o + 3] = bx; this.buf[o + 4] = by; this.buf[o + 5] = bz;
    this.buf[o + 6] = cx; this.buf[o + 7] = cy; this.buf[o + 8] = cz;
    this.n += 1;
  }

  /** Two triangles over a quad given in consistent winding order. */
  quad(
    ax: number, ay: number, az: number,
    bx: number, by: number, bz: number,
    cx: number, cy: number, cz: number,
    dx: number, dy: number, dz: number,
  ): void {
    this.push(ax, ay, az, bx, by, bz, cx, cy, cz);
    this.push(ax, ay, az, cx, cy, cz, dx, dy, dz);
  }

  finish(): Mesh {
    if (this.n * 9 !== this.buf.length) {
      throw new Error(`Mesh built ${this.n} triangles but space was reserved for ${this.buf.length / 9}.`);
    }
    return { positions: this.buf, triangleCount: this.n };
  }
}

/** Exact triangle count for a shape and grid, so buffers are sized up front. */
export function countTriangles(shape: StlShape, nx: number, ny: number): number {
  if (shape === 'cylinder') return 4 * nx * (ny - 1) + 4 * nx;
  if (shape === 'curved') return 4 * (nx - 1) * (ny - 1) + 4 * (nx - 1) + 4 * (ny - 1);
  const perimeter = 2 * (nx - 1) + 2 * (ny - 1);
  return 2 * (nx - 1) * (ny - 1) + 3 * perimeter;
}

/** Physical height in mm, from the explicit value or the grid's aspect ratio. */
export function resolveHeightMM(field: HeightField, opts: StlOptions): number {
  if (opts.heightMM && opts.heightMM > 0) return opts.heightMM;
  return (opts.widthMM * field.height) / field.width;
}

/**
 * A flat plate: displaced top surface, flat back at z = 0, vertical walls.
 *
 * The back is a fan from the centre out to the *same* perimeter vertices the
 * walls use, rather than two big corner-to-corner triangles. Two triangles
 * would leave the wall meeting a long edge with no matching vertices along it,
 * which is exactly the kind of near-invisible crack that makes a slicer fail.
 */
function buildFlat(field: HeightField, opts: StlOptions): Mesh {
  const nx = field.width;
  const ny = field.height;
  const W = opts.widthMM;
  const H = resolveHeightMM(field, opts);
  const sink = new TriangleSink(countTriangles('flat', nx, ny));

  const xAt = (i: number) => -W / 2 + (i / (nx - 1)) * W;
  const yAt = (j: number) => H / 2 - (j / (ny - 1)) * H;
  const zAt = (i: number, j: number) => thicknessAt(field.data[j * nx + i] ?? 0, opts);

  // Top surface, wound CCW seen from +z.
  for (let j = 0; j < ny - 1; j += 1) {
    for (let i = 0; i < nx - 1; i += 1) {
      const x0 = xAt(i), x1 = xAt(i + 1);
      const y0 = yAt(j), y1 = yAt(j + 1);
      sink.quad(
        x0, y1, zAt(i, j + 1),
        x1, y1, zAt(i + 1, j + 1),
        x1, y0, zAt(i + 1, j),
        x0, y0, zAt(i, j),
      );
    }
  }

  // Perimeter, CCW seen from +z, with no vertex repeated.
  const perim: Array<[number, number]> = [];
  for (let i = 0; i < nx - 1; i += 1) perim.push([i, ny - 1]);
  for (let j = ny - 1; j > 0; j -= 1) perim.push([nx - 1, j]);
  for (let i = nx - 1; i > 0; i -= 1) perim.push([i, 0]);
  for (let j = 0; j < ny - 1; j += 1) perim.push([0, j]);

  // Flat back: fan from the centre, wound CW seen from +z so it faces -z.
  for (let k = 0; k < perim.length; k += 1) {
    const a = perim[k]!;
    const b = perim[(k + 1) % perim.length]!;
    sink.push(
      0, 0, 0,
      xAt(b[0]), yAt(b[1]), 0,
      xAt(a[0]), yAt(a[1]), 0,
    );
  }

  // Side walls, outward-facing.
  for (let k = 0; k < perim.length; k += 1) {
    const a = perim[k]!;
    const b = perim[(k + 1) % perim.length]!;
    const ax = xAt(a[0]), ay = yAt(a[1]);
    const bx = xAt(b[0]), by = yAt(b[1]);
    sink.quad(
      ax, ay, 0,
      bx, by, 0,
      bx, by, zAt(b[0], b[1]),
      ax, ay, zAt(a[0], a[1]),
    );
  }

  return sink.finish();
}

/**
 * A curved panel or a full cylinder: the image wraps around the Z axis, so the
 * model stands on the bed the way it has to be printed. The inner wall stays at
 * a constant radius and the image displaces the outer one.
 */
function buildArc(field: HeightField, opts: StlOptions, closed: boolean): Mesh {
  const nx = field.width;
  const ny = field.height;
  const H = resolveHeightMM(field, opts);
  const sweep = closed
    ? Math.PI * 2
    : (Math.max(1, Math.min(359, opts.curveDegrees)) * Math.PI) / 180;
  // widthMM is the arc length of the inner surface, so the image keeps the
  // scale the user asked for rather than the radius dictating it.
  const innerR = opts.widthMM / sweep;

  const sink = new TriangleSink(countTriangles(closed ? 'cylinder' : 'curved', nx, ny));

  // A closed tube reuses column 0 as the far edge instead of duplicating it,
  // which is what makes the seam actually close.
  const columns = closed ? nx : nx - 1;
  const step = closed ? sweep / nx : sweep / (nx - 1);
  const theta = (i: number) => -sweep / 2 + i * step;
  const zAt = (j: number) => H - (j / (ny - 1)) * H;
  const outerR = (i: number, j: number) => innerR + thicknessAt(field.data[j * nx + (i % nx)] ?? 0, opts);

  const pt = (r: number, t: number, z: number): [number, number, number] => [r * Math.cos(t), r * Math.sin(t), z];

  for (let i = 0; i < columns; i += 1) {
    const i2 = closed ? (i + 1) % nx : i + 1;
    const t1 = theta(i);
    const t2 = theta(i + 1);

    for (let j = 0; j < ny - 1; j += 1) {
      const zTop = zAt(j);
      const zBot = zAt(j + 1);
      const [oax, oay, oaz] = pt(outerR(i, j), t1, zTop);
      const [obx, oby, obz] = pt(outerR(i2, j), t2, zTop);
      const [ocx, ocy, ocz] = pt(outerR(i2, j + 1), t2, zBot);
      const [odx, ody, odz] = pt(outerR(i, j + 1), t1, zBot);
      // Outer skin faces away from the axis.
      sink.quad(oax, oay, oaz, odx, ody, odz, ocx, ocy, ocz, obx, oby, obz);

      const [iax, iay, iaz] = pt(innerR, t1, zTop);
      const [ibx, iby, ibz] = pt(innerR, t2, zTop);
      const [icx, icy, icz] = pt(innerR, t2, zBot);
      const [idx, idy, idz] = pt(innerR, t1, zBot);
      // Inner skin faces the axis — the same quad wound the other way.
      sink.quad(iax, iay, iaz, ibx, iby, ibz, icx, icy, icz, idx, idy, idz);
    }

    // Rims close the tube at top and bottom.
    const [otax, otay, otaz] = pt(outerR(i, 0), t1, zAt(0));
    const [otbx, otby, otbz] = pt(outerR(i2, 0), t2, zAt(0));
    const [itax, itay, itaz] = pt(innerR, t1, zAt(0));
    const [itbx, itby, itbz] = pt(innerR, t2, zAt(0));
    sink.quad(otax, otay, otaz, otbx, otby, otbz, itbx, itby, itbz, itax, itay, itaz);

    const jb = ny - 1;
    const [obax, obay, obaz] = pt(outerR(i, jb), t1, zAt(jb));
    const [obbx, obby, obbz] = pt(outerR(i2, jb), t2, zAt(jb));
    const [ibax, ibay, ibaz] = pt(innerR, t1, zAt(jb));
    const [ibbx, ibby, ibbz] = pt(innerR, t2, zAt(jb));
    sink.quad(obax, obay, obaz, ibax, ibay, ibaz, ibbx, ibby, ibbz, obbx, obby, obbz);
  }

  if (!closed) {
    // End caps on the two cut edges of the arc.
    for (let j = 0; j < ny - 1; j += 1) {
      const zTop = zAt(j);
      const zBot = zAt(j + 1);

      const tStart = theta(0);
      const [s_ot_x, s_ot_y, s_ot_z] = pt(outerR(0, j), tStart, zTop);
      const [s_ob_x, s_ob_y, s_ob_z] = pt(outerR(0, j + 1), tStart, zBot);
      const [s_it_x, s_it_y, s_it_z] = pt(innerR, tStart, zTop);
      const [s_ib_x, s_ib_y, s_ib_z] = pt(innerR, tStart, zBot);
      sink.quad(s_ot_x, s_ot_y, s_ot_z, s_it_x, s_it_y, s_it_z, s_ib_x, s_ib_y, s_ib_z, s_ob_x, s_ob_y, s_ob_z);

      const tEnd = theta(nx - 1);
      const [e_ot_x, e_ot_y, e_ot_z] = pt(outerR(nx - 1, j), tEnd, zTop);
      const [e_ob_x, e_ob_y, e_ob_z] = pt(outerR(nx - 1, j + 1), tEnd, zBot);
      const [e_it_x, e_it_y, e_it_z] = pt(innerR, tEnd, zTop);
      const [e_ib_x, e_ib_y, e_ib_z] = pt(innerR, tEnd, zBot);
      sink.quad(e_ot_x, e_ot_y, e_ot_z, e_ob_x, e_ob_y, e_ob_z, e_ib_x, e_ib_y, e_ib_z, e_it_x, e_it_y, e_it_z);
    }
  }

  return sink.finish();
}

export function buildMesh(field: HeightField, opts: StlOptions): Mesh {
  if (opts.shape === 'cylinder') return buildArc(field, opts, true);
  if (opts.shape === 'curved') return buildArc(field, opts, false);
  return buildFlat(field, opts);
}

export interface MeshBounds {
  min: [number, number, number];
  max: [number, number, number];
}

export function meshBounds(mesh: Mesh): MeshBounds {
  const p = mesh.positions;
  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < mesh.triangleCount * 9; i += 3) {
    for (let a = 0; a < 3; a += 1) {
      const v = p[i + a] ?? 0;
      if (v < min[a]!) min[a] = v;
      if (v > max[a]!) max[a] = v;
    }
  }
  return { min, max };
}

/**
 * Signed volume via the divergence theorem. Positive means the facets face
 * outward; negative means the whole mesh is inside out. Also the honest way to
 * quote how much filament a print will take.
 */
export function signedVolumeMM3(mesh: Mesh): number {
  const p = mesh.positions;
  let v6 = 0;
  for (let t = 0; t < mesh.triangleCount; t += 1) {
    const o = t * 9;
    const ax = p[o] ?? 0, ay = p[o + 1] ?? 0, az = p[o + 2] ?? 0;
    const bx = p[o + 3] ?? 0, by = p[o + 4] ?? 0, bz = p[o + 5] ?? 0;
    const cx = p[o + 6] ?? 0, cy = p[o + 7] ?? 0, cz = p[o + 8] ?? 0;
    v6 += ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx);
  }
  return v6 / 6;
}
