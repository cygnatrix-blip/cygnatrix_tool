import type { Metadata } from 'next';
import { LegalLayout } from '@/components/legal/LegalLayout';
import { buildMetadata } from '@/lib/seo/metadata';
import { SITE } from '@/config/site';

export const dynamic = 'force-static';
export const metadata: Metadata = buildMetadata({
  title: 'Privacy Policy',
  description:
    'How Cygnatrix Tools handles your data: files are processed in your browser and never uploaded; analytics are privacy-conscious and consent-gated.',
  path: '/privacy-policy',
});

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      path="/privacy-policy"
      description="How Cygnatrix Tools handles your data."
      updated="2026-08-27"
    >
      <p>
        This policy explains what data {SITE.name} (“we”, operated by {SITE.company.name}) collects and
        how it is used. In short: your files and calculator inputs are processed on your own device and
        never sent to us.
      </p>

      <h2>Files you process</h2>
      <p>
        All PDF and image tools run entirely in your browser. When you select a file, it is read into
        your device’s memory and processed locally. <strong>Your files are never uploaded to our
        servers, never stored and never seen by us.</strong> When you close or reload the page, the
        file is gone from memory.
      </p>

      <h2>Calculator inputs</h2>
      <p>
        Finance calculators compute results in your browser. The amounts, rates and other figures you
        enter are not transmitted to us or saved anywhere.
      </p>

      <h2>Analytics</h2>
      <p>
        With your consent, we collect privacy-conscious usage analytics to understand which tools are
        useful and where they fail. We record events such as “tool viewed”, “calculation completed” or
        “file downloaded”, along with coarse information like tool name, device type, approximate
        country and referring site.
      </p>
      <p>We do <strong>not</strong> collect:</p>
      <ul>
        <li>Your name, email or any account information (there are no accounts).</li>
        <li>The contents of your files or the values you enter into calculators.</li>
        <li>Your full IP address — it is truncated and one-way hashed with a daily-rotating salt before any storage, so it cannot be reversed or linked across days.</li>
        <li>Cross-site tracking identifiers.</li>
      </ul>
      <p>
        If you enable analytics cookies, we also load Google Analytics 4 with IP anonymisation. You can
        withdraw consent at any time using the cookie controls; see our{' '}
        <a href="/cookie-policy">Cookie Policy</a>.
      </p>

      <h2>Advertising</h2>
      <p>
        With your consent, we display ads from Google AdSense to keep the tools free. Google may use
        cookies to serve and measure ads. You can decline advertising cookies and still use every
        tool. Manage your Google ad settings at{' '}
        <a href="https://adssettings.google.com" rel="nofollow noopener" target="_blank">
          adssettings.google.com
        </a>
        .
      </p>

      <h2>Contact form</h2>
      <p>
        If you use the <a href="/contact">contact form</a>, we store your name, email, subject and
        message so we can reply. We keep these messages only as long as needed to handle your enquiry
        and do not use them for marketing.
      </p>

      <h2>Cookies and local storage</h2>
      <p>
        We use a small amount of browser local storage to remember your cookie choices and interface
        preferences. These stay on your device. See the <a href="/cookie-policy">Cookie Policy</a> for
        details.
      </p>

      <h2>Your rights</h2>
      <p>
        Because we hold almost no personal data, there is usually nothing to access or delete. If you
        have contacted us and want your message removed, email{' '}
        <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a> and we will delete it.
      </p>

      <h2>Changes</h2>
      <p>
        We may update this policy as the platform evolves. The “last updated” date above always
        reflects the current version.
      </p>
    </LegalLayout>
  );
}
