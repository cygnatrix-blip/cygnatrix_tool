/** Shared helpers for the finance calculation layer. Pure — no DOM, no React. */

export class CalculationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CalculationError';
  }
}

/** Round to `dp` decimal places using round-half-up on the absolute value. */
export function round(value: number, dp = 2): number {
  if (!Number.isFinite(value)) return 0;
  const f = 10 ** dp;
  return Math.round((value + Number.EPSILON) * f) / f;
}

/** Assert a value is a finite number within an inclusive range. */
export function assertNumber(
  value: unknown,
  label: string,
  { min, max, allowZero = true }: { min?: number; max?: number; allowZero?: boolean } = {},
): asserts value is number {
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
    throw new CalculationError(`${label} must be a valid number.`);
  }
  if (!allowZero && value === 0) {
    throw new CalculationError(`${label} must not be zero.`);
  }
  if (min !== undefined && value < min) {
    throw new CalculationError(`${label} must be at least ${min}.`);
  }
  if (max !== undefined && value > max) {
    throw new CalculationError(`${label} must be ${max} or less.`);
  }
}

/** Monthly rate (as a fraction) from an annual percentage. */
export function monthlyRate(annualRatePct: number): number {
  return annualRatePct / 100 / 12;
}
