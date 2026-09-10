'use client';

/**
 * Perspective de-warp of a captured page.
 *
 * Inverse mapping: for every output pixel we project back through the homography
 * that maps the output rectangle onto the detected quad, then bilinearly sample
 * the source. One pass, no tiling — so there are no seams or grid artefacts.
 */

import { solveHomography, type Quad } from './geometry';

const UNIT_SQUARE: Quad = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
];

export interface Raster {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

/** Pure warp: `src` raster → new raster of size `outW × outH`. Testable in Node. */
export function warpRaster(src: Raster, quad: Quad, outW: number, outH: number): Raster {
  const w = Math.max(1, Math.round(outW));
  const h = Math.max(1, Math.round(outH));
  const { width: sw, height: sh, data: sd } = src;
  const out = new Uint8ClampedArray(w * h * 4);

  // Maps output-normalised (0..1) → source pixels.
  const m = solveHomography(UNIT_SQUARE, quad);
  const [a, b, c, d, e, f, g, hh, i] = m;

  for (let y = 0; y < h; y += 1) {
    const v = (y + 0.5) / h;
    for (let x = 0; x < w; x += 1) {
      const u = (x + 0.5) / w;
      const den = g * u + hh * v + i || 1e-9;
      const sx = (a * u + b * v + c) / den;
      const sy = (d * u + e * v + f) / den;
      const o = (y * w + x) * 4;

      if (sx < -1 || sy < -1 || sx > sw || sy > sh) {
        out[o] = out[o + 1] = out[o + 2] = 255;
        out[o + 3] = 255;
        continue;
      }
      const cx = sx < 0 ? 0 : sx > sw - 1 ? sw - 1 : sx;
      const cy = sy < 0 ? 0 : sy > sh - 1 ? sh - 1 : sy;
      const x0 = cx | 0;
      const y0 = cy | 0;
      const x1 = x0 + 1 < sw ? x0 + 1 : x0;
      const y1 = y0 + 1 < sh ? y0 + 1 : y0;
      const fx = cx - x0;
      const fy = cy - y0;
      const i00 = (y0 * sw + x0) * 4;
      const i10 = (y0 * sw + x1) * 4;
      const i01 = (y1 * sw + x0) * 4;
      const i11 = (y1 * sw + x1) * 4;
      for (let ch = 0; ch < 3; ch += 1) {
        const top = sd[i00 + ch]! + (sd[i10 + ch]! - sd[i00 + ch]!) * fx;
        const bot = sd[i01 + ch]! + (sd[i11 + ch]! - sd[i01 + ch]!) * fx;
        out[o + ch] = top + (bot - top) * fy;
      }
      out[o + 3] = 255;
    }
  }
  return { data: out, width: w, height: h };
}

/** Rasterise a CanvasImageSource and de-warp it onto a fresh canvas. */
export function warpQuad(
  src: { image: CanvasImageSource; width: number; height: number },
  quad: Quad,
  outW: number,
  outH: number,
): HTMLCanvasElement {
  // Rasterise the source at ~2× the output resolution — a huge memory/time saving
  // for small previews from a 12 MP photo, with no visible quality loss.
  const k = Math.min(1, (Math.max(outW, outH) * 2) / Math.max(src.width, src.height));
  const rw = Math.max(1, Math.round(src.width * k));
  const rh = Math.max(1, Math.round(src.height * k));

  const sc = document.createElement('canvas');
  sc.width = rw;
  sc.height = rh;
  const sctx = sc.getContext('2d', { willReadFrequently: true });
  if (!sctx) throw new Error('Your browser could not create a drawing canvas.');
  sctx.imageSmoothingQuality = 'high';
  sctx.drawImage(src.image, 0, 0, rw, rh);
  const srcData = sctx.getImageData(0, 0, rw, rh);
  sc.width = sc.height = 0;

  const scaledQuad = quad.map((p) => ({ x: p.x * k, y: p.y * k })) as Quad;
  const warped = warpRaster(
    { data: srcData.data, width: srcData.width, height: srcData.height },
    scaledQuad,
    outW,
    outH,
  );

  const oc = document.createElement('canvas');
  oc.width = warped.width;
  oc.height = warped.height;
  const octx = oc.getContext('2d');
  if (!octx) throw new Error('Your browser could not create a drawing canvas.');
  const out = octx.createImageData(warped.width, warped.height);
  out.data.set(warped.data);
  octx.putImageData(out, 0, 0);
  return oc;
}
