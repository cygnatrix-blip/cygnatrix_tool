import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTool } from '@/config/tools';
import { toolMetadata } from '@/lib/seo/pageHelpers';
import { ToolPageLayout } from '@/components/tool/ToolPageLayout';
import { EmiCalculator } from '@/components/calculator/widgets/EmiCalculator';

export const dynamic = 'force-static';
export const metadata: Metadata = toolMetadata('finance', 'emi-calculator');

export default function Page() {
  const tool = getTool('finance', 'emi-calculator');
  if (!tool) notFound();
  return (
    <ToolPageLayout tool={tool}>
      <EmiCalculator />
    </ToolPageLayout>
  );
}
