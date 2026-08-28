import { describe, expect, it } from 'vitest';
import { calculateFd } from '@/lib/finance/fd';

describe('calculateFd', () => {
  it('computes quarterly-compounded maturity', () => {
    const r = calculateFd({ principal: 100_000, annualRatePct: 7, tenureMonths: 60, compounding: 4 });
    // 100000 * (1 + 0.0175)^20 ≈ 141,478
    expect(r.maturityValue).toBeGreaterThan(141_000);
    expect(r.maturityValue).toBeLessThan(142_000);
    expect(r.interestEarned).toBeCloseTo(r.maturityValue - 100_000, 2);
  });

  it('higher compounding frequency yields more interest', () => {
    const base = { principal: 200_000, annualRatePct: 8, tenureMonths: 36 } as const;
    const yearly = calculateFd({ ...base, compounding: 1 });
    const monthly = calculateFd({ ...base, compounding: 12 });
    expect(monthly.maturityValue).toBeGreaterThan(yearly.maturityValue);
  });

  it('handles zero interest', () => {
    const r = calculateFd({ principal: 50_000, annualRatePct: 0, tenureMonths: 24, compounding: 4 });
    expect(r.maturityValue).toBe(50_000);
    expect(r.interestEarned).toBe(0);
  });

  it('handles decimal rate, tiny and large principals, short and long tenures', () => {
    expect(calculateFd({ principal: 1, annualRatePct: 6.65, tenureMonths: 1, compounding: 12 }).maturityValue).toBeGreaterThanOrEqual(1);
    expect(calculateFd({ principal: 1e10, annualRatePct: 7.1, tenureMonths: 600, compounding: 4 }).maturityValue).toBeGreaterThan(1e10);
  });

  it.each([
    ['zero principal', { principal: 0, annualRatePct: 7, tenureMonths: 12, compounding: 4 }],
    ['negative principal', { principal: -1, annualRatePct: 7, tenureMonths: 12, compounding: 4 }],
    ['zero tenure', { principal: 1000, annualRatePct: 7, tenureMonths: 0, compounding: 4 }],
    ['negative rate', { principal: 1000, annualRatePct: -1, tenureMonths: 12, compounding: 4 }],
  ])('rejects %s', (_label, input) => {
    expect(() => calculateFd(input as never)).toThrow();
  });

  it('rejects an invalid compounding frequency', () => {
    expect(() => calculateFd({ principal: 1000, annualRatePct: 7, tenureMonths: 12, compounding: 3 as never })).toThrow();
  });
});
