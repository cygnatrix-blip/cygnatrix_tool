import type { SalaryInput, SalaryResult } from '@/types/finance';
import { PAYROLL_CONFIG, incomeTaxForTaxableIncome, type TaxRegime } from '@/config/india-payroll';
import { assertNumber, round } from './shared';

/**
 * Estimate in-hand salary from CTC using common Indian payroll conventions.
 * All rules live in `config/india-payroll.ts`.
 *
 * Model:
 *   CTC = gross + employer PF
 *   gross = basic + HRA + special allowance
 *   in-hand = gross − employee PF − professional tax − income tax − other deductions
 */
export function calculateSalary(input: SalaryInput): SalaryResult {
  assertNumber(input.ctcAnnual, 'Annual CTC', { min: 1, max: 1e11 });

  const regime: TaxRegime = input.regime ?? 'new';
  const basicPct = input.basicPctOfCtc ?? PAYROLL_CONFIG.defaults.basicPctOfCtc;
  const hraPct = input.hraPctOfBasic ?? PAYROLL_CONFIG.defaults.hraPctOfBasic;
  const pfEnabled = input.employeePfEnabled ?? true;

  assertNumber(basicPct, 'Basic % of CTC', { min: 10, max: 100 });
  assertNumber(hraPct, 'HRA % of basic', { min: 0, max: 100 });

  const ctc = input.ctcAnnual;
  const basic = ctc * (basicPct / 100);
  const hra = basic * (hraPct / 100);

  // PF: 12% of basic (optionally capped at the statutory wage ceiling).
  const pfBase = PAYROLL_CONFIG.providentFund.applyCeilingByDefault
    ? Math.min(basic / 12, PAYROLL_CONFIG.providentFund.statutoryWageCeiling) * 12
    : basic;
  const employeePf = pfEnabled ? pfBase * (PAYROLL_CONFIG.providentFund.ratePct / 100) : 0;
  const employerPf = employeePf; // symmetrical contribution

  // Special allowance is the balancing figure so that basic + HRA + special + employer PF = CTC.
  const specialAllowance = Math.max(0, ctc - basic - hra - employerPf);
  const gross = basic + hra + specialAllowance;

  const professionalTax = Math.min(
    PAYROLL_CONFIG.professionalTax.annualMax,
    (input.monthlyProfessionalTax ?? PAYROLL_CONFIG.professionalTax.monthlyTypical) * 12,
  );

  // Taxable income (simplified): gross − standard deduction − employee PF (old regime only).
  const standardDeduction = PAYROLL_CONFIG.standardDeduction[regime];
  const pfDeductionForTax = regime === 'old' ? employeePf : 0;
  const taxableIncome = Math.max(0, gross - standardDeduction - pfDeductionForTax);
  const incomeTax = incomeTaxForTaxableIncome(taxableIncome, regime);

  const otherDeductions = (input.otherMonthlyDeductions ?? 0) * 12;

  const totalDeductions = employeePf + professionalTax + incomeTax + otherDeductions;
  const inHandAnnual = gross - totalDeductions;

  const assumptions = [
    `Financial year ${PAYROLL_CONFIG.financialYear}, ${regime === 'new' ? 'new' : 'old'} tax regime.`,
    `Basic = ${basicPct}% of CTC; HRA = ${hraPct}% of basic; special allowance balances the rest.`,
    `Provident Fund = ${PAYROLL_CONFIG.providentFund.ratePct}% of basic for both employee and employer${
      PAYROLL_CONFIG.providentFund.applyCeilingByDefault ? ' (capped at the ₹15,000 wage ceiling)' : ''
    }.`,
    `Professional tax assumed at ₹${round(professionalTax, 0)} per year (varies by state).`,
    `Standard deduction of ₹${standardDeduction.toLocaleString('en-IN')} applied; 87A rebate considered.`,
    'Income tax is an estimate and excludes HRA exemption, 80C/80D and other individual exemptions.',
  ];

  return {
    ctcAnnual: round(ctc, 2),
    grossAnnual: round(gross, 2),
    grossMonthly: round(gross / 12, 2),
    basicAnnual: round(basic, 2),
    hraAnnual: round(hra, 2),
    specialAllowanceAnnual: round(specialAllowance, 2),
    employeePfAnnual: round(employeePf, 2),
    employerPfAnnual: round(employerPf, 2),
    professionalTaxAnnual: round(professionalTax, 2),
    incomeTaxAnnual: round(incomeTax, 2),
    otherDeductionsAnnual: round(otherDeductions, 2),
    totalDeductionsAnnual: round(totalDeductions, 2),
    inHandAnnual: round(inHandAnnual, 2),
    inHandMonthly: round(inHandAnnual / 12, 2),
    assumptions,
  };
}
