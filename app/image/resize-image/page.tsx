import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTool } from '@/config/tools';
import { toolMetadata } from '@/lib/seo/pageHelpers';
import { ToolPageLayout } from '@/components/tool/ToolPageLayout';
import { ImageResizerTool } from '@/components/file/widgets/ImageResizerTool';

export const dynamic = 'force-static';
export const metadata: Metadata = toolMetadata('image', 'resize-image');

export default function Page() {
  const tool = getTool('image', 'resize-image');
  if (!tool) notFound();
  return (
    <ToolPageLayout tool={tool}>
      <ImageResizerTool />
    </ToolPageLayout>
  );
}
