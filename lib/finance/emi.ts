import type { AmortizationRow, EmiInput, EmiResult } from '@/types/finance';
import { assertNumber, monthlyRate, round } from './shared';

/**
 * EMI = P·r·(1+r)^n / ((1+r)^n − 1)
 *   P = principal, r = monthly interest rate (fraction), n = number of monthly payments
 * When r = 0 the loan is repaid in equal principal instalments: EMI = P / n.
 */
export function calculateEmi(input: EmiInput): EmiResult {
  assertNumber(input.principal, 'Loan amount', { min: 1, max: 1e12 });
  assertNumber(input.annualRatePct, 'Interest rate', { min: 0, max: 100 });
  assertNumber(input.tenureMonths, 'Loan tenure', { min: 1, max: 600 });

  const n = Math.round(input.tenureMonths);
  const r = monthlyRate(input.annualRatePct);
  const p = input.principal;

  const rawEmi = r === 0 ? p / n : (p * r * (1 + r) ** n) / ((1 + r) ** n - 1);
  const emi = round(rawEmi, 2);

  const schedule = buildSchedule(p, r, n, rawEmi);
  const totalPayment = round(
    schedule.reduce((sum, row) => sum + row.payment, 0),
    2,
  );
  const totalInterest = round(totalPayment - p, 2);

  return {
    emi,
    totalInterest,
    totalPayment,
    principal: round(p, 2),
    schedule,
  };
}

/**
 * Full amortization schedule. The final instalment absorbs rounding drift so the
 * closing balance lands exactly on zero.
 */
export function buildSchedule(
  principal: number,
  monthlyRateFraction: number,
  months: number,
  emi: number,
): AmortizationRow[] {
  const rows: AmortizationRow[] = [];
  let balance = principal;

  for (let period = 1; period <= months; period += 1) {
    const interest = monthlyRateFraction === 0 ? 0 : balance * monthlyRateFraction;
    let principalPart = emi - interest;
    let payment = emi;

    const isLast = period === months;
    if (isLast || principalPart >= balance) {
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
    if (balance <= 0) break;
  }

  return rows;
}

/** Year-by-year principal vs interest totals — handy for charts. */
export function yearlyBreakdown(schedule: AmortizationRow[]): {
  year: number;
  principal: number;
  interest: number;
}[] {
  const map = new Map<number, { principal: number; interest: number }>();
  for (const row of schedule) {
    const year = Math.ceil(row.period / 12);
    const acc = map.get(year) ?? { principal: 0, interest: 0 };
    acc.principal += row.principal;
    acc.interest += row.interest;
    map.set(year, acc);
  }
  return [...map.entries()].map(([year, v]) => ({
    year,
    principal: round(v.principal, 2),
    interest: round(v.interest, 2),
  }));
}
