import type { RdInput, RdResult } from '@/types/finance';
import { assertNumber, round } from './shared';

/**
 * Recurring Deposit maturity. Indian banks compound quarterly; each monthly
 * instalment earns interest for the remaining months to maturity. We model this
 * by advancing the balance monthly at the equivalent monthly rate derived from
 * the compounding frequency.
 *
 *   equivalent monthly factor m = (1 + r/(100·f)) ^ (f/12)
 *   balanceₖ = (balanceₖ₋₁ + deposit) · m
 */
export function calculateRd(input: RdInput): RdResult {
  assertNumber(input.monthlyDeposit, 'Monthly deposit', { min: 1, max: 1e10 });
  assertNumber(input.annualRatePct, 'Interest rate', { min: 0, max: 100 });
  assertNumber(input.tenureMonths, 'Tenure', { min: 1, max: 600 });

  const f = input.compounding ?? 4;
  const months = Math.round(input.tenureMonths);
  const monthlyFactor =
    input.annualRatePct === 0 ? 1 : (1 + input.annualRatePct / 100 / f) ** (f / 12);

  let balance = 0;
  for (let m = 0; m < months; m += 1) {
    balance = (balance + input.monthlyDeposit) * monthlyFactor;
  }

  const totalDeposited = round(input.monthlyDeposit * months, 2);
  const maturityValue = round(balance, 2);

  return {
    maturityValue,
    totalDeposited,
    interestEarned: round(maturityValue - totalDeposited, 2),
  };
}
