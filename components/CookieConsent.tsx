'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { consentDecided, writeConsent } from '@/lib/consent';
import { Button } from '@/components/ui/Button';

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!consentDecided()) setShow(true);
  }, []);

  if (!show) return null;

  const decide = (analytics: boolean, ads: boolean) => {
    writeConsent({ analytics, ads });
    setShow(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 p-3 animate-fade-in sm:inset-x-auto sm:bottom-4 sm:left-4 sm:max-w-sm"
    >
      <div className="rounded-2xl border border-ink-200 bg-white/95 p-4 shadow-card-hover backdrop-blur-sm dark:border-ink-700 dark:bg-ink-900/95">
        <p className="text-[13px] leading-6 text-ink-600 dark:text-ink-300">
          We use essential cookies to run the site. With your consent we also use analytics and ads to
          keep the tools free.{' '}
          <Link href="/cookie-policy" className="font-medium text-brand-600 hover:underline">
            Cookie Policy
          </Link>
        </p>
        <div className="mt-3 flex gap-2">
          <Button size="sm" onClick={() => decide(true, true)} className="flex-1">
            Accept all
          </Button>
          <Button size="sm" variant="secondary" onClick={() => decide(false, false)} className="flex-1">
            Reject
          </Button>
        </div>
      </div>
    </div>
  );
}
