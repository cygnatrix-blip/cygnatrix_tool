import { Container } from '@/components/layout/Container';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { JsonLd } from '@/components/seo/JsonLd';
import { webPageJsonLd } from '@/lib/seo/jsonld';
import { pageCrumbs } from '@/lib/seo/breadcrumbs';
import { formatDateHuman } from '@/lib/format';

export function LegalLayout({
  title,
  path,
  description,
  updated,
  children,
}: {
  title: string;
  path: string;
  description: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <Container className="py-8">
      <JsonLd data={webPageJsonLd(title, path, description)} />
      <Breadcrumb items={pageCrumbs(title, path)} />
      <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
      <p className="mt-2 text-xs text-ink-400">Last updated {formatDateHuman(updated)}</p>
      <div className="prose-content mt-6">{children}</div>
    </Container>
  );
}
