import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTool } from '@/config/tools';
import { toolMetadata } from '@/lib/seo/pageHelpers';
import { ToolPageLayout } from '@/components/tool/ToolPageLayout';
import { SipCalculator } from '@/components/calculator/widgets/SipCalculator';

export const dynamic = 'force-static';
export const metadata: Metadata = toolMetadata('finance', 'sip-calculator');

export default function Page() {
  const tool = getTool('finance', 'sip-calculator');
  if (!tool) notFound();
  return (
    <ToolPageLayout tool={tool}>
      <SipCalculator />
    </ToolPageLayout>
  );
}
