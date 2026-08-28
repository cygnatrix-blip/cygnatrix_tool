import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTool } from '@/config/tools';
import { toolMetadata } from '@/lib/seo/pageHelpers';
import { ToolPageLayout } from '@/components/tool/ToolPageLayout';
import { CompressPdfTool } from '@/components/file/widgets/CompressPdfTool';

export const dynamic = 'force-static';
export const metadata: Metadata = toolMetadata('pdf', 'compress-pdf');

export default function Page() {
  const tool = getTool('pdf', 'compress-pdf');
  if (!tool) notFound();
  return (
    <ToolPageLayout tool={tool}>
      <CompressPdfTool />
    </ToolPageLayout>
  );
}
