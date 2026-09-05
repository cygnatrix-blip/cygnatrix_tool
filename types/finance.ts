export interface AmortizationRow {
  period: number;
  openingBalance: number;
  payment: number;
  principal: number;
  interest: number;
  closingBalance: number;
}

export interface YearlyPoint {
  year: number;
  invested: number;
  value: number;
  gain: number;
}

export interface EmiInput {
  principal: number;
  annualRatePct: number;
  tenureMonths: number;
}

export interface EmiResult {
  emi: number;
  totalInterest: number;
  totalPayment: number;
  principal: number;
  schedule: AmortizationRow[];
}

export interface SipInput {
  monthlyInvestment: number;
  annualReturnPct: number;
  years: number;
  /** Optional annual step-up percentage applied each year. */
  annualStepUpPct?: number;
}

export interface SipResult {
  invested: number;
  estimatedReturns: number;
  futureValue: number;
  yearly: YearlyPoint[];
}

export type CompoundingFrequency = 1 | 2 | 4 | 12;

export interface FdInput {
  principal: number;
  annualRatePct: number;
  tenureMonths: number;
  compounding: CompoundingFrequency;
}

export interface FdResult {
  maturityValue: number;
  interestEarned: number;
  principal: number;
}

export interface RdInput {
  monthlyDeposit: number;
  annualRatePct: number;
  tenureMonths: number;
  /** Bank convention: quarterly compounding by default. */
  compounding?: CompoundingFrequency;
}

export interface RdResult {
  maturityValue: number;
  totalDeposited: number;
  interestEarned: number;
}

export type GstMode = 'exclusive' | 'inclusive';

export interface GstInput {
  amount: number;
  ratePct: number;
  mode: GstMode;
  /** Inter-state supply → single IGST instead of CGST+SGST. */
  interState?: boolean;
}

export interface GstResult {
  baseAmount: number;
  gstAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
}

export interface CagrInput {
  initialValue: number;
  finalValue: number;
  years: number;
}

export interface CagrResult {
  cagrPct: number;
  absoluteReturnPct: number;
  multiple: number;
}

export interface SalaryInput {
  ctcAnnual: number;
  basicPctOfCtc?: number;
  hraPctOfBasic?: number;
  monthlyProfessionalTax?: number;
  otherMonthlyDeductions?: number;
  employeePfEnabled?: boolean;
  regime?: 'new' | 'old';
  /** Financial year for tax slabs; defaults to the latest in config/india-payroll.ts. */
  financialYear?: '2025-26' | '2024-25';
}

export type AssetClass = 'equity' | 'other';

export interface CapitalGainsInput {
  assetClass: AssetClass;
  purchaseValue: number;
  saleValue: number;
  holdingMonths: number;
}

export interface CapitalGainsResult {
  assetClass: AssetClass;
  gain: number;
  isLongTerm: boolean;
  exemptionApplied: number;
  taxableGain: number;
  /** null when the tax depends on the person's income slab rather than a flat rate. */
  tax: number | null;
  ratePct: number | null;
  note: string | null;
}

export interface HraInput {
  basicPlusDaAnnual: number;
  hraReceivedAnnual: number;
  rentPaidAnnual: number;
  isMetro: boolean;
}

export interface HraResult {
  exemptAnnual: number;
  taxableHraAnnual: number;
  limitingFactor: 'actualHra' | 'rentMinusTenPct' | 'salaryPct';
  breakdown: {
    actualHra: number;
    rentMinusTenPct: number;
    salaryPct: number;
  };
}

export interface GratuityInput {
  lastDrawnMonthlySalary: number;
  yearsOfService: number;
  /** Employer covered under the Payment of Gratuity Act, 1972 (almost all are). */
  coveredUnderAct?: boolean;
}

export interface GratuityResult {
  gratuityPayable: number;
  statutoryExemptionLimit: number;
  taxExemptAmount: number;
  taxableAmount: number;
  yearsUsedInFormula: number;
}

export interface SwpInput {
  initialInvestment: number;
  monthlyWithdrawal: number;
  annualReturnPct: number;
  years: number;
}

export interface SwpYearlyPoint {
  year: number;
  withdrawn: number;
  value: number;
}

export interface SwpResult {
  totalWithdrawn: number;
  finalValue: number;
  /** Number of months the corpus lasted; null if it survived the full period. */
  monthsUntilDepleted: number | null;
  yearly: SwpYearlyPoint[];
}

export interface SalaryResult {
  ctcAnnual: number;
  grossAnnual: number;
  grossMonthly: number;
  basicAnnual: number;
  hraAnnual: number;
  specialAllowanceAnnual: number;
  employeePfAnnual: number;
  employerPfAnnual: number;
  professionalTaxAnnual: number;
  incomeTaxAnnual: number;
  otherDeductionsAnnual: number;
  totalDeductionsAnnual: number;
  inHandAnnual: number;
  inHandMonthly: number;
  assumptions: string[];
}
