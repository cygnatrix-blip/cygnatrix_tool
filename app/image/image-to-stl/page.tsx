import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTool } from '@/config/tools';
import { toolMetadata } from '@/lib/seo/pageHelpers';
import { ToolPageLayout } from '@/components/tool/ToolPageLayout';
import { ImageToStlTool } from '@/components/file/widgets/ImageToStlTool';

export const dynamic = 'force-static';
export const metadata: Metadata = toolMetadata('image', 'image-to-stl');

export default function Page() {
  const tool = getTool('image', 'image-to-stl');
  if (!tool) notFound();
  return (
    <ToolPageLayout tool={tool}>
      <ImageToStlTool />
    </ToolPageLayout>
  );
}
