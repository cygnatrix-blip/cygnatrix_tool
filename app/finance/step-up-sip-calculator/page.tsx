import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTool } from '@/config/tools';
import { toolMetadata } from '@/lib/seo/pageHelpers';
import { ToolPageLayout } from '@/components/tool/ToolPageLayout';
import { StepUpSipCalculator } from '@/components/calculator/widgets/StepUpSipCalculator';

export const dynamic = 'force-static';
export const metadata: Metadata = toolMetadata('finance', 'step-up-sip-calculator');

export default function Page() {
  const tool = getTool('finance', 'step-up-sip-calculator');
  if (!tool) notFound();
  return (
    <ToolPageLayout tool={tool}>
      <StepUpSipCalculator />
    </ToolPageLayout>
  );
}
