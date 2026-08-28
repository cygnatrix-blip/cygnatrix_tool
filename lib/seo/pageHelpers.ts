import type { Metadata } from 'next';
import type { CategorySlug } from '@/types/tool';
import { getTool } from '@/config/tools';
import { getCategory } from '@/config/categories';
import { buildMetadata } from './metadata';

export function toolMetadata(category: CategorySlug, slug: string): Metadata {
  const tool = getTool(category, slug);
  if (!tool) return { title: 'Tool not found' };
  return buildMetadata({
    title: tool.seoTitle,
    description: tool.seoDescription,
    path: tool.path,
    keywords: tool.keywords,
    ogType: 'article',
    updatedAt: tool.updatedAt,
  });
}

export function categoryMetadata(slug: CategorySlug): Metadata {
  const category = getCategory(slug);
  if (!category) return { title: 'Category not found' };
  return buildMetadata({
    title: category.seoTitle,
    description: category.seoDescription,
    path: `/${slug}`,
    keywords: category.keywords,
    updatedAt: category.updatedAt,
  });
}
