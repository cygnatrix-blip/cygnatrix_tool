import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTool } from '@/config/tools';
import { toolMetadata } from '@/lib/seo/pageHelpers';
import { ToolPageLayout } from '@/components/tool/ToolPageLayout';
import { ImageConverterTool } from '@/components/file/widgets/ImageConverterTool';

export const dynamic = 'force-static';
export const metadata: Metadata = toolMetadata('image', 'jpg-to-png');

export default function Page() {
  const tool = getTool('image', 'jpg-to-png');
  if (!tool) notFound();
  return (
    <ToolPageLayout tool={tool}>
      <ImageConverterTool
        config={{
          toolSlug: 'jpg-to-png',
          accept: ['jpeg'],
          acceptAttr: 'image/jpeg,.jpg,.jpeg',
          fixedTarget: 'image/png',
          showQuality: false,
          showBackground: false,
        }}
      />
    </ToolPageLayout>
  );
}
