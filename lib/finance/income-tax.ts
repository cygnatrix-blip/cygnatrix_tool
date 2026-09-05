import {
  PAYROLL_CONFIG,
  incomeTaxForTaxableIncome,
  LATEST_FY,
  type TaxRegime,
  type FinancialYear,
} from '@/config/india-payroll';
import { assertNumber, CalculationError, round } from './shared';

export interface IncomeTaxInput {
  /** Gross annual income before standard deduction. */
  annualIncome: number;
  /** Old-regime-only deductions: 80C, 80D, home loan interest, HRA exemption, etc., combined. */
  oldRegimeDeductions?: number;
  /** Financial year to apply. Defaults to the latest. */
  financialYear?: FinancialYear;
}

export interface RegimeBreakdown {
  regime: TaxRegime;
  standardDeduction: number;
  otherDeductions: number;
  taxableIncome: number;
  incomeTax: number;
  effectiveRatePct: number;
  inHandAnnual: number;
}

export interface IncomeTaxResult {
  financialYear: FinancialYear;
  old: RegimeBreakdown;
  new: RegimeBreakdown;
  betterRegime: TaxRegime | 'equal';
  annualSavings: number;
}

function computeRegime(
  annualIncome: number,
  regime: TaxRegime,
  oldRegimeDeductions: number,
  fy: FinancialYear,
): RegimeBreakdown {
  const standardDeduction = PAYROLL_CONFIG.standardDeduction[fy][regime];
  const otherDeductions = regime === 'old' ? Math.max(0, oldRegimeDeductions) : 0;
  const taxableIncome = Math.max(0, annualIncome - standardDeduction - otherDeductions);
  const incomeTax = incomeTaxForTaxableIncome(taxableIncome, regime, fy);
  return {
    regime,
    standardDeduction,
    otherDeductions,
    taxableIncome: round(taxableIncome, 2),
    incomeTax: round(incomeTax, 2),
    effectiveRatePct: annualIncome > 0 ? round((incomeTax / annualIncome) * 100, 2) : 0,
    inHandAnnual: round(annualIncome - incomeTax, 2),
  };
}

/**
 * Compare the new and old income-tax regimes side by side for the same gross
 * income, so the user can see which one actually saves them money. Rates and
 * slabs live in config/india-payroll.ts — this module only orchestrates.
 */
export function calculateIncomeTax(input: IncomeTaxInput): IncomeTaxResult {
  assertNumber(input.annualIncome, 'Annual income', { min: 0, max: 1e11 });
  const oldRegimeDeductions = input.oldRegimeDeductions ?? 0;
  assertNumber(oldRegimeDeductions, 'Old regime deductions', { min: 0, max: input.annualIncome });

  const fy = input.financialYear ?? LATEST_FY;
  if (!PAYROLL_CONFIG.incomeTax[fy]) {
    throw new CalculationError(`Unknown financial year "${fy}".`);
  }

  const old = computeRegime(input.annualIncome, 'old', oldRegimeDeductions, fy);
  const nw = computeRegime(input.annualIncome, 'new', oldRegimeDeductions, fy);

  const diff = round(old.incomeTax - nw.incomeTax, 2);
  const betterRegime: TaxRegime | 'equal' = diff > 0 ? 'new' : diff < 0 ? 'old' : 'equal';

  return { financialYear: fy, old, new: nw, betterRegime, annualSavings: Math.abs(diff) };
}
