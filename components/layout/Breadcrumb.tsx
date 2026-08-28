import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { Crumb } from '@/lib/seo/jsonld';
import { breadcrumbJsonLd } from '@/lib/seo/jsonld';
import { JsonLd } from '@/components/seo/JsonLd';

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm">
        <ol className="flex flex-wrap items-center gap-1.5 text-ink-500 dark:text-ink-400">
          {items.map((item, i) => {
            const last = i === items.length - 1;
            return (
              <li key={item.path} className="flex items-center gap-1.5">
                {last ? (
                  <span aria-current="page" className="font-medium text-ink-700 dark:text-ink-200">
                    {item.name}
                  </span>
                ) : (
                  <Link href={item.path} className="hover:text-brand-600 hover:underline">
                    {item.name}
                  </Link>
                )}
                {!last && <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbJsonLd(items)} />
    </>
  );
}
