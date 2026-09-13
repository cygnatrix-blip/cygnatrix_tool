import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTool } from '@/config/tools';
import { toolMetadata } from '@/lib/seo/pageHelpers';
import { ToolPageLayout } from '@/components/tool/ToolPageLayout';
import { IdCardPhotoTool } from '@/components/file/widgets/IdCardPhotoTool';

export const dynamic = 'force-static';
export const metadata: Metadata = toolMetadata('image', 'id-card-photo');

export default function Page() {
  const tool = getTool('image', 'id-card-photo');
  if (!tool) notFound();
  return (
    <ToolPageLayout tool={tool}>
      <IdCardPhotoTool />
    </ToolPageLayout>
  );
}
