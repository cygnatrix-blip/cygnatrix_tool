import { describe, expect, it } from 'vitest';
import {
  applyBorder,
  applyTone,
  boxBlur,
  buildHeightField,
  flipX,
  luminance,
  sampleLuminance,
  toMaterial,
} from '@/lib/stl/field';
import { DEFAULT_STL_OPTIONS, type HeightField, type StlOptions } from '@/lib/stl/types';

function rgba(width: number, height: number, fn: (x: number, y: number) => [number, number, number, number]) {
  const out = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const [r, g, b, a] = fn(x, y);
      const i = (y * width + x) * 4;
      out[i] = r; out[i + 1] = g; out[i + 2] = b; out[i + 3] = a;
    }
  }
  return out;
}

const field = (width: number, height: number, values: number[]): HeightField => ({
  width,
  height,
  data: Float32Array.from(values),
});

const opts = (over: Partial<StlOptions> = {}): StlOptions => ({ ...DEFAULT_STL_OPTIONS, ...over });

describe('luminance', () => {
  it('maps black to 0 and white to 1', () => {
    expect(luminance(0, 0, 0)).toBe(0);
    expect(luminance(255, 255, 255)).toBeCloseTo(1, 6);
  });

  it('weights green above red above blue, as the eye does', () => {
    expect(luminance(0, 255, 0)).toBeGreaterThan(luminance(255, 0, 0));
    expect(luminance(255, 0, 0)).toBeGreaterThan(luminance(0, 0, 255));
  });
});

describe('sampleLuminance', () => {
  it('caps the longer edge at maxSamples and keeps the aspect ratio', () => {
    const src = rgba(400, 200, () => [128, 128, 128, 255]);
    const f = sampleLuminance(src, 400, 200, 100);
    expect(f.width).toBe(100);
    expect(f.height).toBe(50);
  });

  it('never upscales a small image', () => {
    const src = rgba(20, 10, () => [0, 0, 0, 255]);
    const f = sampleLuminance(src, 20, 10, 500);
    expect(f.width).toBe(20);
    expect(f.height).toBe(10);
  });

  it('averages whole blocks rather than point-sampling', () => {
    // Alternating black and white columns must average to mid-grey, not
    // alias to whichever column the sample happened to land on.
    const src = rgba(8, 2, (x) => (x % 2 === 0 ? [0, 0, 0, 255] : [255, 255, 255, 255]));
    const f = sampleLuminance(src, 8, 2, 4);
    for (const v of f.data) expect(v).toBeCloseTo(0.5, 2);
  });

  it('treats transparency as empty space, not as black', () => {
    const src = rgba(4, 4, () => [0, 0, 0, 0]);
    const f = sampleLuminance(src, 4, 4, 4);
    for (const v of f.data) expect(v).toBeCloseTo(1, 6);
  });
});

describe('applyTone', () => {
  it('brightness shifts every sample and clamps at the ends', () => {
    const f = applyTone(field(3, 1, [0, 0.5, 1]), { brightness: 50, contrast: 0, gamma: 1 });
    expect(f.data[0]).toBeCloseTo(0.5, 6);
    expect(f.data[2]).toBe(1);
  });

  it('contrast pivots on mid-grey, leaving it untouched', () => {
    const f = applyTone(field(3, 1, [0.2, 0.5, 0.8]), { brightness: 0, contrast: 50, gamma: 1 });
    expect(f.data[1]).toBeCloseTo(0.5, 6);
    expect(f.data[0]!).toBeLessThan(0.2);
    expect(f.data[2]!).toBeGreaterThan(0.8);
  });

  it('gamma moves the midtones but pins both ends', () => {
    const f = applyTone(field(3, 1, [0, 0.5, 1]), { brightness: 0, contrast: 0, gamma: 2 });
    expect(f.data[0]).toBe(0);
    expect(f.data[1]).toBeCloseTo(0.25, 6);
    expect(f.data[2]).toBe(1);
  });
});

describe('boxBlur', () => {
  it('is a no-op at radius 0', () => {
    const f = boxBlur(field(3, 1, [0, 1, 0]), 0);
    expect(Array.from(f.data)).toEqual([0, 1, 0]);
  });

  it('spreads an isolated spike into its neighbours', () => {
    const f = boxBlur(field(5, 1, [0, 0, 1, 0, 0]), 1);
    expect(f.data[2]!).toBeLessThan(1);
    expect(f.data[1]!).toBeGreaterThan(0);
    expect(f.data[3]!).toBeGreaterThan(0);
  });

  it('never overshoots the input range, so it cannot invent extra thickness', () => {
    // Averaging shrinks the window at the edges rather than wrapping or
    // clamping to black, so the total is not conserved — but no sample may
    // ever land outside the range the image actually contained.
    const before = [0.1, 0.9, 0.3, 0.7, 0.5];
    const after = boxBlur(field(5, 1, before), 1);
    for (const v of after.data) {
      expect(v).toBeGreaterThanOrEqual(Math.min(...before));
      expect(v).toBeLessThanOrEqual(Math.max(...before));
    }
  });
});

describe('toMaterial', () => {
  it('inverts for a lithophane — dark pixels must become the thick ones', () => {
    const f = toMaterial(field(2, 1, [0, 1]), 'lithophane', false);
    expect(f.data[0]).toBe(1);
    expect(f.data[1]).toBe(0);
  });

  it('leaves a relief alone — bright pixels stand tall', () => {
    const f = toMaterial(field(2, 1, [0, 1]), 'relief', false);
    expect(f.data[0]).toBe(0);
    expect(f.data[1]).toBe(1);
  });

  it('the invert switch flips whichever default applies', () => {
    expect(toMaterial(field(1, 1, [0]), 'lithophane', true).data[0]).toBe(0);
    expect(toMaterial(field(1, 1, [0]), 'relief', true).data[0]).toBe(1);
  });
});

describe('applyBorder', () => {
  it('drives the outer ring to full thickness and leaves the centre alone', () => {
    const f = applyBorder(field(5, 5, Array(25).fill(0)), 1);
    expect(f.data[0]).toBe(1); // corner
    expect(f.data[2]).toBe(1); // top edge
    expect(f.data[12]).toBe(0); // centre
  });

  it('does nothing at width 0', () => {
    const f = applyBorder(field(3, 3, Array(9).fill(0.25)), 0);
    expect(Array.from(f.data).every((v) => v === 0.25)).toBe(true);
  });
});

describe('flipX', () => {
  it('mirrors each row', () => {
    const f = flipX(field(3, 2, [1, 2, 3, 4, 5, 6]));
    expect(Array.from(f.data)).toEqual([3, 2, 1, 6, 5, 4]);
  });
});

describe('buildHeightField', () => {
  it('turns a dark image into thick material for a lithophane', () => {
    const src = rgba(8, 8, () => [10, 10, 10, 255]);
    const f = buildHeightField(src, 8, 8, opts({ mode: 'lithophane', smooth: 0 }));
    expect(f.data[0]!).toBeGreaterThan(0.9);
  });

  it('turns the same dark image into low material for a relief', () => {
    const src = rgba(8, 8, () => [10, 10, 10, 255]);
    const f = buildHeightField(src, 8, 8, opts({ mode: 'relief', smooth: 0 }));
    expect(f.data[0]!).toBeLessThan(0.1);
  });

  it('keeps every sample inside 0..1 under extreme adjustments', () => {
    const src = rgba(16, 16, (x, y) => [x * 16, y * 16, 128, 255]);
    const f = buildHeightField(src, 16, 16, opts({ brightness: 90, contrast: 95, gamma: 0.2, smooth: 2 }));
    for (const v of f.data) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});
