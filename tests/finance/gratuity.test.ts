import { describe, expect, it } from 'vitest';
import { calculateGratuity } from '@/lib/finance/gratuity';

describe('calculateGratuity', () => {
  it('applies the standard 15/26 formula for a covered employer', () => {
    const r = calculateGratuity({ lastDrawnMonthlySalary: 50_000, yearsOfService: 10 });
    // (15 * 50000 * 10) / 26
    expect(r.gratuityPayable).toBeCloseTo((15 * 50_000 * 10) / 26, 2);
    expect(r.yearsUsedInFormula).toBe(10);
  });

  it('rounds a fractional year of 6+ months up to the next full year', () => {
    const r = calculateGratuity({ lastDrawnMonthlySalary: 40_000, yearsOfService: 7.6 });
    expect(r.yearsUsedInFormula).toBe(8);
  });

  it('rounds a fractional year of under 6 months down', () => {
    const r = calculateGratuity({ lastDrawnMonthlySalary: 40_000, yearsOfService: 7.4 });
    expect(r.yearsUsedInFormula).toBe(7);
  });

  it('uses a 30-day divisor for employers not covered under the Act', () => {
    const covered = calculateGratuity({ lastDrawnMonthlySalary: 50_000, yearsOfService: 10, coveredUnderAct: true });
    const notCovered = calculateGratuity({
      lastDrawnMonthlySalary: 50_000,
      yearsOfService: 10,
      coveredUnderAct: false,
    });
    expect(notCovered.gratuityPayable).toBeLessThan(covered.gratuityPayable);
    expect(notCovered.gratuityPayable).toBeCloseTo((15 * 50_000 * 10) / 30, 2);
  });

  it('caps the tax-exempt amount at the statutory limit for very large payouts', () => {
    const r = calculateGratuity({ lastDrawnMonthlySalary: 500_000, yearsOfService: 30 });
    expect(r.gratuityPayable).toBeGreaterThan(r.statutoryExemptionLimit);
    expect(r.taxExemptAmount).toBe(r.statutoryExemptionLimit);
    expect(r.taxableAmount).toBeCloseTo(r.gratuityPayable - r.statutoryExemptionLimit, 2);
  });

  it('has zero taxable amount when the payout is within the statutory limit', () => {
    const r = calculateGratuity({ lastDrawnMonthlySalary: 30_000, yearsOfService: 5 });
    expect(r.taxableAmount).toBe(0);
    expect(r.taxExemptAmount).toBe(r.gratuityPayable);
  });

  it.each([
    ['negative salary', { lastDrawnMonthlySalary: -1, yearsOfService: 5 }],
    ['negative years', { lastDrawnMonthlySalary: 30_000, yearsOfService: -1 }],
  ])('rejects %s', (_label, input) => {
    expect(() => calculateGratuity(input)).toThrow();
  });
});
