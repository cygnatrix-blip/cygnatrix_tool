import { describe, expect, it } from 'vitest';
import { calculateEmi, yearlyBreakdown } from '@/lib/finance/emi';
import { CalculationError } from '@/lib/finance/shared';

describe('calculateEmi', () => {
  it('computes a standard home loan EMI', () => {
    const r = calculateEmi({ principal: 2_500_000, annualRatePct: 8.5, tenureMonths: 240 });
    expect(r.emi).toBeGreaterThan(21600);
    expect(r.emi).toBeLessThan(21800);
    expect(r.totalPayment).toBeCloseTo(r.emi * 240, -2);
    expect(r.totalInterest).toBeCloseTo(r.totalPayment - 2_500_000, 0);
    expect(r.schedule).toHaveLength(240);
    expect(r.schedule.at(-1)?.closingBalance).toBe(0);
  });

  it('handles zero interest as equal principal instalments', () => {
    const r = calculateEmi({ principal: 120_000, annualRatePct: 0, tenureMonths: 12 });
    expect(r.emi).toBe(10_000);
    expect(r.totalInterest).toBe(0);
    expect(r.totalPayment).toBeCloseTo(120_000, 2);
    expect(r.schedule.every((row) => row.interest === 0)).toBe(true);
  });

  it('handles a decimal interest rate', () => {
    const r = calculateEmi({ principal: 500_000, annualRatePct: 10.75, tenureMonths: 60 });
    expect(r.emi).toBeGreaterThan(0);
    expect(Number.isFinite(r.emi)).toBe(true);
    expect(r.totalInterest).toBeGreaterThan(0);
  });

  it('handles a tiny amount and short tenure', () => {
    const r = calculateEmi({ principal: 1, annualRatePct: 5, tenureMonths: 1 });
    expect(r.schedule).toHaveLength(1);
    expect(r.schedule[0]?.closingBalance).toBe(0);
    expect(r.totalPayment).toBeGreaterThanOrEqual(1);
  });

  it('handles a very large amount and long tenure', () => {
    const r = calculateEmi({ principal: 1_000_000_000, annualRatePct: 9, tenureMonths: 360 });
    expect(r.emi).toBeGreaterThan(0);
    expect(r.schedule.at(-1)?.closingBalance).toBe(0);
  });

  it('closing balance never goes negative and decreases monotonically', () => {
    const r = calculateEmi({ principal: 750_000, annualRatePct: 12, tenureMonths: 84 });
    let prev = Infinity;
    for (const row of r.schedule) {
      expect(row.closingBalance).toBeGreaterThanOrEqual(0);
      expect(row.closingBalance).toBeLessThanOrEqual(prev + 1);
      prev = row.closingBalance;
    }
  });

  it('yearly breakdown sums to schedule totals', () => {
    const r = calculateEmi({ principal: 600_000, annualRatePct: 10, tenureMonths: 36 });
    const yb = yearlyBreakdown(r.schedule);
    const totalInterest = yb.reduce((s, y) => s + y.interest, 0);
    expect(totalInterest).toBeCloseTo(r.totalInterest, 0);
  });

  it.each([
    ['negative principal', { principal: -1000, annualRatePct: 8, tenureMonths: 12 }],
    ['zero principal', { principal: 0, annualRatePct: 8, tenureMonths: 12 }],
    ['zero tenure', { principal: 1000, annualRatePct: 8, tenureMonths: 0 }],
    ['negative rate', { principal: 1000, annualRatePct: -3, tenureMonths: 12 }],
    ['rate over 100', { principal: 1000, annualRatePct: 250, tenureMonths: 12 }],
    ['NaN principal', { principal: Number.NaN, annualRatePct: 8, tenureMonths: 12 }],
  ])('rejects %s', (_label, input) => {
    expect(() => calculateEmi(input as never)).toThrow(CalculationError);
  });
});
