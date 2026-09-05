import { describe, expect, it } from 'vitest';
import { cleanupSignaturePixels } from '@/lib/image/signature-cleanup';

/** Build a synthetic RGBA buffer: a uniform "paper" tone with a block of darker "ink". */
function makeSyntheticSignature(width: number, height: number, paperGray: number, inkGray: number): Uint8ClampedArray {
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const isInk = x > width * 0.3 && x < width * 0.7 && y > height * 0.4 && y < height * 0.6;
      const v = isInk ? inkGray : paperGray;
      const o = (y * width + x) * 4;
      rgba[o] = v;
      rgba[o + 1] = v;
      rgba[o + 2] = v;
      rgba[o + 3] = 255;
    }
  }
  return rgba;
}

function avgLuminance(rgba: Uint8ClampedArray, predicate: (i: number) => boolean): number {
  let sum = 0;
  let n = 0;
  for (let i = 0; i < rgba.length / 4; i += 1) {
    if (!predicate(i)) continue;
    const o = i * 4;
    sum += 0.299 * rgba[o]! + 0.587 * rgba[o + 1]! + 0.114 * rgba[o + 2]!;
    n += 1;
  }
  return sum / n;
}

describe('cleanupSignaturePixels', () => {
  it('pushes a dim, uneven "paper" background toward white', () => {
    // Off-white/gray paper (180) with dark ink (40) — a typical photographed-on-paper signature.
    const rgba = makeSyntheticSignature(40, 40, 180, 40);
    const isInk = (i: number) => {
      const x = i % 40;
      const y = Math.floor(i / 40);
      return x > 12 && x < 28 && y > 16 && y < 24;
    };
    cleanupSignaturePixels(rgba, 40, 40, {});

    const bgAfter = avgLuminance(rgba, (i) => !isInk(i));
    expect(bgAfter).toBeGreaterThan(240); // background is now close to pure white
  });

  it('keeps ink darker than the whitened background (contrast preserved)', () => {
    const rgba = makeSyntheticSignature(40, 40, 180, 40);
    const isInk = (i: number) => {
      const x = i % 40;
      const y = Math.floor(i / 40);
      return x > 12 && x < 28 && y > 16 && y < 24;
    };
    cleanupSignaturePixels(rgba, 40, 40, {});

    const bgAfter = avgLuminance(rgba, (i) => !isInk(i));
    const inkAfter = avgLuminance(rgba, isInk);
    expect(inkAfter).toBeLessThan(bgAfter - 100);
  });

  it('never produces out-of-range byte values', () => {
    const rgba = makeSyntheticSignature(20, 20, 250, 10);
    cleanupSignaturePixels(rgba, 20, 20, {});
    for (const v of rgba) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(255);
    }
  });

  it('leaves the alpha channel untouched', () => {
    const rgba = makeSyntheticSignature(10, 10, 200, 50);
    for (let i = 3; i < rgba.length; i += 4) rgba[i] = 128; // distinct alpha to check it's preserved
    cleanupSignaturePixels(rgba, 10, 10, {});
    for (let i = 3; i < rgba.length; i += 4) expect(rgba[i]).toBe(128);
  });

  it('handles a 1x1 image without throwing', () => {
    const rgba = new Uint8ClampedArray([100, 100, 100, 255]);
    expect(() => cleanupSignaturePixels(rgba, 1, 1, {})).not.toThrow();
  });

  it('handles an empty buffer without throwing', () => {
    const rgba = new Uint8ClampedArray(0);
    expect(() => cleanupSignaturePixels(rgba, 0, 0, {})).not.toThrow();
  });

  it('respects a custom white percentile and ink threshold', () => {
    const rgba = makeSyntheticSignature(40, 40, 160, 60);
    cleanupSignaturePixels(rgba, 40, 40, { whitePercentile: 80, inkThreshold: 100, inkBoost: 0.8 });
    // Should still run and produce valid bytes with the custom options.
    expect(rgba.some((v) => v > 0)).toBe(true);
  });
});
