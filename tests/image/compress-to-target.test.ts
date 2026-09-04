import { describe, expect, it } from 'vitest';
import { compressToTarget, type Encoder } from '@/lib/image/compress-to-target-core';

/**
 * A deterministic stand-in for a real JPEG/WebP encoder: file size grows
 * linearly with quality and with pixel count. This lets the *search logic*
 * (binary search, downscale loop, floor padding, graceful failure) be tested
 * precisely, independent of any real codec's quirks.
 */
function fakeEncoder(bytesPerPixelAtFullQuality = 3): Encoder {
  return async (quality, width, height) => {
    const bytes = Math.max(1, Math.round(width * height * bytesPerPixelAtFullQuality * quality));
    return { bytes, blob: new Blob([new Uint8Array(1)]) };
  };
}

describe('compressToTarget', () => {
  it('converges on a target reachable by quality alone, at full size', async () => {
    // At 1000x1000x3, size ranges from 150,000B (quality 0.05) to 2,940,000B
    // (quality 0.98) — 200,000B sits inside that range, so no downscale needed.
    const result = await compressToTarget(fakeEncoder(3), {
      targetBytes: 200_000,
      originalWidth: 1000,
      originalHeight: 1000,
    });
    expect(result.finalBytes).toBeLessThanOrEqual(200_000);
    expect(result.downscaleRounds).toBe(0);
    expect(result.finalWidth).toBe(1000);
    expect(result.finalHeight).toBe(1000);
    expect(result.metTarget).toBe(true);
    expect(result.iterations).toBeGreaterThan(0);
  });

  it('gets close to the target, not just far under it', async () => {
    // At 500x500x3, full-quality size is 750,000B. A target of 300,000B is
    // comfortably within [minQuality, maxQuality] range — the binary search
    // should land within a few percent of it, not massively undershoot.
    const result = await compressToTarget(fakeEncoder(3), {
      targetBytes: 300_000,
      originalWidth: 500,
      originalHeight: 500,
    });
    expect(result.finalBytes).toBeLessThanOrEqual(300_000);
    expect(result.finalBytes).toBeGreaterThan(300_000 * 0.9); // within 10%
  });

  it('downscales when even the lowest quality exceeds the target at full size', async () => {
    // At quality 0.05 and 1000x1000x3, min size is 150,000B — above the
    // 100,000B target, so quality alone can't reach it; after two 0.9×
    // downscale rounds (1000 → 900 → 810), min size drops to ~98,415B, which
    // does clear the target.
    const result = await compressToTarget(fakeEncoder(3), {
      targetBytes: 100_000,
      originalWidth: 1000,
      originalHeight: 1000,
    });
    expect(result.downscaleRounds).toBeGreaterThan(0);
    expect(result.finalWidth).toBeLessThan(1000);
    expect(result.finalHeight).toBeLessThan(1000);
    expect(result.finalBytes).toBeLessThanOrEqual(100_000);
  });

  it('pads quality back up when the result lands under a minimum floor', async () => {
    const withFloor = await compressToTarget(fakeEncoder(3), {
      targetBytes: 200_000,
      minBytes: 195_000,
      originalWidth: 1000,
      originalHeight: 1000,
    });
    const withoutFloor = await compressToTarget(fakeEncoder(3), {
      targetBytes: 200_000,
      originalWidth: 1000,
      originalHeight: 1000,
    });
    // Padding should never push the result *past* the target, and should
    // always land at or above whatever the unconstrained search alone found
    // (equal if the unconstrained result already cleared the floor, higher
    // if padding had to refine further).
    expect(withFloor.finalBytes).toBeGreaterThanOrEqual(withoutFloor.finalBytes);
    expect(withFloor.finalBytes).toBeLessThanOrEqual(200_000);
  });

  it('a floor well below the natural result never forces a worse outcome', async () => {
    const result = await compressToTarget(fakeEncoder(3), {
      targetBytes: 200_000,
      minBytes: 100_000,
      originalWidth: 1000,
      originalHeight: 1000,
    });
    expect(result.finalBytes).toBeLessThanOrEqual(200_000);
    expect(result.finalBytes).toBeGreaterThanOrEqual(100_000);
  });

  it('fails gracefully (never throws) when the target is unreachable even after every downscale round', async () => {
    const result = await compressToTarget(fakeEncoder(3), {
      targetBytes: 1, // effectively impossible
      originalWidth: 800,
      originalHeight: 800,
      maxDownscaleRounds: 3,
    });
    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.downscaleRounds).toBeLessThanOrEqual(3);
    expect(result.metTarget).toBe(false);
    expect(result.summary).toMatch(/quality \d+%/);
  });

  it('respects a custom downscale round cap', async () => {
    const result = await compressToTarget(fakeEncoder(3), {
      targetBytes: 1,
      originalWidth: 800,
      originalHeight: 800,
      maxDownscaleRounds: 2,
    });
    expect(result.downscaleRounds).toBeLessThanOrEqual(2);
  });

  it('produces a human-readable summary with before/after dimensions when it downscaled', async () => {
    const result = await compressToTarget(fakeEncoder(3), {
      targetBytes: 10_000,
      originalWidth: 2000,
      originalHeight: 2000,
    });
    expect(result.summary).toContain('→');
    expect(result.summary).toMatch(/2000×2000 → \d+×\d+, quality \d+%, .+(KB|B)/);
  });

  it('omits the arrow in the summary when no downscale was needed', async () => {
    const result = await compressToTarget(fakeEncoder(3), {
      targetBytes: 200_000,
      originalWidth: 1000,
      originalHeight: 1000,
    });
    expect(result.summary).not.toContain('→');
    expect(result.summary).toMatch(/^1000×1000, quality \d+%, .+(KB|B)$/);
  });

  it('rejects a non-positive target', async () => {
    await expect(
      compressToTarget(fakeEncoder(), { targetBytes: 0, originalWidth: 100, originalHeight: 100 }),
    ).rejects.toThrow();
  });

  it('rejects a minimum larger than the target', async () => {
    await expect(
      compressToTarget(fakeEncoder(), {
        targetBytes: 100,
        minBytes: 200,
        originalWidth: 100,
        originalHeight: 100,
      }),
    ).rejects.toThrow();
  });

  it('reports progress via onProgress', async () => {
    const calls: number[] = [];
    await compressToTarget(fakeEncoder(3), {
      targetBytes: 200_000,
      originalWidth: 1000,
      originalHeight: 1000,
      onProgress: (attempt) => calls.push(attempt),
    });
    expect(calls.length).toBeGreaterThan(0);
    expect(calls).toEqual([...calls].sort((a, b) => a - b)); // monotonically increasing
  });
});
