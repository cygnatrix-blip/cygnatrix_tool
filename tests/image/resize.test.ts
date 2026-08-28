import { describe, expect, it } from 'vitest';
import { resolveTargetSize } from '@/lib/image/resize';

const src = { width: 4000, height: 3000 };

describe('resolveTargetSize', () => {
  it('scales by percentage', () => {
    expect(resolveTargetSize(src, { mode: 'percentage', percentage: 50, lockAspect: true })).toEqual({
      width: 2000,
      height: 1500,
    });
  });

  it('locks aspect ratio from width', () => {
    expect(resolveTargetSize(src, { mode: 'dimensions', width: 1200, lockAspect: true })).toEqual({
      width: 1200,
      height: 900,
    });
  });

  it('locks aspect ratio from height', () => {
    expect(resolveTargetSize(src, { mode: 'dimensions', height: 600, lockAspect: true })).toEqual({
      width: 800,
      height: 600,
    });
  });

  it('allows free dimensions when unlocked', () => {
    expect(
      resolveTargetSize(src, { mode: 'dimensions', width: 1000, height: 1000, lockAspect: false }),
    ).toEqual({ width: 1000, height: 1000 });
  });

  it('rounds to whole pixels and never returns 0', () => {
    const r = resolveTargetSize({ width: 3, height: 1 }, { mode: 'percentage', percentage: 10, lockAspect: true });
    expect(r.width).toBeGreaterThanOrEqual(1);
    expect(r.height).toBeGreaterThanOrEqual(1);
    expect(Number.isInteger(r.width)).toBe(true);
  });

  it('throws on invalid input', () => {
    expect(() => resolveTargetSize(src, { mode: 'percentage', percentage: 0, lockAspect: true })).toThrow();
    expect(() =>
      resolveTargetSize(src, { mode: 'dimensions', width: -5, height: -5, lockAspect: false }),
    ).toThrow();
  });
});
