import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTool } from '@/config/tools';
import { toolMetadata } from '@/lib/seo/pageHelpers';
import { ToolPageLayout } from '@/components/tool/ToolPageLayout';
import { RdCalculator } from '@/components/calculator/widgets/RdCalculator';

export const dynamic = 'force-static';
export const metadata: Metadata = toolMetadata('finance', 'rd-calculator');

export default function Page() {
  const tool = getTool('finance', 'rd-calculator');
  if (!tool) notFound();
  return (
    <ToolPageLayout tool={tool}>
      <RdCalculator />
    </ToolPageLayout>
  );
}
