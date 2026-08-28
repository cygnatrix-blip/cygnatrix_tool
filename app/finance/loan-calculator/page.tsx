import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTool } from '@/config/tools';
import { toolMetadata } from '@/lib/seo/pageHelpers';
import { ToolPageLayout } from '@/components/tool/ToolPageLayout';
import { LoanCalculator } from '@/components/calculator/widgets/LoanCalculator';

export const dynamic = 'force-static';
export const metadata: Metadata = toolMetadata('finance', 'loan-calculator');

export default function Page() {
  const tool = getTool('finance', 'loan-calculator');
  if (!tool) notFound();
  return (
    <ToolPageLayout tool={tool}>
      <LoanCalculator />
    </ToolPageLayout>
  );
}
