import type { Metadata } from 'next';
import { LegalLayout } from '@/components/legal/LegalLayout';
import { ContactForm } from '@/components/legal/ContactForm';
import { buildMetadata } from '@/lib/seo/metadata';
import { SITE } from '@/config/site';

export const dynamic = 'force-static';
export const metadata: Metadata = buildMetadata({
  title: 'Contact Cygnatrix Tools',
  description:
    'Get in touch with the Cygnatrix Tools team — report a bug, request a new tool, or tell us about an error in a calculation.',
  path: '/contact',
});

export default function ContactPage() {
  return (
    <LegalLayout
      title="Contact us"
      path="/contact"
      description="Reach the Cygnatrix Tools team."
      updated="2026-08-27"
    >
      <p>
        Have a question, a bug report, a suggestion for a new tool, or a correction to a calculation?
        Send us a message and we will get back to you. You can also email{' '}
        <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.
      </p>
      <ContactForm />
      <p className="mt-6 text-sm text-ink-400">
        We use your email address only to reply to your message. See our{' '}
        <a href="/privacy-policy">Privacy Policy</a>.
      </p>
    </LegalLayout>
  );
}
