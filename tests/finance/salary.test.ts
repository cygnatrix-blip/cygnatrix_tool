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

describe('incomeTaxForTaxableIncome', () => {
  it('is zero within the 87A rebate limit (new regime)', () => {
    expect(incomeTaxForTaxableIncome(700_000, 'new')).toBe(0);
  });

  it('applies slab rates with cess above the rebate limit (new regime)', () => {
    // 12,00,000 taxable: 5% of 4L + 10% of 3L + 15% of 2L = 20000+30000+30000 = 80000, +4% cess
    expect(incomeTaxForTaxableIncome(1_200_000, 'new')).toBeCloseTo(83_200, 0);
  });

  it('is monotonic in income', () => {
    let prev = -1;
    for (const inc of [0, 3e5, 5e5, 8e5, 12e5, 2e6, 5e6]) {
      const tax = incomeTaxForTaxableIncome(inc, 'old');
      expect(tax).toBeGreaterThanOrEqual(prev);
      prev = tax;
    }
  });
});
