import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTool } from '@/config/tools';
import { toolMetadata } from '@/lib/seo/pageHelpers';
import { ToolPageLayout } from '@/components/tool/ToolPageLayout';
import { SwpCalculator } from '@/components/calculator/widgets/SwpCalculator';

export const dynamic = 'force-static';
export const metadata: Metadata = toolMetadata('finance', 'swp-calculator');

export default function Page() {
  const tool = getTool('finance', 'swp-calculator');
  if (!tool) notFound();
  return (
    <ToolPageLayout tool={tool}>
      <SwpCalculator />
    </ToolPageLayout>
  );
}
