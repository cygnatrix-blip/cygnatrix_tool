import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTool } from '@/config/tools';
import { toolMetadata } from '@/lib/seo/pageHelpers';
import { ToolPageLayout } from '@/components/tool/ToolPageLayout';
import { PdfToWordTool } from '@/components/file/widgets/PdfToWordTool';

export const dynamic = 'force-static';
export const metadata: Metadata = toolMetadata('pdf', 'pdf-to-word');

export default function Page() {
  const tool = getTool('pdf', 'pdf-to-word');
  if (!tool) notFound();
  return (
    <ToolPageLayout tool={tool}>
      <PdfToWordTool />
    </ToolPageLayout>
  );
}
