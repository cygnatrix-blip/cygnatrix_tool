/**
 * Image → height field. Pure maths on typed arrays, no DOM, so it runs
 * identically in a worker and under the unit tests.
 */

import type { HeightField, StlOptions } from './types';

/** Rec. 709 luma — matches how the eye weights the channels. */
export function luminance(r: number, g: number, b: number): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/**
 * RGBA → 0..1 luminance, resampled to fit within `maxSamples` on the longer
 * edge by box-averaging whole source blocks.
 *
 * Averaging rather than point-sampling matters here: a lithophane turns every
 * sample into geometry, so a dropped pixel is a visible dent, and aliasing that
 * would be invisible on screen prints as banding.
 */
export function sampleLuminance(
  rgba: Uint8ClampedArray,
  srcWidth: number,
  srcHeight: number,
  maxSamples: number,
): HeightField {
  const scale = Math.min(1, maxSamples / Math.max(srcWidth, srcHeight));
  const width = Math.max(2, Math.round(srcWidth * scale));
  const height = Math.max(2, Math.round(srcHeight * scale));
  const data = new Float32Array(width * height);

  for (let y = 0; y < height; y += 1) {
    const y0 = Math.floor((y * srcHeight) / height);
    const y1 = Math.max(y0 + 1, Math.floor(((y + 1) * srcHeight) / height));
    for (let x = 0; x < width; x += 1) {
      const x0 = Math.floor((x * srcWidth) / width);
      const x1 = Math.max(x0 + 1, Math.floor(((x + 1) * srcWidth) / width));
      let sum = 0;
      let n = 0;
      for (let sy = y0; sy < y1; sy += 1) {
        for (let sx = x0; sx < x1; sx += 1) {
          const i = (sy * srcWidth + sx) * 4;
          const a = (rgba[i + 3] ?? 255) / 255;
          // Composite onto white: a transparent pixel is "no material", which
          // reads as the brightest value, not as black.
          const r = (rgba[i] ?? 0) * a + 255 * (1 - a);
          const g = (rgba[i + 1] ?? 0) * a + 255 * (1 - a);
          const b = (rgba[i + 2] ?? 0) * a + 255 * (1 - a);
          sum += luminance(r, g, b);
          n += 1;
        }
      }
      data[y * width + x] = n > 0 ? sum / n : 1;
    }
  }
  return { width, height, data };
}

/** Separable box blur, repeated twice to approximate a Gaussian. */
export function boxBlur(field: HeightField, radius: number, passes = 2): HeightField {
  const r = Math.max(0, Math.round(radius));
  if (r === 0) return field;
  const { width, height } = field;
  // Both buffers are allocated the same way so the ping-pong swap below keeps
  // one type throughout.
  let src = Float32Array.from(field.data);
  let dst = new Float32Array(src.length);

  for (let pass = 0; pass < passes; pass += 1) {
    // horizontal
    for (let y = 0; y < height; y += 1) {
      const row = y * width;
      for (let x = 0; x < width; x += 1) {
        let sum = 0;
        let n = 0;
        for (let k = -r; k <= r; k += 1) {
          const xx = x + k;
          if (xx < 0 || xx >= width) continue;
          sum += src[row + xx] ?? 0;
          n += 1;
        }
        dst[row + x] = sum / n;
      }
    }
    [src, dst] = [dst, src];
    // vertical
    for (let x = 0; x < width; x += 1) {
      for (let y = 0; y < height; y += 1) {
        let sum = 0;
        let n = 0;
        for (let k = -r; k <= r; k += 1) {
          const yy = y + k;
          if (yy < 0 || yy >= height) continue;
          sum += src[yy * width + x] ?? 0;
          n += 1;
        }
        dst[y * width + x] = sum / n;
      }
    }
    [src, dst] = [dst, src];
  }

  return { width, height, data: src };
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * Brightness, contrast and gamma, applied in that order to 0..1 luminance.
 * Contrast pivots on mid-grey so it opens or closes the range symmetrically.
 */
export function applyTone(
  field: HeightField,
  opts: Pick<StlOptions, 'brightness' | 'contrast' | 'gamma'>,
): HeightField {
  const b = opts.brightness / 100;
  const c = Math.max(-0.99, Math.min(0.99, opts.contrast / 100));
  const cFactor = (1 + c) / (1 - c);
  const gamma = Math.max(0.1, Math.min(4, opts.gamma));
  const data = field.data;
  for (let i = 0; i < data.length; i += 1) {
    let v = clamp01((data[i] ?? 0) + b);
    v = clamp01((v - 0.5) * cFactor + 0.5);
    data[i] = clamp01(Math.pow(v, gamma));
  }
  return field;
}

export function flipX(field: HeightField): HeightField {
  const { width, height, data } = field;
  const half = Math.floor(width / 2);
  for (let y = 0; y < height; y += 1) {
    const row = y * width;
    for (let x = 0; x < half; x += 1) {
      const a = row + x;
      const b = row + width - 1 - x;
      const t = data[a] ?? 0;
      data[a] = data[b] ?? 0;
      data[b] = t;
    }
  }
  return field;
}

/**
 * Luminance → the 0..1 "material" value the mesh is built from, where 1 is
 * always the thickest point.
 *
 * A lithophane inverts: light shines through the thin parts, so a dark pixel
 * has to be the thick one. A relief does not: bright stands proud.
 */
export function toMaterial(field: HeightField, mode: StlOptions['mode'], invert: boolean): HeightField {
  const flip = mode === 'lithophane' ? !invert : invert;
  if (!flip) return field;
  const data = field.data;
  for (let i = 0; i < data.length; i += 1) data[i] = 1 - (data[i] ?? 0);
  return field;
}

/**
 * Forces a solid frame of `borderSamples` around the edge to full thickness.
 *
 * On a lithophane this is structural as much as decorative: the thin interior
 * warps and curls as it cools, and a thick rim holds it flat. Doing it in the
 * field rather than the mesh keeps the geometry a plain height map.
 */
export function applyBorder(field: HeightField, borderSamples: number): HeightField {
  const b = Math.max(0, Math.round(borderSamples));
  if (b === 0) return field;
  const { width, height, data } = field;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (x < b || y < b || x >= width - b || y >= height - b) data[y * width + x] = 1;
    }
  }
  return field;
}

/** Runs the whole image → material-field pipeline in the right order. */
export function buildHeightField(
  rgba: Uint8ClampedArray,
  srcWidth: number,
  srcHeight: number,
  opts: StlOptions,
): HeightField {
  let field = sampleLuminance(rgba, srcWidth, srcHeight, opts.maxSamples);
  if (opts.flipHorizontal) field = flipX(field);
  field = applyTone(field, opts);
  field = boxBlur(field, opts.smooth);
  field = toMaterial(field, opts.mode, opts.invert);
  if (opts.borderMM > 0) {
    const mmPerSample = opts.widthMM / field.width;
    field = applyBorder(field, opts.borderMM / mmPerSample);
  }
  return field;
}
