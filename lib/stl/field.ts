/**
 * Image → height field. Pure maths on typed arrays, no DOM, so it runs
 * identically in a worker and under the unit tests.
 */

import { buildMask, maskOptionsFor, pruneIsolated } from './outline';
import type { GrayMethod, HeightField, StlOptions } from './types';

/** Rec. 709 luma — matches how the eye weights the channels. */
export function luminance(r: number, g: number, b: number): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/**
 * Colour → one brightness value. Which rule is right depends on the picture:
 * luminance matches the eye and suits photographs, but it drives saturated
 * reds and blues almost to black, which wrecks a logo that looked fine on
 * screen. Averaging and lightness keep those readable.
 */
export function grayOf(r: number, g: number, b: number, method: GrayMethod, threshold = 0.5): number {
  switch (method) {
    case 'average':
      return (r + g + b) / 3 / 255;
    case 'lightness':
      return (Math.max(r, g, b) + Math.min(r, g, b)) / 2 / 255;
    case 'threshold':
      return luminance(r, g, b) >= threshold ? 1 : 0;
    case 'luminance':
    default:
      return luminance(r, g, b);
  }
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
  method: GrayMethod = 'luminance',
  threshold = 0.5,
  region?: { x: number; y: number; w: number; h: number },
): HeightField {
  // Crop first, so detail is spent on the part that is actually printed.
  const rx = Math.max(0, Math.min(srcWidth - 1, Math.round((region?.x ?? 0) * srcWidth)));
  const ry = Math.max(0, Math.min(srcHeight - 1, Math.round((region?.y ?? 0) * srcHeight)));
  const rw = Math.max(1, Math.min(srcWidth - rx, Math.round((region?.w ?? 1) * srcWidth)));
  const rh = Math.max(1, Math.min(srcHeight - ry, Math.round((region?.h ?? 1) * srcHeight)));

  const scale = Math.min(1, maxSamples / Math.max(rw, rh));
  const width = Math.max(2, Math.round(rw * scale));
  const height = Math.max(2, Math.round(rh * scale));
  const data = new Float32Array(width * height);

  for (let y = 0; y < height; y += 1) {
    const y0 = ry + Math.floor((y * rh) / height);
    const y1 = ry + Math.max(Math.floor((y * rh) / height) + 1, Math.floor(((y + 1) * rh) / height));
    for (let x = 0; x < width; x += 1) {
      const x0 = rx + Math.floor((x * rw) / width);
      const x1 = rx + Math.max(Math.floor((x * rw) / width) + 1, Math.floor(((x + 1) * rw) / width));
      let sum = 0;
      let n = 0;
      for (let sy = y0; sy < Math.min(y1, ry + rh); sy += 1) {
        for (let sx = x0; sx < Math.min(x1, rx + rw); sx += 1) {
          const i = (sy * srcWidth + sx) * 4;
          const a = (rgba[i + 3] ?? 255) / 255;
          // Composite onto white: a transparent pixel is "no material", which
          // reads as the brightest value, not as black.
          const r = (rgba[i] ?? 0) * a + 255 * (1 - a);
          const g = (rgba[i + 1] ?? 0) * a + 255 * (1 - a);
          const b = (rgba[i + 2] ?? 0) * a + 255 * (1 - a);
          sum += grayOf(r, g, b, method, threshold);
          n += 1;
        }
      }
      data[y * width + x] = n > 0 ? sum / n : 1;
    }
  }
  return { width, height, data };
}

/** Quarter turns clockwise, applied before anything else measures the grid. */
export function rotateQuarters(field: HeightField, quarters: number): HeightField {
  const q = ((Math.round(quarters) % 4) + 4) % 4;
  if (q === 0) return field;
  let cur = field;
  for (let step = 0; step < q; step += 1) {
    const { width, height, data } = cur;
    const out = new Float32Array(data.length);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        // 90° clockwise: (x, y) → (height-1-y, x) in the transposed grid.
        out[x * height + (height - 1 - y)] = data[y * width + x] ?? 0;
      }
    }
    cur = { width: height, height: width, data: out };
  }
  return cur;
}

/**
 * Unsharp mask. Smoothing kills print-through noise but takes edge definition
 * with it; adding back the difference between the image and a blurred copy
 * restores the edges without reinstating the noise.
 */
