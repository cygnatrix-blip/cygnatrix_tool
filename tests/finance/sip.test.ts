import { describe, expect, it } from 'vitest';
import { calculateSip } from '@/lib/finance/sip';
import { CalculationError } from '@/lib/finance/shared';

describe('calculateSip', () => {
  it('computes a standard SIP projection', () => {
    const r = calculateSip({ monthlyInvestment: 10_000, annualReturnPct: 12, years: 10 });
    expect(r.invested).toBe(1_200_000);
    // Well-known ballpark for 10k/12%/10y is ~₹23.2 lakh.
    expect(r.futureValue).toBeGreaterThan(2_200_000);
    expect(r.futureValue).toBeLessThan(2_400_000);
    expect(r.estimatedReturns).toBeCloseTo(r.futureValue - r.invested, 2);
    expect(r.yearly).toHaveLength(10);
  });

  it('treats zero return as plain accumulation', () => {
    const r = calculateSip({ monthlyInvestment: 5_000, annualReturnPct: 0, years: 3 });
    expect(r.futureValue).toBeCloseTo(180_000, 2);
    expect(r.estimatedReturns).toBeCloseTo(0, 2);
  });

  it('applies an annual step-up', () => {
    const flat = calculateSip({ monthlyInvestment: 10_000, annualReturnPct: 10, years: 5 });
    const stepped = calculateSip({
      monthlyInvestment: 10_000,
      annualReturnPct: 10,
      years: 5,
      annualStepUpPct: 10,
    });
    expect(stepped.invested).toBeGreaterThan(flat.invested);
    expect(stepped.futureValue).toBeGreaterThan(flat.futureValue);
  });

  it('handles decimal returns, tiny amounts and long horizons', () => {
    expect(calculateSip({ monthlyInvestment: 1, annualReturnPct: 7.35, years: 1 }).futureValue).toBeGreaterThan(0);
    const long = calculateSip({ monthlyInvestment: 25_000, annualReturnPct: 11.5, years: 30 });
    expect(long.futureValue).toBeGreaterThan(long.invested);
    expect(long.yearly).toHaveLength(30);
  });

  it('yearly series is monotonic in value', () => {
    const r = calculateSip({ monthlyInvestment: 8_000, annualReturnPct: 9, years: 12 });
    for (let i = 1; i < r.yearly.length; i += 1) {
      expect(r.yearly[i]!.value).toBeGreaterThan(r.yearly[i - 1]!.value);
      expect(r.yearly[i]!.invested).toBeGreaterThan(r.yearly[i - 1]!.invested);
    }
  });

  it.each([
    ['zero investment', { monthlyInvestment: 0, annualReturnPct: 10, years: 5 }],
    ['negative investment', { monthlyInvestment: -100, annualReturnPct: 10, years: 5 }],
    ['zero years', { monthlyInvestment: 1000, annualReturnPct: 10, years: 0 }],
    ['negative return', { monthlyInvestment: 1000, annualReturnPct: -5, years: 5 }],
    ['NaN years', { monthlyInvestment: 1000, annualReturnPct: 10, years: Number.NaN }],
  ])('rejects %s', (_label, input) => {
    expect(() => calculateSip(input as never)).toThrow(CalculationError);
  });
});
