/**
 * Indian payroll rules in one dated place. When the law changes, edit this file only —
 * the calculator UI and `lib/finance/salary.ts` never need to be touched.
 *
 * These are simplified, widely-used conventions for an estimate. They are NOT a
 * substitute for a payslip, a CA's advice, or your employer's actual policy.
 */

export const PAYROLL_CONFIG = {
  /** Financial year these rules are modelled on. */
  financialYear: '2024-25',

  defaults: {
    /** Basic salary as a share of CTC (commonly 40–50%). */
    basicPctOfCtc: 40,
    /** HRA as a share of basic (commonly 40–50%). */
    hraPctOfBasic: 50,
  },

  providentFund: {
    /** Employee + employer each contribute 12% of basic. */
    ratePct: 12,
    /**
     * Statutory wage ceiling for mandatory PF is ₹15,000 of basic. Many employers
     * contribute on actual basic instead — expose as a toggle, default to actual.
     */
    statutoryWageCeiling: 15000,
    applyCeilingByDefault: false,
  },

  /**
   * Professional tax is a state subject. This is the common Maharashtra-style slab
   * used as a reasonable default (₹2,500 / year). Editable per deployment.
   */
  professionalTax: {
    annualMax: 2500,
    monthlyTypical: 200,
    februaryTypical: 300,
  },

  /** Standard deduction against salary income. */
  standardDeduction: {
    new: 75000,
    old: 50000,
  },

  /**
   * Income tax slabs (annual, ₹). Rates as fractions. Rebate under 87A makes tax
   * effectively nil up to the listed taxable-income threshold.
   */
  incomeTax: {
    new: {
      rebate87ATaxableLimit: 700000,
      cessPct: 4,
      slabs: [
        { upTo: 300000, rate: 0 },
        { upTo: 700000, rate: 0.05 },
        { upTo: 1000000, rate: 0.1 },
        { upTo: 1200000, rate: 0.15 },
        { upTo: 1500000, rate: 0.2 },
        { upTo: Infinity, rate: 0.3 },
      ],
    },
    old: {
      rebate87ATaxableLimit: 500000,
      cessPct: 4,
      slabs: [
        { upTo: 250000, rate: 0 },
        { upTo: 500000, rate: 0.05 },
        { upTo: 1000000, rate: 0.2 },
        { upTo: Infinity, rate: 0.3 },
      ],
    },
  },
} as const;

export type TaxRegime = 'new' | 'old';

export function incomeTaxForTaxableIncome(taxableIncome: number, regime: TaxRegime): number {
  const cfg = PAYROLL_CONFIG.incomeTax[regime];
  if (taxableIncome <= 0) return 0;
  if (taxableIncome <= cfg.rebate87ATaxableLimit) return 0;

  let remaining = taxableIncome;
  let lastCap = 0;
  let tax = 0;
  for (const slab of cfg.slabs) {
    const band = Math.min(remaining, slab.upTo - lastCap);
    if (band > 0) {
      tax += band * slab.rate;
      remaining -= band;
    }
    lastCap = slab.upTo;
    if (remaining <= 0) break;
  }
  return tax * (1 + cfg.cessPct / 100);
}
