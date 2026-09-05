import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LANDING_PAGES, getLandingPage } from '@/config/landing-pages';
import { getToolById } from '@/config/tools';
import { buildMetadata } from '@/lib/seo/metadata';
import { LandingPageLayout } from '@/components/tool/LandingPageLayout';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return LANDING_PAGES.map((p) => ({ landingSlug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ landingSlug: string }>;
}): Promise<Metadata> {
  const { landingSlug } = await params;
  const page = getLandingPage(landingSlug);
  if (!page) return { title: 'Page not found' };
  return buildMetadata({
    title: page.seoTitle,
    description: page.seoDescription,
    path: `/${page.slug}`,
    keywords: page.keywords,
    ogType: 'article',
    updatedAt: page.updatedAt,
  });
}

export default async function Page({ params }: { params: Promise<{ landingSlug: string }> }) {
  const { landingSlug } = await params;
  const page = getLandingPage(landingSlug);
  if (!page) notFound();
  const tool = getToolById(page.targetToolId);
  if (!tool) notFound();
  return <LandingPageLayout page={page} tool={tool} />;
}