export function sharpen(field: HeightField, amount: number): HeightField {
  const a = Math.max(0, Math.min(100, amount)) / 100;
  if (a === 0) return field;
  const blurred = boxBlur({ ...field, data: Float32Array.from(field.data) }, 2, 1);
  const data = field.data;
  for (let i = 0; i < data.length; i += 1) {
    const v = (data[i] ?? 0) + a * ((data[i] ?? 0) - (blurred.data[i] ?? 0)) * 1.5;
    data[i] = v < 0 ? 0 : v > 1 ? 1 : v;
  }
  return field;
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

/**
 * Joins several fields side by side into one.
 *
 * This is what makes a multi-photo lamp shade possible: four images wrapped
 * around a cylinder are one continuous model, not four panels. Each is scaled
 * to a common height so they line up, and the mask (if any) is carried across
 * so a silhouette still applies to the whole.
 */
export function stitchFields(fields: HeightField[], opts: StlOptions): HeightField {
  const kept = fields.filter((f) => f.width > 0 && f.height > 0);
  if (kept.length === 0) throw new Error('No image to build from.');
  if (kept.length === 1) return kept[0]!;

  const height = Math.max(...kept.map((f) => f.height));
  const scaled = kept.map((f) => {
    if (f.height === height) return f;
    // Nearest-neighbour is enough here: these grids are already the result of
    // a box-averaged downsample, so there is no aliasing left to introduce.
    const width = Math.max(2, Math.round((f.width * height) / f.height));
    const data = new Float32Array(width * height);
    const mask = f.mask ? new Uint8Array(width * height) : undefined;
    for (let y = 0; y < height; y += 1) {
      const sy = Math.min(f.height - 1, Math.floor((y * f.height) / height));
      for (let x = 0; x < width; x += 1) {
        const sx = Math.min(f.width - 1, Math.floor((x * f.width) / width));
        data[y * width + x] = f.data[sy * f.width + sx] ?? 0;
        if (mask && f.mask) mask[y * width + x] = f.mask[sy * f.width + sx] ?? 1;
      }
    }
    return { width, height, data, mask };
  });

  const total = scaled.reduce((a, f) => a + f.width, 0);
  const data = new Float32Array(total * height);
  const anyMask = scaled.some((f) => f.mask);
  const mask = anyMask ? new Uint8Array(total * height) : undefined;

  let xOffset = 0;
  for (const f of scaled) {
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < f.width; x += 1) {
        data[y * total + xOffset + x] = f.data[y * f.width + x] ?? 0;
        if (mask) mask[y * total + xOffset + x] = f.mask ? (f.mask[y * f.width + x] ?? 1) : 1;
      }
    }
    xOffset += f.width;
  }

  const out: HeightField = { width: total, height, data, mask };
  // The border was applied per image; re-apply it so the joined panel has one
  // rim rather than a seam between every pair.
  if (opts.borderMM > 0) {
    const mmPerSample = opts.widthMM / total;
    return applyBorder(out, opts.borderMM / mmPerSample);
  }
  return out;
}

/**
 * Runs the whole image → material-field pipeline.
 *
 * Order matters: crop and rotate first so resolution is spent only on what is
 * printed, tone before blur so adjustments act on real detail, sharpen after
 * blur to put back the edges it took, and the silhouette last so a mask is
 * never smeared by a filter.
 */
export function buildHeightField(
  rgba: Uint8ClampedArray,
  srcWidth: number,
  srcHeight: number,
  opts: StlOptions,
): HeightField {
  let field = sampleLuminance(
    rgba,
    srcWidth,
    srcHeight,
    opts.maxSamples,
    opts.grayMethod,
    opts.thresholdAt,
    opts.crop,
  );
  field = rotateQuarters(field, opts.rotateQuarter);
  if (opts.flipHorizontal) field = flipX(field);
  field = applyTone(field, opts);
  field = boxBlur(field, opts.smooth);
  field = sharpen(field, opts.sharpen);
  field = toMaterial(field, opts.mode, opts.invert);

  if (opts.borderMM > 0) {
    const mmPerSample = opts.widthMM / field.width;
    field = applyBorder(field, opts.borderMM / mmPerSample);
  }

  // Only a flat panel has a silhouette; a cylinder's outline is its sweep.
  if (opts.shape === 'flat') {
    const heightMM =
      opts.heightMM && opts.heightMM > 0 ? opts.heightMM : (opts.widthMM * field.height) / field.width;
    const mask = buildMask(field.width, field.height, maskOptionsFor(opts, opts.widthMM, heightMM));
    if (mask) field = { ...field, mask: pruneIsolated(mask, field.width, field.height) };
  }

  return field;
}
