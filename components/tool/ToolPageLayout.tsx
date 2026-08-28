import type { ToolConfig } from '@/types/tool';
import { Container } from '@/components/layout/Container';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { AdSlot } from '@/components/ads/AdSlot';
import { JsonLd } from '@/components/seo/JsonLd';
import { toolCrumbs } from '@/lib/seo/breadcrumbs';
import { softwareApplicationJsonLd } from '@/lib/seo/jsonld';
import {
  ToolHeader,
  HowItWorks,
  FeatureList,
  ContentSections,
  FormulaSection,
  ExampleSection,
  FAQSection,
  RelatedTools,
  PrivacyNote,
  FinanceDisclaimer,
} from './sections';

/**
 * The shared shell for every one of the 18 tool pages. A tool page is:
 *   <ToolPageLayout tool={config}> <TheInteractiveWidget /> </ToolPageLayout>
 *
 * Everything else — breadcrumbs, H1, SEO content, formula, example, FAQ, related
 * tools, structured data, ad slot — is rendered here from the tool's config.
 */
export function ToolPageLayout({
  tool,
  children,
}: {
  tool: ToolConfig;
  children: React.ReactNode;
}) {
  const isFinance = tool.category === 'finance';
  const isFile = tool.category === 'pdf' || tool.category === 'image';

  return (
    <Container className="py-8">
      <JsonLd data={softwareApplicationJsonLd(tool)} />
      <Breadcrumb items={toolCrumbs(tool)} />

      <div>
        <div className="min-w-0">
          <ToolHeader tool={tool} />

          {isFile && <PrivacyNote group={tool.category as 'pdf' | 'image'} />}

          {/* The interactive island. */}
          <div className="mt-6">{children}</div>

          <AdSlot name="toolResult" />

          <HowItWorks steps={tool.content.howItWorks} />
          <FormulaSection formula={tool.content.formula} />
          <ExampleSection example={tool.content.example} />
          <ContentSections sections={tool.content.sections} />

          <AdSlot name="content" />

          <FeatureList features={tool.content.features} />
          <FAQSection faq={tool.faq} />

          {isFinance && <FinanceDisclaimer />}

          <RelatedTools tool={tool} />
        </div>
      </div>
    </Container>
  );
}
