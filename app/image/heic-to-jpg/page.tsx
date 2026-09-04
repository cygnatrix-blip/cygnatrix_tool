import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTool } from '@/config/tools';
import { toolMetadata } from '@/lib/seo/pageHelpers';
import { ToolPageLayout } from '@/components/tool/ToolPageLayout';
import { HeicToJpgTool } from '@/components/file/widgets/HeicToJpgTool';

export const dynamic = 'force-static';
export const metadata: Metadata = toolMetadata('image', 'heic-to-jpg');

export default function Page() {
  const tool = getTool('image', 'heic-to-jpg');
  if (!tool) notFound();
  return (
    <ToolPageLayout tool={tool}>
      <HeicToJpgTool />
    </ToolPageLayout>
  );
}
