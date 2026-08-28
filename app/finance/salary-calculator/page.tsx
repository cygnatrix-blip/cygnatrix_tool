import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTool } from '@/config/tools';
import { toolMetadata } from '@/lib/seo/pageHelpers';
import { ToolPageLayout } from '@/components/tool/ToolPageLayout';
import { SalaryCalculator } from '@/components/calculator/widgets/SalaryCalculator';

export const dynamic = 'force-static';
export const metadata: Metadata = toolMetadata('finance', 'salary-calculator');

export default function Page() {
  const tool = getTool('finance', 'salary-calculator');
  if (!tool) notFound();
  return (
    <ToolPageLayout tool={tool}>
      <SalaryCalculator />
    </ToolPageLayout>
  );
}
