import type { CagrInput, CagrResult } from '@/types/finance';
import { assertNumber, round } from './shared';

/**
 * Compound Annual Growth Rate:
 *   CAGR = (finalValue / initialValue) ^ (1 / years) − 1
 */
export function calculateCagr(input: CagrInput): CagrResult {
  assertNumber(input.initialValue, 'Initial value', { min: 1, max: 1e14 });
  assertNumber(input.finalValue, 'Final value', { min: 0, max: 1e14 });
  assertNumber(input.years, 'Investment period', { min: 0.01, max: 100 });

  const multiple = input.finalValue / input.initialValue;
  const cagr = multiple ** (1 / input.years) - 1;
  const absoluteReturn = multiple - 1;

  return {
    cagrPct: round(cagr * 100, 2),
    absoluteReturnPct: round(absoluteReturn * 100, 2),
    multiple: round(multiple, 4),
  };
}
