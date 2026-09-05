import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTool } from '@/config/tools';
import { toolMetadata } from '@/lib/seo/pageHelpers';
import { ToolPageLayout } from '@/components/tool/ToolPageLayout';
import { CapitalGainsCalculator } from '@/components/calculator/widgets/CapitalGainsCalculator';

export const dynamic = 'force-static';
export const metadata: Metadata = toolMetadata('finance', 'capital-gains-calculator');

export default function Page() {
  const tool = getTool('finance', 'capital-gains-calculator');
  if (!tool) notFound();
  return (
    <ToolPageLayout tool={tool}>
      <CapitalGainsCalculator />
    </ToolPageLayout>
  );
}
