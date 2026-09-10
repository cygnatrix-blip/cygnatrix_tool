'use client';

/**
 * Perspective de-warp of a captured page. Maps the unit square onto the detected
 * quad with a homography, then renders it as a fine grid of texture-mapped
 * triangles on a 2-D canvas — perspective-correct to within a fraction of a
 * pixel at grid 24, and works everywhere without WebGL.
 */

import { applyMatrix, solveHomography, type Pt, type Quad } from './geometry';

export interface WarpSource {
  image: CanvasImageSource;
  width: number;
  height: number;
}

export function warpQuad(src: WarpSource, quad: Quad, outW: number, outH: number, grid = 24): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(outW));
  canvas.height = Math.max(1, Math.round(outH));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser could not create a drawing canvas.');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // unit square → source-pixel quad
  const h = solveHomography(
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ],
    quad,
  );

  const cw = canvas.width;
  const ch = canvas.height;

  for (let j = 0; j < grid; j += 1) {
    for (let i = 0; i < grid; i += 1) {
      const u0 = i / grid;
      const u1 = (i + 1) / grid;
      const v0 = j / grid;
      const v1 = (j + 1) / grid;

      const dst = [
        { x: u0 * cw, y: v0 * ch },
        { x: u1 * cw, y: v0 * ch },
        { x: u1 * cw, y: v1 * ch },
        { x: u0 * cw, y: v1 * ch },
      ];
      const s00 = applyMatrix(h, { x: u0, y: v0 });
      const s10 = applyMatrix(h, { x: u1, y: v0 });
      const s11 = applyMatrix(h, { x: u1, y: v1 });
      const s01 = applyMatrix(h, { x: u0, y: v1 });

      drawTriangle(ctx, src.image, [s00, s10, s11], [dst[0]!, dst[1]!, dst[2]!]);
      drawTriangle(ctx, src.image, [s00, s11, s01], [dst[0]!, dst[2]!, dst[3]!]);
    }
  }
  return canvas;
}

/** Affine-map a source triangle onto a destination triangle, clipped to it. */
function drawTriangle(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  s: [Pt, Pt, Pt],
  d: [Pt, Pt, Pt],
): void {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(d[0].x, d[0].y);
  ctx.lineTo(d[1].x, d[1].y);
  ctx.lineTo(d[2].x, d[2].y);
  ctx.closePath();
  // Overlap neighbouring triangles very slightly to hide seams.
  ctx.clip();

  const [s0, s1, s2] = s;
  const [d0, d1, d2] = d;
  const denom =
    (s1.x - s0.x) * (s2.y - s0.y) - (s2.x - s0.x) * (s1.y - s0.y) || 1e-9;
  const a = ((d1.x - d0.x) * (s2.y - s0.y) - (d2.x - d0.x) * (s1.y - s0.y)) / denom;
  const b = ((d2.x - d0.x) * (s1.x - s0.x) - (d1.x - d0.x) * (s2.x - s0.x)) / denom;
  const c = ((d1.y - d0.y) * (s2.y - s0.y) - (d2.y - d0.y) * (s1.y - s0.y)) / denom;
  const e = ((d2.y - d0.y) * (s1.x - s0.x) - (d1.y - d0.y) * (s2.x - s0.x)) / denom;
  const tx = d0.x - a * s0.x - b * s0.y;
  const ty = d0.y - c * s0.x - e * s0.y;

  ctx.setTransform(a, c, b, e, tx, ty);
  ctx.drawImage(image, 0, 0);
  ctx.restore();
}
