import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTool } from '@/config/tools';
import { toolMetadata } from '@/lib/seo/pageHelpers';
import { ToolPageLayout } from '@/components/tool/ToolPageLayout';
import { LoanPrepaymentCalculator } from '@/components/calculator/widgets/LoanPrepaymentCalculator';

export const dynamic = 'force-static';
export const metadata: Metadata = toolMetadata('finance', 'home-loan-prepayment-calculator');

export default function Page() {
  const tool = getTool('finance', 'home-loan-prepayment-calculator');
  if (!tool) notFound();
  return (
    <ToolPageLayout tool={tool}>
      <LoanPrepaymentCalculator />
    </ToolPageLayout>
  );
}
