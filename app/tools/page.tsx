import type { Metadata } from 'next';
import { Container } from '@/components/layout/Container';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { ToolGrid } from '@/components/cards/ToolGrid';
import { SectionHeading } from '@/components/ui/primitives';
import { CATEGORY_LIST } from '@/config/categories';
import { ACTIVE_TOOLS, getToolsByCategory } from '@/config/tools';
import { buildMetadata } from '@/lib/seo/metadata';
import { pageCrumbs } from '@/lib/seo/breadcrumbs';

export const dynamic = 'force-static';

export const metadata: Metadata = buildMetadata({
  title: 'All Tools — A–Z Index',
  description: `The complete list of ${ACTIVE_TOOLS.length} free Cygnatrix Tools: ${getToolsByCategory('pdf').length} PDF tools, ${getToolsByCategory('finance').length} finance calculators and ${getToolsByCategory('image').length} image tools, grouped by category. All browser-based, all free, no sign-up.`,
  path: '/tools',
});

export default function AllToolsPage() {
  return (
    <Container className="py-8">
      <Breadcrumb items={pageCrumbs('All Tools', '/tools')} />
      <h1 className="text-3xl font-bold sm:text-4xl">All Tools</h1>
      <p className="mt-3 max-w-2xl text-lg text-ink-600 dark:text-ink-300">
        Every tool on Cygnatrix Tools, grouped by category. Each one runs in your browser — free, no
        sign-up.
      </p>

      {CATEGORY_LIST.map((category) => (
        <section key={category.slug} className="mt-12">
          <SectionHeading>{category.name}</SectionHeading>
          <ToolGrid tools={getToolsByCategory(category.slug)} />
        </section>
      ))}
    </Container>
  );
}
