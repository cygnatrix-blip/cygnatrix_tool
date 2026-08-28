import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTool } from '@/config/tools';
import { toolMetadata } from '@/lib/seo/pageHelpers';
import { ToolPageLayout } from '@/components/tool/ToolPageLayout';
import { MergePdfTool } from '@/components/file/widgets/MergePdfTool';

export const dynamic = 'force-static';
export const metadata: Metadata = toolMetadata('pdf', 'merge-pdf');

export default function Page() {
  const tool = getTool('pdf', 'merge-pdf');
  if (!tool) notFound();
  return (
    <ToolPageLayout tool={tool}>
      <MergePdfTool />
    </ToolPageLayout>
  );
}
