import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { LandingPageConfig, ToolConfig } from '@/types/tool';
import { Container } from '@/components/layout/Container';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { AdSlot } from '@/components/ads/AdSlot';
import { JsonLd } from '@/components/seo/JsonLd';
import { homeCrumb } from '@/lib/seo/breadcrumbs';
import { webPageJsonLd, faqJsonLd } from '@/lib/seo/jsonld';
import { formatDateHuman } from '@/lib/format';
import { CompressToSizeTool } from '@/components/file/widgets/CompressToSizeTool';
import { HowItWorks, ContentSections, FAQSection, PrivacyNote } from './sections';

/**
 * One dynamic route (app/[landingSlug]/page.tsx) renders every intent
 * landing page through this layout — the config decides the copy and which
 * existing tool widget appears, so adding a page never means copy-pasting one.
 */
function renderWidget(page: LandingPageConfig) {
  switch (page.targetToolId) {
    case 'compress-to-size':
      return <CompressToSizeTool initialTargetKB={page.targetSizeKB} />;
    default:
      return null;
  }
}

export function LandingPageLayout({ page, tool }: { page: LandingPageConfig; tool: ToolConfig }) {
  return (
    <Container className="py-8">
      <JsonLd data={webPageJsonLd(page.h1, `/${page.slug}`, page.seoDescription)} />
      <JsonLd data={faqJsonLd(page.faq)} />
      <Breadcrumb items={[homeCrumb(), { name: page.h1, path: `/${page.slug}` }]} />

      <div className="min-w-0">
        <div className="mb-6">
          <h1 className="text-3xl font-bold sm:text-4xl">{page.h1}</h1>
          <p className="mt-3 max-w-2xl text-lg text-ink-600 dark:text-ink-300">{page.intro}</p>
          <p className="mt-2 text-xs text-ink-400">Last updated {formatDateHuman(page.updatedAt)}</p>
        </div>

        <PrivacyNote group={tool.category as 'pdf' | 'image'} />

        <div className="mt-6">{renderWidget(page)}</div>

        <AdSlot name="toolResult" />

        <HowItWorks steps={page.howItWorks} />
        <ContentSections sections={page.sections} />

        <AdSlot name="content" />

        <FAQSection faq={page.faq} />

        <section className="mt-12">
          <Link
            href={tool.path}
            className="card card-hover group flex items-center justify-between gap-3 p-4 no-underline"
          >
            <span>
              <span className="block text-sm font-semibold text-ink-900 dark:text-ink-100">
                Need a different size or more options?
              </span>
              <span className="block text-xs text-ink-500 dark:text-ink-400">
                Open the full {tool.name} tool with all quick-pick sizes and a custom target.
              </span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500" aria-hidden="true" />
          </Link>
        </section>
      </div>
    </Container>
  );
}
