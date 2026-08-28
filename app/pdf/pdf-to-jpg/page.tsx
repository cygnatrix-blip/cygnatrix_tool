import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTool } from '@/config/tools';
import { toolMetadata } from '@/lib/seo/pageHelpers';
import { ToolPageLayout } from '@/components/tool/ToolPageLayout';
import { PdfToJpgTool } from '@/components/file/widgets/PdfToJpgTool';

export const dynamic = 'force-static';
export const metadata: Metadata = toolMetadata('pdf', 'pdf-to-jpg');

export default function Page() {
  const tool = getTool('pdf', 'pdf-to-jpg');
  if (!tool) notFound();
  return (
    <ToolPageLayout tool={tool}>
      <PdfToJpgTool />
    </ToolPageLayout>
  );
}
