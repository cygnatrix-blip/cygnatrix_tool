export const ANALYTICS_EVENTS = [
  'tool_view',
  'tool_started',
  'tool_completed',
  'tool_failed',
  'file_downloaded',
  'calculator_calculated',
  'category_view',
  'tool_search',
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

export interface AnalyticsPayload {
  event: AnalyticsEvent;
  toolSlug?: string;
  category?: string;
  /** Small, non-identifying key/values only (counts, durations, option names). */
  meta?: Record<string, string | number | boolean>;
}
