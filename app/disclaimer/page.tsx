import type { Metadata } from 'next';
import { LegalLayout } from '@/components/legal/LegalLayout';
import { buildMetadata } from '@/lib/seo/metadata';

export const dynamic = 'force-static';
export const metadata: Metadata = buildMetadata({
  title: 'Disclaimer',
  description:
    'Cygnatrix Tools provides calculations and file utilities for general information only. Results are estimates and not professional advice.',
  path: '/disclaimer',
});

export default function DisclaimerPage() {
  return (
    <LegalLayout title="Disclaimer" path="/disclaimer" description="Important limitations on the use of Cygnatrix Tools." updated="2026-08-27">
      <h2>General</h2>
      <p>
        The tools and content on Cygnatrix Tools are provided for general information and convenience
        only. While we work to keep them accurate and reliable, we make no representation or warranty
        about their completeness, accuracy or suitability for any particular purpose.
      </p>

      <h2>Finance calculators</h2>
      <p>
        The finance calculators perform standard mathematical calculations based on the figures you
        enter. They are <strong>not</strong> financial, investment, tax or legal advice, and they do
        not account for your individual circumstances.
      </p>
      <ul>
        <li>Results are estimates and illustrations, not offers or guarantees.</li>
        <li>Projected investment returns are hypothetical. Actual returns vary and you may get back less than you invest.</li>
        <li>Interest rates, tax rates, slabs and rules change over time and by institution, state and product.</li>
        <li>Banks and fund houses may use different rounding, day-count and fee conventions, so their figures can differ from ours.</li>
        <li>Always confirm the actual terms with the relevant institution or a qualified adviser before making a financial decision.</li>
      </ul>

      <h2>File tools</h2>
      <p>
        PDF and image tools process files in your browser. Output quality depends on the input file and
        the limits of browser-based processing — for example, compression results vary by document
        type, and PDF-to-Word conversion cannot recover formatting or read scanned text. Always check
        the output before relying on it, and keep a copy of your original.
      </p>

      <h2>No liability</h2>
      <p>
        To the fullest extent permitted by law, Cygnatrix and its operators accept no liability for any
        loss or damage arising from reliance on any tool, result or content on this site.
      </p>
    </LegalLayout>
  );
}
