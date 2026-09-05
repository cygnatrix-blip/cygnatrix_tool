import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTool } from '@/config/tools';
import { toolMetadata } from '@/lib/seo/pageHelpers';
import { ToolPageLayout } from '@/components/tool/ToolPageLayout';
import { PassportPhotoTool } from '@/components/file/widgets/PassportPhotoTool';

export const dynamic = 'force-static';
export const metadata: Metadata = toolMetadata('image', 'passport-photo');

export default function Page() {
  const tool = getTool('image', 'passport-photo');
  if (!tool) notFound();
  return (
    <ToolPageLayout tool={tool}>
      <PassportPhotoTool />
    </ToolPageLayout>
  );
}
