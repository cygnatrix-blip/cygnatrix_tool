import type { Metadata } from 'next';
import { LegalLayout } from '@/components/legal/LegalLayout';
import { buildMetadata } from '@/lib/seo/metadata';
import { SITE } from '@/config/site';

export const dynamic = 'force-static';
export const metadata: Metadata = buildMetadata({
  title: 'Terms of Service',
  description: 'The terms that govern your use of Cygnatrix Tools.',
  path: '/terms',
});

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" path="/terms" description="Terms governing use of Cygnatrix Tools." updated="2026-08-27">
      <p>
        By using {SITE.name} (“the Service”, operated by {SITE.company.name}) you agree to these terms.
        If you do not agree, please do not use the Service.
      </p>

      <h2>Use of the Service</h2>
      <p>
        The Service provides free online tools for file processing and calculations. You may use it for
        lawful personal and commercial purposes. You must not use it to process content you do not have
        the right to process, to attempt to disrupt or overload the Service, or to reverse-engineer it
        for the purpose of building a competing service.
      </p>

      <h2>No warranty</h2>
      <p>
        The Service is provided “as is” and “as available”, without warranties of any kind. While we
        test our tools and calculation formulas, we do not guarantee that results are error-free,
        uninterrupted or fit for a particular purpose. You are responsible for checking that any output
        meets your needs before relying on it.
      </p>

      <h2>Not professional advice</h2>
      <p>
        The finance calculators are informational tools, not financial, tax, legal or investment
        advice. See our <a href="/disclaimer">Disclaimer</a>.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, {SITE.company.name} will not be liable for any indirect,
        incidental or consequential loss, or for any loss of data, profit or goodwill, arising from
        your use of or inability to use the Service.
      </p>

      <h2>Availability and changes</h2>
      <p>
        We may add, change, suspend or remove tools and features at any time. We may also update these
        terms; continued use after a change means you accept the updated terms.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms: <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.
      </p>
    </LegalLayout>
  );
}
