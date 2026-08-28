import { describe, expect, it } from 'vitest';
import { calculateRd } from '@/lib/finance/rd';

describe('calculateRd', () => {
  it('computes maturity greater than deposits when rate is positive', () => {
    const r = calculateRd({ monthlyDeposit: 5_000, annualRatePct: 7, tenureMonths: 24 });
    expect(r.totalDeposited).toBe(120_000);
    expect(r.maturityValue).toBeGreaterThan(120_000);
    expect(r.interestEarned).toBeCloseTo(r.maturityValue - r.totalDeposited, 2);
    // 24-month RD at 7% ≈ ₹1,28,900
    expect(r.maturityValue).toBeGreaterThan(128_000);
    expect(r.maturityValue).toBeLessThan(130_000);
  });

  it('handles zero interest', () => {
    const r = calculateRd({ monthlyDeposit: 2_000, annualRatePct: 0, tenureMonths: 12 });
    expect(r.maturityValue).toBeCloseTo(24_000, 2);
    expect(r.interestEarned).toBeCloseTo(0, 2);
  });

  it('handles decimal rate, tiny deposits and long tenure', () => {
    expect(calculateRd({ monthlyDeposit: 1, annualRatePct: 6.25, tenureMonths: 6 }).maturityValue).toBeGreaterThan(6);
    const long = calculateRd({ monthlyDeposit: 10_000, annualRatePct: 7.5, tenureMonths: 240 });
    expect(long.maturityValue).toBeGreaterThan(long.totalDeposited);
  });

  it.each([
    ['zero deposit', { monthlyDeposit: 0, annualRatePct: 7, tenureMonths: 12 }],
    ['negative deposit', { monthlyDeposit: -100, annualRatePct: 7, tenureMonths: 12 }],
    ['zero tenure', { monthlyDeposit: 1000, annualRatePct: 7, tenureMonths: 0 }],
    ['negative rate', { monthlyDeposit: 1000, annualRatePct: -2, tenureMonths: 12 }],
    ['NaN deposit', { monthlyDeposit: Number.NaN, annualRatePct: 7, tenureMonths: 12 }],
  ])('rejects %s', (_label, input) => {
    expect(() => calculateRd(input as never)).toThrow();
  });
});
