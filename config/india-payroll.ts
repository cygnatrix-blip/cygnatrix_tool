/**
 * Indian payroll & income-tax rules in one dated place. When the law changes, edit
 * this file only — the calculator UI and `lib/finance/*` never need to be touched.
 *
 * These are simplified, widely-used conventions for an estimate. They are NOT a
 * substitute for a payslip, a CA's advice, or your employer's actual policy.
 *
 * Income-tax rules are keyed by financial year. `LATEST_FY` is what the
 * calculators default to; older years stay selectable for people still filing
 * or reconciling a prior return.
 *
 * Verified against: FY 2025-26 slabs from the Union Budget presented 1 Feb 2025;
 * FY 2024-25 slabs from the Budget of Jul 2024. Last reviewed 2026-09-05.
 */

export type TaxRegime = 'new' | 'old';
export type FinancialYear = '2025-26' | '2024-25';

/** Financial years this config knows about, newest first. */
export const FINANCIAL_YEARS: readonly FinancialYear[] = ['2025-26', '2024-25'];

/** The FY the calculators default to. */
export const LATEST_FY: FinancialYear = '2025-26';

interface Slab {
  readonly upTo: number;
  readonly rate: number;
}

interface RegimeRules {
  /**
   * Section 87A rebate. Within `taxableLimit`, the rebate is the lower of the
   * computed tax or `maxRebate` (so tax is nil up to the limit). `marginalRelief`
   * caps tax just above the limit at the amount of income exceeding it.
   */
  readonly rebate87A: { taxableLimit: number; maxRebate: number; marginalRelief: boolean };
  readonly cessPct: number;
  readonly slabs: readonly Slab[];
}

export const PAYROLL_CONFIG = {
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

  /** Standard deduction against salary income, by financial year and regime. */
  standardDeduction: {
    '2025-26': { new: 75000, old: 50000 },
    '2024-25': { new: 75000, old: 50000 },
  } as Record<FinancialYear, Record<TaxRegime, number>>,

  /** Income tax slabs (annual, ₹). Rates as fractions. */
  incomeTax: {
    '2025-26': {
      new: {
        rebate87A: { taxableLimit: 1200000, maxRebate: 60000, marginalRelief: true },
        cessPct: 4,
        slabs: [
          { upTo: 400000, rate: 0 },
          { upTo: 800000, rate: 0.05 },
          { upTo: 1200000, rate: 0.1 },
          { upTo: 1600000, rate: 0.15 },
          { upTo: 2000000, rate: 0.2 },
          { upTo: 2400000, rate: 0.25 },
          { upTo: Infinity, rate: 0.3 },
        ],
      },
      old: {
        rebate87A: { taxableLimit: 500000, maxRebate: 12500, marginalRelief: false },
        cessPct: 4,
        slabs: [
          { upTo: 250000, rate: 0 },
          { upTo: 500000, rate: 0.05 },
          { upTo: 1000000, rate: 0.2 },
          { upTo: Infinity, rate: 0.3 },
        ],
      },
    },
    '2024-25': {
      new: {
        rebate87A: { taxableLimit: 700000, maxRebate: 25000, marginalRelief: true },
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
        rebate87A: { taxableLimit: 500000, maxRebate: 12500, marginalRelief: false },
        cessPct: 4,
        slabs: [
          { upTo: 250000, rate: 0 },
          { upTo: 500000, rate: 0.05 },
          { upTo: 1000000, rate: 0.2 },
          { upTo: Infinity, rate: 0.3 },
        ],
      },
    },
  } as Record<FinancialYear, Record<TaxRegime, RegimeRules>>,
} as const;

/** Progressive slab tax, before rebate and cess. */
function slabTax(taxableIncome: number, slabs: readonly Slab[]): number {
  let remaining = taxableIncome;
  let lastCap = 0;
  let tax = 0;
  for (const slab of slabs) {
    const band = Math.min(remaining, slab.upTo - lastCap);
    if (band > 0) {
      tax += band * slab.rate;
      remaining -= band;
    }
    lastCap = slab.upTo;
    if (remaining <= 0) break;
  }
  return tax;
}

/**
 * Income tax on a taxable income for a regime and financial year, including the
 * Section 87A rebate, marginal relief (new regime, just above the rebate limit)
 * and 4% health & education cess. Surcharge on very high incomes is not modelled.
 */
export function incomeTaxForTaxableIncome(
  taxableIncome: number,
  regime: TaxRegime,
  fy: FinancialYear = LATEST_FY,
): number {
  const cfg = PAYROLL_CONFIG.incomeTax[fy][regime];
  if (taxableIncome <= 0) return 0;

  const base = slabTax(taxableIncome, cfg.slabs);
  const cess = 1 + cfg.cessPct / 100;
  const { taxableLimit, maxRebate, marginalRelief } = cfg.rebate87A;

  if (taxableIncome <= taxableLimit) {
    // Rebate is the lower of the tax or the cap — nil tax up to the limit.
    return Math.max(0, base - maxRebate) * cess;
  }

  if (marginalRelief) {
    // Tax payable is capped at the income exceeding the rebate threshold.
    return Math.min(base, taxableIncome - taxableLimit) * cess;
  }

  return base * cess;
}
