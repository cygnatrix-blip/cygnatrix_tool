'use client';

import { useEffect, useMemo } from 'react';
import { CalculationError } from '@/lib/finance/shared';
import { useToolAnalytics } from './useToolAnalytics';

export type CalcState<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/**
 * Runs a pure calculation whenever `deps` change, converts thrown
 * CalculationErrors into friendly messages, and fires debounced analytics.
 */
export function useCalc<T>(
  toolSlug: string,
  compute: () => T,
  deps: React.DependencyList,
  analyticsMeta?: () => Record<string, string | number | boolean>,
): CalcState<T> {
  const { calculated } = useToolAnalytics(toolSlug, 'finance');

  const state = useMemo<CalcState<T>>(() => {
    try {
      return { ok: true, data: compute() };
    } catch (e) {
      return {
        ok: false,
        error: e instanceof CalculationError ? e.message : 'Please check the values you entered.',
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (state.ok) calculated(analyticsMeta?.());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.ok, ...deps]);

  return state;
}
