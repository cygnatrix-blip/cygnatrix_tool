import { describe, expect, it } from 'vitest';
import { calculateSalary } from '@/lib/finance/salary';
import { incomeTaxForTaxableIncome } from '@/config/india-payroll';

describe('calculateSalary', () => {
  it('breaks a CTC into components that reconcile', () => {
    const r = calculateSalary({ ctcAnnual: 1_200_000 });
    // basic + HRA + special allowance + employer PF should equal CTC
    const reconstructed =
      r.basicAnnual + r.hraAnnual + r.specialAllowanceAnnual + r.employerPfAnnual;
    expect(reconstructed).toBeCloseTo(r.ctcAnnual, 0);
    expect(r.grossAnnual).toBeCloseTo(r.ctcAnnual - r.employerPfAnnual, 0);
    expect(r.inHandAnnual).toBeCloseTo(r.grossAnnual - r.totalDeductionsAnnual, 0);
    expect(r.inHandMonthly).toBeCloseTo(r.inHandAnnual / 12, 2);
  });

  it('in-hand is less than gross and gross is less than CTC', () => {
    const r = calculateSalary({ ctcAnnual: 2_500_000, regime: 'new' });
    expect(r.inHandAnnual).toBeLessThan(r.grossAnnual);
    expect(r.grossAnnual).toBeLessThan(r.ctcAnnual);
    expect(r.assumptions.length).toBeGreaterThan(3);
  });

  it('a low CTC pays no income tax under the new regime', () => {
    const r = calculateSalary({ ctcAnnual: 600_000, regime: 'new' });
    expect(r.incomeTaxAnnual).toBe(0);
  });

  it('defaults to FY 2025-26, with FY 2024-25 still selectable', () => {
    const latest = calculateSalary({ ctcAnnual: 1_300_000, regime: 'new' });
    const prior = calculateSalary({ ctcAnnual: 1_300_000, regime: 'new', financialYear: '2024-25' });
    expect(latest.assumptions[0]).toContain('2025-26');
    expect(prior.assumptions[0]).toContain('2024-25');
    // The wider FY 2025-26 rebate means less (or equal) tax at the same CTC.
    expect(latest.incomeTaxAnnual).toBeLessThanOrEqual(prior.incomeTaxAnnual);
  });

  it('rejects an unknown financial year', () => {
    expect(() => calculateSalary({ ctcAnnual: 1_000_000, financialYear: '2099-00' as never })).toThrow();
  });

  it('lets PF be switched off', () => {
    const withPf = calculateSalary({ ctcAnnual: 1_000_000, employeePfEnabled: true });
    const withoutPf = calculateSalary({ ctcAnnual: 1_000_000, employeePfEnabled: false });
    expect(withoutPf.employeePfAnnual).toBe(0);
    expect(withoutPf.inHandAnnual).toBeGreaterThan(withPf.inHandAnnual);
  });

  it('respects custom basic/HRA percentages', () => {
    const r = calculateSalary({ ctcAnnual: 1_500_000, basicPctOfCtc: 50, hraPctOfBasic: 40 });
    expect(r.basicAnnual).toBeCloseTo(750_000, 0);
    expect(r.hraAnnual).toBeCloseTo(300_000, 0);
  });

  it.each([
    ['zero CTC', { ctcAnnual: 0 }],
    ['negative CTC', { ctcAnnual: -1 }],
    ['NaN CTC', { ctcAnnual: Number.NaN }],
    ['basic % too low', { ctcAnnual: 1_000_000, basicPctOfCtc: 5 }],
  ])('rejects %s', (_label, input) => {
    expect(() => calculateSalary(input as never)).toThrow();
  });
});

describe('incomeTaxForTaxableIncome (default FY = 2025-26)', () => {
  it('is zero within the new-regime 87A rebate limit of ₹12L', () => {
    expect(incomeTaxForTaxableIncome(1_200_000, 'new')).toBe(0);
  });

  it('taxes above ₹12L in the new regime, past the marginal-relief band', () => {
    // 15,00,000 taxable: 5% of 4L + 10% of 4L + 15% of 3L = 20k+40k+45k = 1,05,000, +4% cess.
    expect(incomeTaxForTaxableIncome(1_500_000, 'new')).toBeCloseTo(109_200, 0);
  });

  it('is monotonic in income under the old regime', () => {
    let prev = -1;
    for (const inc of [0, 3e5, 5e5, 8e5, 12e5, 2e6, 5e6]) {
      const tax = incomeTaxForTaxableIncome(inc, 'old');
      expect(tax).toBeGreaterThanOrEqual(prev);
      prev = tax;
    }
  });
});
