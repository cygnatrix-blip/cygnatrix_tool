import { ogImage, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og';
import { LANDING_PAGES, getLandingPage } from '@/config/landing-pages';
import { getToolById } from '@/config/tools';

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return LANDING_PAGES.map((p) => ({ landingSlug: p.slug }));
}

export async function generateImageMetadata({ params }: { params: Promise<{ landingSlug: string }> }) {
  const { landingSlug } = await params;
  const page = getLandingPage(landingSlug);
  return [{ id: page?.slug ?? 'notfound', alt: page?.h1 ?? 'Cygnatrix Tools' }];
}

export default async function Image({ params }: { params: Promise<{ landingSlug: string }> }) {
  const { landingSlug } = await params;
  const page = getLandingPage(landingSlug);
  if (!page) return ogImage({ eyebrow: 'CYGNATRIX TOOLS', title: 'Free Online Tools', description: '' });

  const tool = getToolById(page.targetToolId);
  return ogImage({ eyebrow: 'FREE ONLINE TOOL', title: page.h1, description: tool?.shortDescription ?? page.intro });
}
