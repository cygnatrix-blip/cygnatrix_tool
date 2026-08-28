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
