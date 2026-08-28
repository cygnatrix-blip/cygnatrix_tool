'use client';

import { useEffect, useRef, useState } from 'react';
import { ADS, type AdSlotName } from '@/config/site';
import { hasConsent } from '@/lib/consent';
import { cn } from '@/lib/cn';

interface AdSlotProps {
  name: AdSlotName;
  /** Layout hint passed to AdSense. */
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal';
  className?: string;
}

/**
 * The single ad component. Renders:
 *  - nothing, if AdSense is not configured and placeholders are off;
 *  - a labelled reserved box, if placeholders are on (useful before approval);
 *  - a real, consent-gated AdSense unit otherwise.
 *
 * Always carries a visible "Advertisement" label and reserves height so it can
 * never cause layout shift or be confused with tool controls.
 */
export function AdSlot({ name, format = 'auto', className }: AdSlotProps) {
  const slotId = ADS.slots[name];
  const ref = useRef<HTMLModElement>(null);
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    setConsented(hasConsent('ads'));
    const onChange = () => setConsented(hasConsent('ads'));
    window.addEventListener('cygnatrix:consent', onChange);
    return () => window.removeEventListener('cygnatrix:consent', onChange);
  }, []);

  useEffect(() => {
    if (!consented || !ADS.enabled || !slotId) return;
    try {
      // @ts-expect-error adsbygoogle is injected by the AdSense script
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* ignore */
    }
  }, [consented, slotId]);

  const showReal = ADS.enabled && Boolean(slotId) && consented;
  const showPlaceholder = ADS.placeholder && !showReal;

  if (!showReal && !showPlaceholder) return null;

  return (
    <aside
      className={cn('ad-reserve my-8 w-full', className)}
      aria-label="Advertisement"
    >
      <p className="mb-1 text-center text-[10px] font-medium uppercase tracking-widest text-ink-400">
        Advertisement
      </p>
      {showPlaceholder ? (
        <div className="ad-reserve flex items-center justify-center rounded-xl border border-dashed border-ink-300 text-xs text-ink-400 dark:border-ink-700">
          Ad slot: {name}
        </div>
      ) : (
        <ins
          ref={ref}
          className="adsbygoogle block"
          style={{ display: 'block' }}
          data-ad-client={ADS.client}
          data-ad-slot={slotId}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      )}
    </aside>
  );
}
