import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { ToolConfig } from '@/types/tool';
import { CATEGORIES } from '@/config/categories';
import { ToolIcon } from '@/components/ui/ToolIcon';
import { Badge } from '@/components/ui/primitives';

export function ToolCard({ tool, showCategory = false }: { tool: ToolConfig; showCategory?: boolean }) {
  return (
    <Link
      href={tool.path}
      className="card card-hover group flex h-full flex-col gap-3 p-5 no-underline"
    >
      <div className="flex items-start justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-100 dark:bg-brand-950/60 dark:group-hover:bg-brand-900/60">
          <ToolIcon name={tool.icon} className="h-5 w-5" />
        </span>
        <span className="grid h-7 w-7 place-items-center rounded-full text-ink-300 transition group-hover:bg-brand-50 group-hover:text-brand-600 dark:group-hover:bg-brand-950/50">
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <div>
        <h3 className="text-base font-semibold text-ink-900 dark:text-ink-100">{tool.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm leading-6 text-ink-600 dark:text-ink-400">
          {tool.shortDescription}
        </p>
      </div>
      {showCategory && (
        <div className="mt-auto pt-1">
          <Badge>{CATEGORIES[tool.category].name}</Badge>
        </div>
      )}
    </Link>
  );
}
