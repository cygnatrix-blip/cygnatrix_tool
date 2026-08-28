import type { FdInput, FdResult } from '@/types/finance';
import { assertNumber, round } from './shared';

/**
 * Fixed Deposit maturity with periodic compounding:
 *   M = P · (1 + r / (100·f)) ^ (f · t)
 *   f = compounds per year, t = tenure in years, r = annual rate (%)
 */
export function calculateFd(input: FdInput): FdResult {
  assertNumber(input.principal, 'Principal', { min: 1, max: 1e12 });
  assertNumber(input.annualRatePct, 'Interest rate', { min: 0, max: 100 });
  assertNumber(input.tenureMonths, 'Tenure', { min: 1, max: 600 });

  const validFreq = [1, 2, 4, 12];
  if (!validFreq.includes(input.compounding)) {
    throw new Error('Compounding frequency must be 1, 2, 4 or 12.');
  }

  const f = input.compounding;
  const t = input.tenureMonths / 12;
  const ratePerPeriod = input.annualRatePct / 100 / f;
  const maturity = input.principal * (1 + ratePerPeriod) ** (f * t);

  const maturityValue = round(maturity, 2);
  return {
    maturityValue,
    interestEarned: round(maturityValue - input.principal, 2),
    principal: round(input.principal, 2),
  };
}
