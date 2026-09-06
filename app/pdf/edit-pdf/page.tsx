import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTool } from '@/config/tools';
import { toolMetadata } from '@/lib/seo/pageHelpers';
import { ToolPageLayout } from '@/components/tool/ToolPageLayout';
import { PdfEditorTool } from '@/components/file/widgets/PdfEditorTool';

export const dynamic = 'force-static';
export const metadata: Metadata = toolMetadata('pdf', 'edit-pdf');

export default function Page() {
  const tool = getTool('pdf', 'edit-pdf');
  if (!tool) notFound();
  return (
    <ToolPageLayout tool={tool}>
      <PdfEditorTool />
    </ToolPageLayout>
  );
}
