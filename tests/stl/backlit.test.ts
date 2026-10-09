import { describe, expect, it } from 'vitest';
import { DEFAULT_BACKLIT, renderBacklit, thicknessOf, tonalRange } from '@/lib/stl/backlit';
import { DEFAULT_STL_OPTIONS, type HeightField, type StlOptions } from '@/lib/stl/types';

const opts = (over: Partial<StlOptions> = {}): StlOptions => ({ ...DEFAULT_STL_OPTIONS, ...over });

const field = (values: number[], mask?: number[]): HeightField => ({
  width: values.length,
  height: 1,
  data: Float32Array.from(values),
  mask: mask ? Uint8Array.from(mask) : undefined,
});

describe('thicknessOf', () => {
  it('spans min to max across the brightness range', () => {
    const o = opts({ minThicknessMM: 0.8, maxThicknessMM: 3.2 });
    expect(thicknessOf(0, o)).toBeCloseTo(0.8, 6);
    expect(thicknessOf(1, o)).toBeCloseTo(3.2, 6);
  });

  it('adds the base only for a relief', () => {
    expect(thicknessOf(0, opts({ mode: 'relief', minThicknessMM: 0, baseThicknessMM: 2 }))).toBeCloseTo(2, 6);
    expect(thicknessOf(0, opts({ mode: 'lithophane', minThicknessMM: 0, baseThicknessMM: 2 }))).toBeCloseTo(0, 6);
  });
});

describe('renderBacklit', () => {
  it('thick material comes out darker than thin', () => {
    const px = renderBacklit(field([0, 1]), opts());
    expect(px[0]!).toBeGreaterThan(px[4]!);
  });

  it('is fully opaque wherever there is material', () => {
    const px = renderBacklit(field([0, 0.5, 1]), opts());
    expect(px[3]).toBe(255);
    expect(px[7]).toBe(255);
    expect(px[11]).toBe(255);
  });

  it('shines the lamp straight through a hole in the mask', () => {
    const px = renderBacklit(field([1, 1], [1, 0]), opts());
    // The masked-out sample must be brighter than thick material beside it.
    expect(px[4]!).toBeGreaterThan(px[0]!);
  });

  it('follows Beer-Lambert: doubling thickness squares the transmission', () => {
    // Raw physics, so exposure must not renormalise the result.
    const o = opts({ minThicknessMM: 1, maxThicknessMM: 2 });
    const look = {
      ...DEFAULT_BACKLIT, absorption: 1, intensity: 1, autoExpose: false,
      light: [255, 255, 255] as [number, number, number], material: [255, 255, 255] as [number, number, number],
    };
    const px = renderBacklit(field([0, 1]), o, look);
    const thin = px[0]! / 255;
    const thick = px[4]! / 255;
    expect(thick).toBeCloseTo(thin * thin, 2);
  });

  it('unexposed, a more absorbent filament darkens everything', () => {
    const dim = renderBacklit(field([0.5]), opts(), { ...DEFAULT_BACKLIT, absorption: 3, autoExpose: false });
    const bright = renderBacklit(field([0.5]), opts(), { ...DEFAULT_BACKLIT, absorption: 0.5, autoExpose: false });
    expect(bright[0]!).toBeGreaterThan(dim[0]!);
  });

  it('auto-exposure lifts the brightest point to near white', () => {
    // Without it the whole preview is nearly black and shows nothing: 3mm of
    // white PLA transmits about 2%.
    const px = renderBacklit(field([0, 0.5, 1]), opts(), { ...DEFAULT_BACKLIT, autoExpose: true });
    expect(px[0]!).toBeGreaterThan(220);
  });

  it('with exposure on, denser filament still deepens the shadows', () => {
    // The highlight is normalised either way, so what a filament actually
    // changes is contrast — and that has to survive.
    const o = opts();
    const dense = renderBacklit(field([0, 1]), o, { ...DEFAULT_BACKLIT, absorption: 2.5 });
    const clear = renderBacklit(field([0, 1]), o, { ...DEFAULT_BACKLIT, absorption: 0.6 });
    expect(dense[4]!).toBeLessThan(clear[4]!);
  });

  it('carries the light colour through — a warm lamp stays warm', () => {
    const px = renderBacklit(field([0.3]), opts(), {
      ...DEFAULT_BACKLIT, light: [255, 180, 120], material: [255, 255, 255],
    });
    expect(px[0]!).toBeGreaterThan(px[1]!);
    expect(px[1]!).toBeGreaterThan(px[2]!);
  });
});

describe('tonalRange', () => {
  it('is near zero for a flat image, which would print as a blank panel', () => {
    expect(tonalRange(field([0.5, 0.5, 0.5]), opts())).toBeLessThan(0.05);
  });

  it('is large for an image that uses the full range', () => {
    expect(tonalRange(field([0, 1]), opts())).toBeGreaterThan(0.5);
  });

  it('ignores masked-out samples rather than counting the bare lamp', () => {
    const withHole = tonalRange(field([0.5, 0.5], [1, 0]), opts());
    expect(withHole).toBeLessThan(0.05);
  });

  it('stays within 0..1', () => {
    for (const vals of [[0], [1], [0, 0.5, 1], [0.2, 0.8]]) {
      const r = tonalRange(field(vals), opts());
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(1);
    }
  });
});
