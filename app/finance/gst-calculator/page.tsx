import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTool } from '@/config/tools';
import { toolMetadata } from '@/lib/seo/pageHelpers';
import { ToolPageLayout } from '@/components/tool/ToolPageLayout';
import { GstCalculator } from '@/components/calculator/widgets/GstCalculator';

export const dynamic = 'force-static';
export const metadata: Metadata = toolMetadata('finance', 'gst-calculator');

export default function Page() {
  const tool = getTool('finance', 'gst-calculator');
  if (!tool) notFound();
  return (
    <ToolPageLayout tool={tool}>
      <GstCalculator />
    </ToolPageLayout>
  );
}
