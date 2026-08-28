import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { CategoryConfig } from '@/types/tool';
import { getToolsByCategory } from '@/config/tools';
import { ToolIcon } from '@/components/ui/ToolIcon';

export function CategoryCard({ category }: { category: CategoryConfig }) {
  const tools = getToolsByCategory(category.slug);
  const examples = tools.slice(0, 3).map((t) => t.name).join(' · ');
  return (
    <Link
      href={`/${category.slug}`}
      className="card card-hover group flex h-full flex-col p-6 no-underline"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm">
        <ToolIcon name={category.icon} className="h-6 w-6" />
      </span>
      <h3 className="mt-4 text-lg font-semibold text-ink-900 dark:text-ink-100">{category.name}</h3>
      <p className="mt-1 text-sm leading-6 text-ink-600 dark:text-ink-400">{category.tagline}</p>
      <p className="mt-3 text-xs leading-5 text-ink-400">{examples} &amp; more</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 dark:text-brand-400">
        Explore {tools.length} tools
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
      </span>
    </Link>
  );
}
