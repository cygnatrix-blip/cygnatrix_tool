import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/config/site';
import { CATEGORY_LIST } from '@/config/categories';
import { ACTIVE_TOOLS } from '@/config/tools';

const LEGAL = ['/about', '/contact', '/privacy-policy', '/terms', '/cookie-policy', '/disclaimer'];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const home: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/tools`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
  ];

  const categories: MetadataRoute.Sitemap = CATEGORY_LIST.map((c) => ({
    url: `${SITE_URL}/${c.slug}`,
    lastModified: new Date(c.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  const tools: MetadataRoute.Sitemap = ACTIVE_TOOLS.map((t) => ({
    url: `${SITE_URL}${t.path}`,
    lastModified: new Date(t.updatedAt),
    changeFrequency: 'monthly',
    priority: t.featured ? 0.8 : 0.7,
  }));

  const legal: MetadataRoute.Sitemap = LEGAL.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: 'yearly',
    priority: 0.3,
  }));

  return [...home, ...categories, ...tools, ...legal];
}
