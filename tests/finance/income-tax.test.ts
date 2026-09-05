import { describe, expect, it } from 'vitest';
import { calculateIncomeTax } from '@/lib/finance/income-tax';
import { incomeTaxForTaxableIncome } from '@/config/india-payroll';

describe('calculateIncomeTax (FY 2025-26 default)', () => {
  it('defaults to FY 2025-26', () => {
    expect(calculateIncomeTax({ annualIncome: 1_000_000 }).financialYear).toBe('2025-26');
  });

  it('new regime tax is nil up to ₹12L taxable via the 87A rebate', () => {
    // ₹12,75,000 gross − ₹75,000 standard deduction = ₹12,00,000 taxable.
    const r = calculateIncomeTax({ annualIncome: 1_275_000 });
    expect(r.new.taxableIncome).toBe(1_200_000);
    expect(r.new.incomeTax).toBe(0);
    // Old regime still taxes this: 12,500 + 1,00,000 + 30% of 2,25,000 = 1,80,000, +4% cess.
    expect(r.old.taxableIncome).toBe(1_225_000);
    expect(r.old.incomeTax).toBeCloseTo(187_200, 0);
    expect(r.betterRegime).toBe('new');
  });

  it('applies marginal relief just above the ₹12L new-regime threshold', () => {
    // ₹12,85,000 gross − ₹75,000 = ₹12,10,000 taxable. Slab tax = 60,000 + 15% of 10,000 = 61,500.
    // Marginal relief caps tax at the ₹10,000 excess over ₹12L, then 4% cess → ₹10,400.
    const r = calculateIncomeTax({ annualIncome: 1_285_000 });
    expect(r.new.taxableIncome).toBe(1_210_000);
    expect(r.new.incomeTax).toBeCloseTo(10_400, 0);
  });

  it('taxes both regimes at higher incomes', () => {
    const r = calculateIncomeTax({ annualIncome: 2_000_000 });
    // new: taxable 19,25,000 → 20k+40k+60k+65k = 1,85,000, +4% cess.
    expect(r.new.incomeTax).toBeCloseTo(192_400, 0);
    // old: taxable 19,50,000 → 12,500 + 1,00,000 + 30% of 9,50,000 = 3,97,500, +4% cess.
    expect(r.old.incomeTax).toBeCloseTo(413_400, 0);
    expect(r.betterRegime).toBe('new');
  });

  it('old regime deductions lower taxable income and never touch the new regime', () => {
    const noDeductions = calculateIncomeTax({ annualIncome: 1_800_000 });
    const withDeductions = calculateIncomeTax({ annualIncome: 1_800_000, oldRegimeDeductions: 300_000 });
    expect(withDeductions.old.taxableIncome).toBe(noDeductions.old.taxableIncome - 300_000);
    expect(withDeductions.old.incomeTax).toBeLessThan(noDeductions.old.incomeTax);
    expect(withDeductions.new.incomeTax).toBe(noDeductions.new.incomeTax);
  });

  it('a low income pays no tax under either regime', () => {
    const r = calculateIncomeTax({ annualIncome: 500_000 });
    expect(r.old.incomeTax).toBe(0);
    expect(r.new.incomeTax).toBe(0);
    expect(r.betterRegime).toBe('equal');
    expect(r.annualSavings).toBe(0);
  });

  it('reports the cheaper regime and a matching savings amount', () => {
    const r = calculateIncomeTax({ annualIncome: 2_500_000 });
    const cheaper = r.old.incomeTax < r.new.incomeTax ? 'old' : r.new.incomeTax < r.old.incomeTax ? 'new' : 'equal';
    expect(r.betterRegime).toBe(cheaper);
    expect(r.annualSavings).toBeCloseTo(Math.abs(r.old.incomeTax - r.new.incomeTax), 2);
  });

  it('effective rate and in-hand annual reconcile with income and tax', () => {
    const r = calculateIncomeTax({ annualIncome: 2_500_000, oldRegimeDeductions: 150_000 });
    for (const regime of [r.old, r.new]) {
      expect(regime.inHandAnnual).toBeCloseTo(2_500_000 - regime.incomeTax, 2);
      expect(regime.effectiveRatePct).toBeCloseTo((regime.incomeTax / 2_500_000) * 100, 2);
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
    ['unknown financial year', { annualIncome: 500_000, financialYear: '2099-00' as never }],
  ])('rejects %s', (_label, input) => {
    expect(() => calculateIncomeTax(input as never)).toThrow();
  });
});

describe('calculateIncomeTax (FY 2024-25, still selectable)', () => {
  it('reproduces the FY 2024-25 new-regime figures', () => {
    // ₹9,00,000 gross − ₹75,000 standard deduction = ₹8,25,000 taxable.
    // Slab: 5% of 4,00,000 + 10% of 1,25,000 = 32,500. Above the ₹7L rebate limit,
    // marginal relief doesn't bind, so 32,500 + 4% cess = ₹33,800.
    const r = calculateIncomeTax({ annualIncome: 900_000, financialYear: '2024-25' });
    expect(r.new.taxableIncome).toBe(825_000);
    expect(r.new.incomeTax).toBeCloseTo(33_800, 0);
  });

  it('reproduces the FY 2024-25 old-regime figures', () => {
    // ₹9,00,000 − ₹50,000 std deduction − ₹1,50,000 deductions = ₹7,00,000 taxable.
    // 12,500 + 20% of 2,00,000 = 52,500, +4% cess = ₹54,600.
    const r = calculateIncomeTax({ annualIncome: 900_000, oldRegimeDeductions: 150_000, financialYear: '2024-25' });
    expect(r.old.taxableIncome).toBe(700_000);
    expect(r.old.incomeTax).toBeCloseTo(54_600, 0);
  });

  it('new regime taxes ₹8.25L taxable in FY 2024-25 but not in FY 2025-26', () => {
    const fy25 = calculateIncomeTax({ annualIncome: 900_000, financialYear: '2024-25' });
    const fy26 = calculateIncomeTax({ annualIncome: 900_000, financialYear: '2025-26' });
    expect(fy25.new.incomeTax).toBeGreaterThan(0);
    expect(fy26.new.incomeTax).toBe(0);
  });
});

describe('incomeTaxForTaxableIncome', () => {
  it('is zero within the 87A rebate limit', () => {
    expect(incomeTaxForTaxableIncome(1_200_000, 'new', '2025-26')).toBe(0);
    expect(incomeTaxForTaxableIncome(700_000, 'new', '2024-25')).toBe(0);
    expect(incomeTaxForTaxableIncome(500_000, 'old', '2025-26')).toBe(0);
  });

  it('is monotonic in income for every regime and year', () => {
    for (const [regime, fy] of [
      ['new', '2025-26'],
      ['old', '2025-26'],
      ['new', '2024-25'],
      ['old', '2024-25'],
    ] as const) {
      let prev = -1;
      for (const inc of [0, 3e5, 5e5, 8e5, 12e5, 13e5, 2e6, 3e6, 5e6]) {
        const tax = incomeTaxForTaxableIncome(inc, regime, fy);
        expect(tax).toBeGreaterThanOrEqual(prev);
        prev = tax;
      }
    }
  });

  it('marginal relief never makes tax exceed the income above the threshold', () => {
    for (let ti = 1_200_001; ti <= 1_280_000; ti += 5_000) {
      const tax = incomeTaxForTaxableIncome(ti, 'new', '2025-26');
      // tax (incl. cess) should not exceed 1.04× the excess over ₹12L within the relief band.
      expect(tax).toBeLessThanOrEqual((ti - 1_200_000) * 1.04 + 0.01);
    }
  });
});
