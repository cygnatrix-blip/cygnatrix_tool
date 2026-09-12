import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTool } from '@/config/tools';
import { toolMetadata } from '@/lib/seo/pageHelpers';
import { ToolPageLayout } from '@/components/tool/ToolPageLayout';
import { CropPdfTool } from '@/components/file/widgets/CropPdfTool';

export const dynamic = 'force-static';
export const metadata: Metadata = toolMetadata('pdf', 'crop-pdf');

export default function Page() {
  const tool = getTool('pdf', 'crop-pdf');
  if (!tool) notFound();
  return (
    <ToolPageLayout tool={tool}>
      <CropPdfTool />
    </ToolPageLayout>
  );
}
