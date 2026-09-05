import type { HraInput, HraResult } from '@/types/finance';
import { assertNumber, round } from './shared';

/**
 * Section 10(13A) HRA exemption: the least of three amounts is exempt from tax.
 *   1. Actual HRA received
 *   2. Rent paid minus 10% of (basic + DA)
 *   3. 50% of (basic + DA) in a metro, else 40%
 */
export function calculateHraExemption(input: HraInput): HraResult {
  assertNumber(input.basicPlusDaAnnual, 'Basic + DA', { min: 0, max: 1e10 });
  assertNumber(input.hraReceivedAnnual, 'HRA received', { min: 0, max: 1e10 });
  assertNumber(input.rentPaidAnnual, 'Rent paid', { min: 0, max: 1e10 });

  const actualHra = input.hraReceivedAnnual;
  const rentMinusTenPct = Math.max(0, input.rentPaidAnnual - 0.1 * input.basicPlusDaAnnual);
  const salaryPct = (input.isMetro ? 0.5 : 0.4) * input.basicPlusDaAnnual;

  const candidates: { key: HraResult['limitingFactor']; value: number }[] = [
    { key: 'actualHra', value: actualHra },
    { key: 'rentMinusTenPct', value: rentMinusTenPct },
    { key: 'salaryPct', value: salaryPct },
  ];
  const limiting = candidates.reduce((min, c) => (c.value < min.value ? c : min));
  const exemptAnnual = round(limiting.value, 2);

  return {
    exemptAnnual,
    taxableHraAnnual: round(Math.max(0, input.hraReceivedAnnual - exemptAnnual), 2),
    limitingFactor: limiting.key,
    breakdown: {
      actualHra: round(actualHra, 2),
      rentMinusTenPct: round(rentMinusTenPct, 2),
      salaryPct: round(salaryPct, 2),
    },
  };
}
