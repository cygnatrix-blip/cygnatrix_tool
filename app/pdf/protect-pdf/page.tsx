import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTool } from '@/config/tools';
import { toolMetadata } from '@/lib/seo/pageHelpers';
import { ToolPageLayout } from '@/components/tool/ToolPageLayout';
import { ProtectUnlockPdfTool } from '@/components/file/widgets/ProtectUnlockPdfTool';

export const dynamic = 'force-static';
export const metadata: Metadata = toolMetadata('pdf', 'protect-pdf');

export default function Page() {
  const tool = getTool('pdf', 'protect-pdf');
  if (!tool) notFound();
  return (
    <ToolPageLayout tool={tool}>
      <ProtectUnlockPdfTool />
    </ToolPageLayout>
  );
}
