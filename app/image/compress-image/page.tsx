import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTool } from '@/config/tools';
import { toolMetadata } from '@/lib/seo/pageHelpers';
import { ToolPageLayout } from '@/components/tool/ToolPageLayout';
import { ImageCompressorTool } from '@/components/file/widgets/ImageCompressorTool';

export const dynamic = 'force-static';
export const metadata: Metadata = toolMetadata('image', 'compress-image');

export default function Page() {
  const tool = getTool('image', 'compress-image');
  if (!tool) notFound();
  return (
    <ToolPageLayout tool={tool}>
      <ImageCompressorTool />
    </ToolPageLayout>
  );
}
