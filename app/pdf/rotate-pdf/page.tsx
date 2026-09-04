import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTool } from '@/config/tools';
import { toolMetadata } from '@/lib/seo/pageHelpers';
import { ToolPageLayout } from '@/components/tool/ToolPageLayout';
import { RotatePdfTool } from '@/components/file/widgets/RotatePdfTool';

export const dynamic = 'force-static';
export const metadata: Metadata = toolMetadata('pdf', 'rotate-pdf');

export default function Page() {
  const tool = getTool('pdf', 'rotate-pdf');
  if (!tool) notFound();
  return (
    <ToolPageLayout tool={tool}>
      <RotatePdfTool />
    </ToolPageLayout>
  );
}
