'use client';

import { ANALYTICS } from '@/config/site';
import type { AnalyticsEvent, AnalyticsPayload } from './events';
import { hasConsent } from '@/lib/consent';

/**
 * Fire-and-forget analytics. Never throws, never blocks the UI, no-ops without
 * consent. Uses sendBeacon so events survive navigation.
 */
export function track(
  event: AnalyticsEvent,
  data: Omit<AnalyticsPayload, 'event'> = {},
): void {
  if (typeof window === 'undefined') return;
  if (!hasConsent('analytics')) return;

  const payload: AnalyticsPayload = { event, ...data };

  try {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics', new Blob([body], { type: 'application/json' }));
    } else {
      void fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => undefined);
    }

    // Mirror to GA4 if configured.
    const w = window as unknown as { gtag?: (...args: unknown[]) => void };
    if (ANALYTICS.enabled && typeof w.gtag === 'function') {
      w.gtag('event', event, { ...data.meta, tool_slug: data.toolSlug, category: data.category });
    }
  } catch {
    /* analytics must never break the app */
  }
}
