import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTool } from '@/config/tools';
import { toolMetadata } from '@/lib/seo/pageHelpers';
import { ToolPageLayout } from '@/components/tool/ToolPageLayout';
import { ImageToPdfTool } from '@/components/file/widgets/ImageToPdfTool';

export const dynamic = 'force-static';
export const metadata: Metadata = toolMetadata('pdf', 'image-to-pdf');

export default function Page() {
  const tool = getTool('pdf', 'image-to-pdf');
  if (!tool) notFound();
  return (
    <ToolPageLayout tool={tool}>
      <ImageToPdfTool />
    </ToolPageLayout>
  );
}
