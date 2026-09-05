import type { GratuityInput, GratuityResult } from '@/types/finance';
import { GRATUITY_CONFIG } from '@/config/gratuity';
import { assertNumber, round } from './shared';

/**
 * Payment of Gratuity Act, 1972 formula:
 *   Gratuity = (15 × last drawn monthly salary × years of service) / 26
 * A fractional year of service ≥ 6 months rounds up to the next full year,
 * per common practice under the Act. Employers not covered by the Act use a
 * 30-day divisor instead of 26 (a widely used convention, not itself in the
 * Act's text).
 */
export function calculateGratuity(input: GratuityInput): GratuityResult {
  assertNumber(input.lastDrawnMonthlySalary, 'Last drawn monthly salary', { min: 0, max: 1e8 });
  assertNumber(input.yearsOfService, 'Years of service', { min: 0, max: 60 });

  const coveredUnderAct = input.coveredUnderAct ?? true;
  const divisor = coveredUnderAct ? GRATUITY_CONFIG.workingDaysPerMonth : 30;

  const wholeYears = Math.floor(input.yearsOfService);
  const fraction = input.yearsOfService - wholeYears;
  const yearsUsedInFormula = fraction >= 0.5 ? wholeYears + 1 : wholeYears;

  const rawGratuity =
    (GRATUITY_CONFIG.daysPerYearOfService * input.lastDrawnMonthlySalary * yearsUsedInFormula) / divisor;
  const gratuityPayable = round(rawGratuity, 2);

  const taxExemptAmount = round(Math.min(gratuityPayable, GRATUITY_CONFIG.statutoryExemptionLimit), 2);
  const taxableAmount = round(Math.max(0, gratuityPayable - taxExemptAmount), 2);

  return {
    gratuityPayable,
    statutoryExemptionLimit: GRATUITY_CONFIG.statutoryExemptionLimit,
    taxExemptAmount,
    taxableAmount,
    yearsUsedInFormula,
  };
}
