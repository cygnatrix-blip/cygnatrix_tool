import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTool } from '@/config/tools';
import { toolMetadata } from '@/lib/seo/pageHelpers';
import { ToolPageLayout } from '@/components/tool/ToolPageLayout';
import { HraCalculator } from '@/components/calculator/widgets/HraCalculator';

export const dynamic = 'force-static';
export const metadata: Metadata = toolMetadata('finance', 'hra-exemption-calculator');

export default function Page() {
  const tool = getTool('finance', 'hra-exemption-calculator');
  if (!tool) notFound();
  return (
    <ToolPageLayout tool={tool}>
      <HraCalculator />
    </ToolPageLayout>
  );
}
