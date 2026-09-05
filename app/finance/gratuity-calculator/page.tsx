import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTool } from '@/config/tools';
import { toolMetadata } from '@/lib/seo/pageHelpers';
import { ToolPageLayout } from '@/components/tool/ToolPageLayout';
import { GratuityCalculator } from '@/components/calculator/widgets/GratuityCalculator';

export const dynamic = 'force-static';
export const metadata: Metadata = toolMetadata('finance', 'gratuity-calculator');

export default function Page() {
  const tool = getTool('finance', 'gratuity-calculator');
  if (!tool) notFound();
  return (
    <ToolPageLayout tool={tool}>
      <GratuityCalculator />
    </ToolPageLayout>
  );
}
