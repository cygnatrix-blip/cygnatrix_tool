import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTool } from '@/config/tools';
import { toolMetadata } from '@/lib/seo/pageHelpers';
import { ToolPageLayout } from '@/components/tool/ToolPageLayout';
import { IdCardPvcTool } from '@/components/file/widgets/IdCardPvcTool';

export const dynamic = 'force-static';
export const metadata: Metadata = toolMetadata('pdf', 'aadhaar-ayushman-pvc');

export default function Page() {
  const tool = getTool('pdf', 'aadhaar-ayushman-pvc');
  if (!tool) notFound();
  return (
    <ToolPageLayout tool={tool}>
      <IdCardPvcTool />
    </ToolPageLayout>
  );
}
