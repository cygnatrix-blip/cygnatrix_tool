import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTool } from '@/config/tools';
import { toolMetadata } from '@/lib/seo/pageHelpers';
import { ToolPageLayout } from '@/components/tool/ToolPageLayout';
import { DocumentScannerTool } from '@/components/file/widgets/DocumentScannerTool';

export const dynamic = 'force-static';
export const metadata: Metadata = toolMetadata('pdf', 'document-scanner');

export default function Page() {
  const tool = getTool('pdf', 'document-scanner');
  if (!tool) notFound();
  return (
    <ToolPageLayout tool={tool}>
      <DocumentScannerTool />
    </ToolPageLayout>
  );
}
