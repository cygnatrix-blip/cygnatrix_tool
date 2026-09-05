import type { SwpInput, SwpResult, SwpYearlyPoint } from '@/types/finance';
import { assertNumber, monthlyRate, round } from './shared';

/**
 * Systematic Withdrawal Plan: a fixed amount is withdrawn at the start of
 * each month, then the remaining balance grows at the expected monthly
 * return for the rest of the month. Mirrors the SIP engine's month-by-month
 * style but depletes instead of accumulates — the corpus can run out before
 * the requested period ends, which is reported via `monthsUntilDepleted`.
 */
export function calculateSwp(input: SwpInput): SwpResult {
  assertNumber(input.initialInvestment, 'Initial investment', { min: 1, max: 1e12 });
  assertNumber(input.monthlyWithdrawal, 'Monthly withdrawal', { min: 1, max: 1e10 });
  assertNumber(input.annualReturnPct, 'Expected annual return', { min: 0, max: 100 });
  assertNumber(input.years, 'Withdrawal period', { min: 1, max: 60 });

  const i = monthlyRate(input.annualReturnPct);
  const totalMonths = Math.round(input.years * 12);

  let balance = input.initialInvestment;
  let withdrawn = 0;
  let monthsUntilDepleted: number | null = null;
  const yearly: SwpYearlyPoint[] = [];

  for (let month = 1; month <= totalMonths; month += 1) {
    const actualWithdrawal = Math.min(input.monthlyWithdrawal, balance);
    balance -= actualWithdrawal;
    withdrawn += actualWithdrawal;

    if (balance > 0) {
      balance *= 1 + i;
    } else if (monthsUntilDepleted === null) {
      monthsUntilDepleted = month;
    }

    if (month % 12 === 0 || month === totalMonths) {
      yearly.push({
        year: Math.ceil(month / 12),
        withdrawn: round(withdrawn, 2),
        value: round(balance, 2),
      });
    }
  }

  return {
    totalWithdrawn: round(withdrawn, 2),
    finalValue: round(balance, 2),
    monthsUntilDepleted,
    yearly,
  };
}
