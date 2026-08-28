'use client';

import { useCallback, useEffect, useRef } from 'react';
import { track } from '@/lib/analytics/client';
import type { AnalyticsEvent } from '@/lib/analytics/events';

/**
 * Fires `tool_view` once on mount and returns a bound `event()` for the tool.
 * `calculator_calculated` is debounced so slider drags do not flood analytics.
 */
export function useToolAnalytics(toolSlug: string, category: string) {
  const calcTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    track('tool_view', { toolSlug, category });
  }, [toolSlug, category]);

  const event = useCallback(
    (event: AnalyticsEvent, meta?: Record<string, string | number | boolean>) => {
      track(event, { toolSlug, category, meta });
    },
    [toolSlug, category],
  );

  const calculated = useCallback(
    (meta?: Record<string, string | number | boolean>) => {
      if (calcTimer.current) clearTimeout(calcTimer.current);
      calcTimer.current = setTimeout(() => {
        track('calculator_calculated', { toolSlug, category, meta });
      }, 1200);
    },
    [toolSlug, category],
  );

  return { event, calculated };
}
