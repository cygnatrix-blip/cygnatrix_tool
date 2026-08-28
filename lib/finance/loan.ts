import type { EmiInput, EmiResult } from '@/types/finance';
import { calculateEmi } from './emi';

/**
 * The Loan Calculator is the EMI engine presented with loan-oriented outputs
 * (amount financed, total interest, total repayment, amortization schedule).
 * Keeping one engine avoids formula drift between the two pages.
 */
export function calculateLoan(input: EmiInput): EmiResult {
  return calculateEmi(input);
}

export type { EmiInput as LoanInput, EmiResult as LoanResult };
