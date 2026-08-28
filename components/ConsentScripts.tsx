'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { ADS, ANALYTICS } from '@/config/site';
import { readConsent, type ConsentState } from '@/lib/consent';

/**
 * Loads GA4 and AdSense scripts only after the relevant consent is granted.
 * Nothing third-party loads before the user decides.
 */
export function ConsentScripts() {
  const [consent, setConsent] = useState<ConsentState | null>(null);

  useEffect(() => {
    setConsent(readConsent());
    const onChange = (e: Event) => setConsent((e as CustomEvent<ConsentState>).detail);
    window.addEventListener('cygnatrix:consent', onChange as EventListener);
    return () => window.removeEventListener('cygnatrix:consent', onChange as EventListener);
  }, []);

  if (!consent) return null;

  return (
    <>
      {ANALYTICS.enabled && consent.analytics && (
        <>
          <Script
            id="ga4-src"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${ANALYTICS.gaMeasurementId}`}
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());gtag('config','${ANALYTICS.gaMeasurementId}',{anonymize_ip:true});`}
          </Script>
        </>
      )}

      {ADS.enabled && consent.ads && (
        <Script
          id="adsense-src"
          strategy="afterInteractive"
          crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS.client}`}
        />
      )}
    </>
  );
}
