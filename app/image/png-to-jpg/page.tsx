import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTool } from '@/config/tools';
import { toolMetadata } from '@/lib/seo/pageHelpers';
import { ToolPageLayout } from '@/components/tool/ToolPageLayout';
import { ImageConverterTool } from '@/components/file/widgets/ImageConverterTool';

export const dynamic = 'force-static';
export const metadata: Metadata = toolMetadata('image', 'png-to-jpg');

export default function Page() {
  const tool = getTool('image', 'png-to-jpg');
  if (!tool) notFound();
  return (
    <ToolPageLayout tool={tool}>
      <ImageConverterTool
        config={{
          toolSlug: 'png-to-jpg',
          accept: ['png'],
          acceptAttr: 'image/png,.png',
          fixedTarget: 'image/jpeg',
          showQuality: true,
          showBackground: true,
        }}
      />
    </ToolPageLayout>
  );
}
