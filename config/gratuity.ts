/**
 * Payment of Gratuity Act, 1972 constants, in one dated place. When the
 * statutory exemption limit changes (last revised to ₹20,00,000 in 2019), edit
 * this file only.
 */
export const GRATUITY_CONFIG = {
  asOf: 'Payment of Gratuity Act, 1972 (exemption limit revised 2019)',
  /** Formula divisor: 26 working days per month. */
  workingDaysPerMonth: 26,
  /** Days of salary paid per year of service. */
  daysPerYearOfService: 15,
  /** Tax-exempt ceiling under Section 10(10) for employees covered by the Act. */
  statutoryExemptionLimit: 2000000,
} as const;
