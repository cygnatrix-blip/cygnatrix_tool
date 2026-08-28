import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTool } from '@/config/tools';
import { toolMetadata } from '@/lib/seo/pageHelpers';
import { ToolPageLayout } from '@/components/tool/ToolPageLayout';
import { FdCalculator } from '@/components/calculator/widgets/FdCalculator';

export const dynamic = 'force-static';
export const metadata: Metadata = toolMetadata('finance', 'fd-calculator');

export default function Page() {
  const tool = getTool('finance', 'fd-calculator');
  if (!tool) notFound();
  return (
    <ToolPageLayout tool={tool}>
      <FdCalculator />
    </ToolPageLayout>
  );
}
