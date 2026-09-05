import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTool } from '@/config/tools';
import { toolMetadata } from '@/lib/seo/pageHelpers';
import { ToolPageLayout } from '@/components/tool/ToolPageLayout';
import { ExamPhotoTool } from '@/components/file/widgets/ExamPhotoTool';

export const dynamic = 'force-static';
export const metadata: Metadata = toolMetadata('image', 'exam-photo-signature');

export default function Page() {
  const tool = getTool('image', 'exam-photo-signature');
  if (!tool) notFound();
  return (
    <ToolPageLayout tool={tool}>
      <ExamPhotoTool />
    </ToolPageLayout>
  );
}
