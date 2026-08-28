'use client';

/**
 * Cookie-consent state. Stored in localStorage (per-viewer, never sent to us).
 * Categories: "necessary" is always on; "analytics" and "ads" are opt-in.
 */
export type ConsentCategory = 'necessary' | 'analytics' | 'ads';

export interface ConsentState {
  analytics: boolean;
  ads: boolean;
  decidedAt: string | null;
}

const KEY = 'cygnatrix-consent-v1';

const DEFAULT: ConsentState = { analytics: false, ads: false, decidedAt: null };

export function readConsent(): ConsentState {
  if (typeof window === 'undefined') return DEFAULT;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    return {
      analytics: Boolean(parsed.analytics),
      ads: Boolean(parsed.ads),
      decidedAt: parsed.decidedAt ?? null,
    };
  } catch {
    return DEFAULT;
  }
}

export function writeConsent(next: Omit<ConsentState, 'decidedAt'>): ConsentState {
  const state: ConsentState = { ...next, decidedAt: new Date().toISOString() };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('cygnatrix:consent', { detail: state }));
  } catch {
    /* ignore */
  }
  return state;
}

export function hasConsent(category: ConsentCategory): boolean {
  if (category === 'necessary') return true;
  return readConsent()[category];
}

export function consentDecided(): boolean {
  return readConsent().decidedAt !== null;
}
