import { describe, expect, it } from 'vitest';
import { calculateCagr } from '@/lib/finance/cagr';

describe('calculateCagr', () => {
  it('computes a doubling over 5 years (~14.87%)', () => {
    const r = calculateCagr({ initialValue: 100_000, finalValue: 200_000, years: 5 });
    expect(r.cagrPct).toBeCloseTo(14.87, 1);
    expect(r.absoluteReturnPct).toBe(100);
    expect(r.multiple).toBe(2);
  });

  it('handles no growth', () => {
    const r = calculateCagr({ initialValue: 50_000, finalValue: 50_000, years: 3 });
    expect(r.cagrPct).toBe(0);
    expect(r.absoluteReturnPct).toBe(0);
  });

  it('handles a loss (negative CAGR)', () => {
    const r = calculateCagr({ initialValue: 100_000, finalValue: 60_000, years: 4 });
    expect(r.cagrPct).toBeLessThan(0);
    expect(r.absoluteReturnPct).toBeCloseTo(-40, 5);
  });

  it('handles fractional years and large multiples', () => {
    expect(calculateCagr({ initialValue: 1000, finalValue: 1100, years: 0.5 }).cagrPct).toBeGreaterThan(0);
    expect(calculateCagr({ initialValue: 1, finalValue: 1e6, years: 10 }).cagrPct).toBeGreaterThan(200);
  });

  it.each([
    ['zero initial', { initialValue: 0, finalValue: 100, years: 3 }],
    ['negative initial', { initialValue: -100, finalValue: 100, years: 3 }],
    ['zero years', { initialValue: 100, finalValue: 200, years: 0 }],
    ['negative years', { initialValue: 100, finalValue: 200, years: -1 }],
    ['NaN final', { initialValue: 100, finalValue: Number.NaN, years: 3 }],
  ])('rejects %s', (_label, input) => {
    expect(() => calculateCagr(input as never)).toThrow();
  });
});
