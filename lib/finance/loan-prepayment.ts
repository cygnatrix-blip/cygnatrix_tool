import type { AmortizationRow } from '@/types/finance';
import { calculateEmi } from './emi';
import { assertNumber, monthlyRate, round } from './shared';

export type PrepaymentType = 'lumpsum' | 'monthly';

export interface LoanPrepaymentInput {
  principal: number;
  annualRatePct: number;
  tenureMonths: number;
  prepaymentType: PrepaymentType;
  /** One-time extra payment applied at `lumpsumMonth`. */
  lumpsumAmount?: number;
  lumpsumMonth?: number;
  /** Extra amount added to every EMI, from month 1 onward. */
  extraMonthly?: number;
}

export interface LoanPrepaymentResult {
  emi: number;
  originalTotalInterest: number;
  originalTenureMonths: number;
  newTotalInterest: number;
  newTenureMonths: number;
  interestSaved: number;
  emisSaved: number;
  originalSchedule: AmortizationRow[];
  newSchedule: AmortizationRow[];
}

function simulate(
  principal: number,
  r: number,
  emi: number,
  extraForMonth: (month: number) => number,
  maxMonths: number,
): AmortizationRow[] {
  const rows: AmortizationRow[] = [];
  let balance = principal;
  for (let period = 1; period <= maxMonths && balance > 0.005; period += 1) {
    const interest = r === 0 ? 0 : balance * r;
    const extra = Math.max(0, extraForMonth(period));
    let principalPart = emi - interest + extra;
    let payment = emi + extra;

    if (principalPart >= balance) {
      principalPart = balance;
      payment = balance + interest;
    }

    const closing = Math.max(0, balance - principalPart);
    rows.push({
      period,
      openingBalance: round(balance, 2),
      payment: round(payment, 2),
      principal: round(principalPart, 2),
      interest: round(interest, 2),
      closingBalance: round(closing, 2),
    });
    balance = closing;
  }
  return rows;
}

/**
 * Compare a loan's original payoff against the same loan with a prepayment
 * applied — either a one-time lump sum, or extra added to every EMI — showing
 * interest saved, months saved, and the new (shorter) tenure. The EMI itself
 * never changes; prepayment always shortens the tenure rather than lowering
 * the instalment, which is how most Indian lenders apply a foreclosure/
 * part-payment by default.
 */
export function calculateLoanPrepayment(input: LoanPrepaymentInput): LoanPrepaymentResult {
  assertNumber(input.principal, 'Loan amount', { min: 1, max: 1e12 });
  assertNumber(input.annualRatePct, 'Interest rate', { min: 0, max: 100 });
  assertNumber(input.tenureMonths, 'Loan tenure', { min: 1, max: 600 });

  const r = monthlyRate(input.annualRatePct);
  const n = Math.round(input.tenureMonths);
  const { emi } = calculateEmi({ principal: input.principal, annualRatePct: input.annualRatePct, tenureMonths: n });

  const originalSchedule = simulate(input.principal, r, emi, () => 0, n);
  const originalTotalInterest = round(
    originalSchedule.reduce((s, row) => s + row.interest, 0),
    2,
  );

  let extraForMonth: (m: number) => number;
  if (input.prepaymentType === 'lumpsum') {
    const amount = input.lumpsumAmount ?? 0;
    const month = Math.round(input.lumpsumMonth ?? 1);
    assertNumber(amount, 'Lump sum amount', { min: 0, max: input.principal });
    assertNumber(month, 'Lump sum month', { min: 1, max: n });
    extraForMonth = (m) => (m === month ? amount : 0);
  } else {
    const extra = input.extraMonthly ?? 0;
    assertNumber(extra, 'Extra monthly payment', { min: 0, max: input.principal });
    extraForMonth = () => extra;
  }

  // Cap the simulation at the original tenure + a safety margin — prepayment
  // only ever shortens payoff, it never needs more months than the original.
  const newSchedule = simulate(input.principal, r, emi, extraForMonth, n);
  const newTotalInterest = round(
    newSchedule.reduce((s, row) => s + row.interest, 0),
    2,
  );

  return {
    emi: round(emi, 2),
    originalTotalInterest,
    originalTenureMonths: originalSchedule.length,
    newTotalInterest,
    newTenureMonths: newSchedule.length,
    interestSaved: round(originalTotalInterest - newTotalInterest, 2),
    emisSaved: originalSchedule.length - newSchedule.length,
    originalSchedule,
    newSchedule,
  };
}
