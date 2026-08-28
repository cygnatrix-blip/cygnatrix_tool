import type { SipInput, SipResult, YearlyPoint } from '@/types/finance';
import { assertNumber, monthlyRate, round } from './shared';

/**
 * SIP future value (contributions at the start of each month):
 *   FV = P · [ ((1+i)^n − 1) / i ] · (1+i)
 *   i = monthly return (fraction), n = number of months
 * When i = 0, FV = P · n. Optional annual step-up increases the monthly amount
 * at each 12-month boundary.
 */
export function calculateSip(input: SipInput): SipResult {
  assertNumber(input.monthlyInvestment, 'Monthly investment', { min: 1, max: 1e10 });
  assertNumber(input.annualReturnPct, 'Expected annual return', { min: 0, max: 100 });
  assertNumber(input.years, 'Investment period', { min: 1, max: 60 });
  if (input.annualStepUpPct !== undefined) {
    assertNumber(input.annualStepUpPct, 'Annual step-up', { min: 0, max: 100 });
  }

  const i = monthlyRate(input.annualReturnPct);
  const totalMonths = Math.round(input.years * 12);
  const stepUp = (input.annualStepUpPct ?? 0) / 100;

  let balance = 0;
  let invested = 0;
  let monthly = input.monthlyInvestment;
  const yearly: YearlyPoint[] = [];

  for (let month = 1; month <= totalMonths; month += 1) {
    balance = (balance + monthly) * (1 + i);
    invested += monthly;

    if (month % 12 === 0 || month === totalMonths) {
      yearly.push({
        year: Math.ceil(month / 12),
        invested: round(invested, 2),
        value: round(balance, 2),
        gain: round(balance - invested, 2),
      });
    }
    if (month % 12 === 0 && stepUp > 0) {
      monthly = monthly * (1 + stepUp);
    }
  }

  const futureValue = round(balance, 2);
  const investedRounded = round(invested, 2);

  return {
    invested: investedRounded,
    estimatedReturns: round(futureValue - investedRounded, 2),
    futureValue,
    yearly,
  };
}
