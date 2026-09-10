import { describe, expect, it } from 'vitest';
import { warpRaster, type Raster } from '@/lib/scanner/warp';
import type { Quad } from '@/lib/scanner/geometry';

/** RGBA raster with a solid `fg` rectangle over a `bg` field. */
function rasterWithRect(
  w: number,
  h: number,
  r: { x0: number; y0: number; x1: number; y1: number },
  bg = 30,
  fg = 210,
): Raster {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const inside = x >= r.x0 && x < r.x1 && y >= r.y0 && y < r.y1;
      const v = inside ? fg : bg;
      const p = (y * w + x) * 4;
      data[p] = data[p + 1] = data[p + 2] = v;
      data[p + 3] = 255;
    }
  }
  return { data, width: w, height: h };
}

/** Stats over the interior only — edge pixels legitimately blend at the quad boundary. */
function interiorStats(r: Raster, border = 4) {
  let min = 255;
  let max = 0;
  let sum = 0;
  let n = 0;
  for (let y = border; y < r.height - border; y += 1) {
    for (let x = border; x < r.width - border; x += 1) {
      const v = r.data[(y * r.width + x) * 4]!;
      if (v < min) min = v;
      if (v > max) max = v;
      sum += v;
      n += 1;
    }
  }
  return { min, max, mean: sum / n };
}

describe('warpRaster', () => {
  it('de-warps the quad region to fill the whole output — no grid seams', () => {
    const src = rasterWithRect(400, 520, { x0: 55, y0: 35, x1: 345, y1: 475 });
    // quad sits strictly inside the bright rectangle
    const quad: Quad = [
      { x: 62, y: 42 },
      { x: 338, y: 42 },
      { x: 338, y: 468 },
      { x: 62, y: 468 },
    ];
    const out = warpRaster(src, quad, 280, 430);
    expect(out.width).toBe(280);
    expect(out.height).toBe(430);

    // The interior should be the rectangle's colour, uniformly — a tiling
    // artefact would show up as dark seam pixels dragging the min down.
    const { min, max, mean } = interiorStats(out);
    expect(mean).toBeGreaterThan(200);
    expect(min).toBeGreaterThan(195);
    expect(max - min).toBeLessThan(12);
  });

  it('recovers a skewed quad into an axis-aligned rectangle', () => {
    // fg rectangle plus a marker stripe on its left third
    const w = 400;
    const h = 400;
    const data = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const p = (y * w + x) * 4;
        let v = 20;
        if (x >= 40 && x < 360 && y >= 40 && y < 360) v = x < 140 ? 120 : 230;
        data[p] = data[p + 1] = data[p + 2] = v;
        data[p + 3] = 255;
      }
    }
    const quad: Quad = [
      { x: 50, y: 44 },
      { x: 356, y: 60 },
      { x: 348, y: 356 },
      { x: 44, y: 344 },
    ];
    const out = warpRaster({ data, width: w, height: h }, quad, 300, 300);
    // Left column should land on the darker stripe, right column on the bright field.
    const at = (x: number, y: number) => out.data[(y * out.width + x) * 4]!;
    expect(at(15, 150)).toBeLessThan(180);
    expect(at(285, 150)).toBeGreaterThan(190);
  });
});
