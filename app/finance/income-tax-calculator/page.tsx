import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTool } from '@/config/tools';
import { toolMetadata } from '@/lib/seo/pageHelpers';
import { ToolPageLayout } from '@/components/tool/ToolPageLayout';
import { IncomeTaxCalculator } from '@/components/calculator/widgets/IncomeTaxCalculator';

export const dynamic = 'force-static';
export const metadata: Metadata = toolMetadata('finance', 'income-tax-calculator');

export default function Page() {
  const tool = getTool('finance', 'income-tax-calculator');
  if (!tool) notFound();
  return (
    <ToolPageLayout tool={tool}>
      <IncomeTaxCalculator />
    </ToolPageLayout>
  );
}
