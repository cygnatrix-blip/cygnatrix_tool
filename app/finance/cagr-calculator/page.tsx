import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTool } from '@/config/tools';
import { toolMetadata } from '@/lib/seo/pageHelpers';
import { ToolPageLayout } from '@/components/tool/ToolPageLayout';
import { CagrCalculator } from '@/components/calculator/widgets/CagrCalculator';

export const dynamic = 'force-static';
export const metadata: Metadata = toolMetadata('finance', 'cagr-calculator');

export default function Page() {
  const tool = getTool('finance', 'cagr-calculator');
  if (!tool) notFound();
  return (
    <ToolPageLayout tool={tool}>
      <CagrCalculator />
    </ToolPageLayout>
  );
}
