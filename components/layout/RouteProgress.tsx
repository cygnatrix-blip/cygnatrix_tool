'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

type Phase = 'idle' | 'active' | 'done';

/**
 * Thin top progress bar for client navigations. It waits ~90 ms before showing,
 * so instant static-page navigations never flash; on a slow connection it grows
 * toward ~85% while the next route streams, then snaps to 100% and fades.
 *
 * Uses only usePathname (no useSearchParams) so it never forces dynamic rendering.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>('idle');
  const [width, setWidth] = useState(0);
  const showTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const creepTimer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const doneTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const stopTimers = () => {
    clearTimeout(showTimer.current);
    clearInterval(creepTimer.current);
    clearTimeout(doneTimer.current);
  };

  useEffect(() => {
    function begin() {
      stopTimers();
      showTimer.current = setTimeout(() => {
        setPhase('active');
        setWidth(12);
        creepTimer.current = setInterval(() => {
          setWidth((w) => (w < 85 ? w + (85 - w) * 0.12 : w));
        }, 240);
      }, 90);
    }
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement | null)?.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || anchor.getAttribute('target') === '_blank' || anchor.hasAttribute('download')) return;
      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      begin();
    }
    document.addEventListener('click', onClick, { capture: true });
    window.addEventListener('popstate', begin);
    return () => {
      document.removeEventListener('click', onClick, { capture: true });
      window.removeEventListener('popstate', begin);
      stopTimers();
    };
  }, []);

  // Route committed → finish.
  useEffect(() => {
    stopTimers();
    setPhase((p) => {
      if (p !== 'active') return 'idle';
      return 'done';
    });
    setWidth((w) => (w === 0 ? 0 : 100));
    doneTimer.current = setTimeout(() => {
      setPhase('idle');
      setWidth(0);
    }, 300);
    return () => clearTimeout(doneTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-0.5">
      <div
        className="h-full bg-gradient-to-r from-brand-600 via-brand-400 to-brand-500 shadow-[0_0_10px] shadow-brand-400/70"
        style={{
          width: `${width}%`,
          opacity: phase === 'idle' ? 0 : 1,
          transition:
            phase === 'done'
              ? 'width 200ms ease-out, opacity 250ms ease-in 150ms'
              : 'width 300ms ease-out, opacity 150ms ease-out',
        }}
      />
    </div>
  );
}
