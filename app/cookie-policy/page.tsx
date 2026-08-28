import type { Metadata } from 'next';
import { LegalLayout } from '@/components/legal/LegalLayout';
import { buildMetadata } from '@/lib/seo/metadata';

export const dynamic = 'force-static';
export const metadata: Metadata = buildMetadata({
  title: 'Cookie Policy',
  description:
    'The cookies and local storage Cygnatrix Tools uses: essential preferences, optional analytics and optional advertising — all under your control.',
  path: '/cookie-policy',
});

export default function CookiePolicyPage() {
  return (
    <LegalLayout title="Cookie Policy" path="/cookie-policy" description="Cookies and local storage used by Cygnatrix Tools." updated="2026-08-27">
      <p>
        This page explains the cookies and similar technologies (such as browser local storage) used by
        Cygnatrix Tools, and how you control them.
      </p>

      <h2>Essential</h2>
      <p>
        We store your cookie choices and a few interface preferences in your browser’s local storage.
        These are required for the site to remember your decision and cannot be disabled, but they stay
        on your device and are never sent to us.
      </p>

      <h2>Analytics (optional)</h2>
      <p>
        If you accept analytics cookies, we load Google Analytics 4 (with IP anonymisation) and send
        privacy-conscious usage events to our own server. This helps us see which tools are useful and
        which are failing. No file contents or calculator values are ever included.
      </p>

      <h2>Advertising (optional)</h2>
      <p>
        If you accept advertising cookies, we load Google AdSense, which may set cookies to serve and
        measure ads. Declining these does not affect your ability to use any tool.
      </p>

      <h2>Managing your choices</h2>
      <p>
        When you first visit, you can accept all cookies or reject the non-essential ones. To change
        your choice later, clear this site’s data in your browser and reload — the consent banner will
        appear again. You can also manage Google’s advertising cookies at{' '}
        <a href="https://adssettings.google.com" rel="nofollow noopener" target="_blank">
          adssettings.google.com
        </a>
        .
      </p>
    </LegalLayout>
  );
}
