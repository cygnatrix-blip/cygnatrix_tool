import { describe, expect, it } from 'vitest';
import { calculateIncomeTax } from '@/lib/finance/income-tax';

describe('calculateIncomeTax', () => {
  it('compares both regimes for a mid income with no extra deductions', () => {
    const r = calculateIncomeTax({ annualIncome: 1_200_000 });
    expect(r.old.taxableIncome).toBe(1_150_000);
    expect(r.new.taxableIncome).toBe(1_125_000);
    expect(r.old.incomeTax).toBeGreaterThan(0);
    expect(r.new.incomeTax).toBeGreaterThan(0);
  });

  it('old regime deductions lower taxable income and can flip which regime wins', () => {
    const noDeductions = calculateIncomeTax({ annualIncome: 1_200_000 });
    const withDeductions = calculateIncomeTax({ annualIncome: 1_200_000, oldRegimeDeductions: 300_000 });
    expect(withDeductions.old.taxableIncome).toBe(noDeductions.old.taxableIncome - 300_000);
    expect(withDeductions.old.incomeTax).toBeLessThan(noDeductions.old.incomeTax);
    // New regime is untouched by old-regime-only deductions.
    expect(withDeductions.new.incomeTax).toBe(noDeductions.new.incomeTax);
  });

  it('a low income pays no tax under either regime', () => {
    const r = calculateIncomeTax({ annualIncome: 500_000 });
    expect(r.old.incomeTax).toBe(0);
    expect(r.new.incomeTax).toBe(0);
    expect(r.betterRegime).toBe('equal');
    expect(r.annualSavings).toBe(0);
  });

  it('reports the regime with lower tax as better, and a matching savings amount', () => {
    const r = calculateIncomeTax({ annualIncome: 2_000_000 });
    const cheaper = r.old.incomeTax < r.new.incomeTax ? 'old' : r.new.incomeTax < r.old.incomeTax ? 'new' : 'equal';
    expect(r.betterRegime).toBe(cheaper);
    expect(r.annualSavings).toBeCloseTo(Math.abs(r.old.incomeTax - r.new.incomeTax), 2);
  });

  it('effective rate and in-hand annual reconcile with income and tax', () => {
    const r = calculateIncomeTax({ annualIncome: 1_500_000, oldRegimeDeductions: 150_000 });
    for (const regime of [r.old, r.new]) {
      expect(regime.inHandAnnual).toBeCloseTo(1_500_000 - regime.incomeTax, 2);
      expect(regime.effectiveRatePct).toBeCloseTo((regime.incomeTax / 1_500_000) * 100, 2);
    }
  });

  it('zero income results in zero tax under both regimes', () => {
    const r = calculateIncomeTax({ annualIncome: 0 });
    expect(r.old.incomeTax).toBe(0);
    expect(r.new.incomeTax).toBe(0);
  });

  it.each([
    ['negative income', { annualIncome: -1 }],
    ['NaN income', { annualIncome: Number.NaN }],
    ['deductions exceeding income', { annualIncome: 500_000, oldRegimeDeductions: 600_000 }],
    ['negative deductions', { annualIncome: 500_000, oldRegimeDeductions: -1 }],
  ])('rejects %s', (_label, input) => {
    expect(() => calculateIncomeTax(input as never)).toThrow();
  });
});
