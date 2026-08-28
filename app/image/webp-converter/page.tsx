import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTool } from '@/config/tools';
import { toolMetadata } from '@/lib/seo/pageHelpers';
import { ToolPageLayout } from '@/components/tool/ToolPageLayout';
import { ImageConverterTool } from '@/components/file/widgets/ImageConverterTool';

export const dynamic = 'force-static';
export const metadata: Metadata = toolMetadata('image', 'webp-converter');

export default function Page() {
  const tool = getTool('image', 'webp-converter');
  if (!tool) notFound();
  return (
    <ToolPageLayout tool={tool}>
      <ImageConverterTool
        config={{
          toolSlug: 'webp-converter',
          accept: ['jpeg', 'png', 'webp'],
          acceptAttr: 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp',
          fixedTarget: null,
          targetChoices: [
            { value: 'image/webp', label: 'To WebP' },
            { value: 'image/jpeg', label: 'To JPG' },
            { value: 'image/png', label: 'To PNG' },
          ],
          showQuality: true,
          showBackground: true,
        }}
      />
    </ToolPageLayout>
  );
}
