import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalLayout } from '@/components/legal/LegalLayout';
import { buildMetadata } from '@/lib/seo/metadata';
import { SITE } from '@/config/site';

export const dynamic = 'force-static';
export const metadata: Metadata = buildMetadata({
  title: 'About Cygnatrix Tools',
  description:
    'Cygnatrix Tools is a growing collection of fast, free, privacy-focused online tools — PDF utilities, finance calculators and image tools that run in your browser.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <LegalLayout
      title="About Cygnatrix Tools"
      path="/about"
      description="What Cygnatrix Tools is and how it works."
      updated="2026-08-27"
    >
      <p>
        <strong>{SITE.name}</strong> is a collection of free online tools for everyday tasks — working
        with PDF files, running financial calculations and processing images. It is built and operated
        by {SITE.company.name}.
      </p>

      <h2>Our approach</h2>
      <p>
        Most online tools work by uploading your file to a server. We think that is the wrong default
        for documents and photos that often contain personal information. Wherever it is technically
        possible, our tools process your files <strong>entirely inside your browser</strong>. Your
        data never reaches our servers, so there is nothing for us to store, leak or misuse.
      </p>
      <p>
        Our finance calculators work the same way — every calculation happens locally, and the figures
        you enter are never transmitted anywhere.
      </p>

      <h2>What we value</h2>
      <ul>
        <li><strong>Speed</strong> — tools should load fast and respond instantly.</li>
        <li><strong>Simplicity</strong> — one clear job per tool, no clutter.</li>
        <li><strong>Privacy</strong> — local processing by default.</li>
        <li><strong>Honesty</strong> — we tell you what a tool can and cannot do.</li>
        <li><strong>Accessibility</strong> — usable with a keyboard, a screen reader and on a small screen.</li>
      </ul>

      <h2>How it is funded</h2>
      <p>
        Cygnatrix Tools is free. It is supported by unobtrusive advertising, clearly labelled and kept
        away from the tool controls. We may add optional paid features in the future, but the core
        tools will remain free to use.
      </p>

      <h2>Get in touch</h2>
      <p>
        Found a bug, have a request for a new tool, or spotted an error in a calculation? We would like
        to hear from you — please <Link href="/contact">contact us</Link>.
      </p>
    </LegalLayout>
  );
}
