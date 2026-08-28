import type { CategorySlug, ToolConfig } from '@/types/tool';
import { CATEGORIES } from '@/config/categories';
import type { Crumb } from './jsonld';

export function homeCrumb(): Crumb {
  return { name: 'Home', path: '/' };
}

export function categoryCrumbs(slug: CategorySlug): Crumb[] {
  return [homeCrumb(), { name: CATEGORIES[slug].name, path: `/${slug}` }];
}

export function toolCrumbs(tool: ToolConfig): Crumb[] {
  return [...categoryCrumbs(tool.category), { name: tool.name, path: tool.path }];
}

export function pageCrumbs(name: string, path: string): Crumb[] {
  return [homeCrumb(), { name, path }];
}
