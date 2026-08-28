import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTool } from '@/config/tools';
import { toolMetadata } from '@/lib/seo/pageHelpers';
import { ToolPageLayout } from '@/components/tool/ToolPageLayout';
import { SplitPdfTool } from '@/components/file/widgets/SplitPdfTool';

export const dynamic = 'force-static';
export const metadata: Metadata = toolMetadata('pdf', 'split-pdf');

export default function Page() {
  const tool = getTool('pdf', 'split-pdf');
  if (!tool) notFound();
  return (
    <ToolPageLayout tool={tool}>
      <SplitPdfTool />
    </ToolPageLayout>
  );
}
