'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Primitive = number | string;

/**
 * Calculator state that round-trips through the URL's query string, so a
 * result can be shared with a link that reproduces it exactly. Reads once on
 * mount (client-only — never touches SSR/static generation, so the page stays
 * statically rendered), then keeps the URL in sync via `history.replaceState`
 * (no navigation, no extra history entries per keystroke — debounced).
 */
export function useShareableState<T extends Record<string, Primitive>>(
  defaults: T,
): [T, (patch: Partial<T>) => void] {
  const [state, setState] = useState<T>(defaults);
  const hydrated = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Hydrate from the URL exactly once, after mount.
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    try {
      const params = new URLSearchParams(window.location.search);
      if ([...params.keys()].length === 0) return;
      setState((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(defaults) as (keyof T)[]) {
          const raw = params.get(String(key));
          if (raw === null) continue;
          const isNumeric = typeof defaults[key] === 'number';
          if (isNumeric) {
            const n = Number(raw);
            if (Number.isFinite(n)) next[key] = n as T[keyof T];
          } else {
            next[key] = raw as T[keyof T];
          }
        }
        return next;
      });
    } catch {
      /* malformed query string — just keep defaults */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = useCallback((patch: Partial<T>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        try {
          const params = new URLSearchParams();
          for (const [key, value] of Object.entries(next)) {
            if (value !== undefined && value !== '') params.set(key, String(value));
          }
          const url = `${window.location.pathname}?${params.toString()}`;
          window.history.replaceState(null, '', url);
        } catch {
          /* not fatal — sharing just won't carry the current inputs */
        }
      }, 400);
      return next;
    });
  }, []);

  return [state, update];
}
