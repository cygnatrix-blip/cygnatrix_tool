import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTool } from '@/config/tools';
import { toolMetadata } from '@/lib/seo/pageHelpers';
import { ToolPageLayout } from '@/components/tool/ToolPageLayout';
import { OrganizePdfTool } from '@/components/file/widgets/OrganizePdfTool';

export const dynamic = 'force-static';
export const metadata: Metadata = toolMetadata('pdf', 'organize-pdf');

export default function Page() {
  const tool = getTool('pdf', 'organize-pdf');
  if (!tool) notFound();
  return (
    <ToolPageLayout tool={tool}>
      <OrganizePdfTool />
    </ToolPageLayout>
  );
}
