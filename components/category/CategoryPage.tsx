import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { CategoryConfig } from '@/types/tool';
import { getToolsByCategory } from '@/config/tools';
import { CATEGORY_LIST } from '@/config/categories';
import { Container } from '@/components/layout/Container';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { ToolGrid } from '@/components/cards/ToolGrid';
import { AdSlot } from '@/components/ads/AdSlot';
import { JsonLd } from '@/components/seo/JsonLd';
import { SectionHeading } from '@/components/ui/primitives';
import { FAQSection } from '@/components/tool/sections';
import { categoryCrumbs } from '@/lib/seo/breadcrumbs';
import { collectionPageJsonLd } from '@/lib/seo/jsonld';
import { formatDateHuman } from '@/lib/format';
import { ToolIcon } from '@/components/ui/ToolIcon';

export function CategoryPage({ category }: { category: CategoryConfig }) {
  const tools = getToolsByCategory(category.slug);
  const otherCategories = CATEGORY_LIST.filter((c) => c.slug !== category.slug);

  return (
    <>
      <JsonLd data={collectionPageJsonLd(category, tools)} />

      <section className="section-muted border-b border-ink-200 dark:border-ink-800">
        <Container className="py-8">
          <Breadcrumb items={categoryCrumbs(category.slug)} />
          <header className="mt-4 max-w-3xl">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm">
                <ToolIcon name={category.icon} className="h-6 w-6" />
              </span>
              <p className="eyebrow">{tools.length} free tools</p>
            </div>
            <h1 className="mt-4 text-3xl font-bold sm:text-4xl">{category.title}</h1>
            <p className="mt-3 text-lg text-ink-600 dark:text-ink-300">{category.tagline}</p>
            <p className="mt-2 text-xs text-ink-400">Last updated {formatDateHuman(category.updatedAt)}</p>
          </header>
        </Container>
      </section>

      <Container className="py-10">
        <div className="prose-content mb-10">
          {category.intro.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <section className="mb-14">
          <SectionHeading>All {category.name.toLowerCase()}</SectionHeading>
          <ToolGrid tools={tools} />
        </section>

        <AdSlot name="category" />

        <section className="mb-14 prose-content">
          {category.helpfulContent.map((s) => (
            <div key={s.heading}>
              <h2>{s.heading}</h2>
              {s.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              {s.bullets && (
                <ul>
                  {s.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>

        <FAQSection faq={category.faq} />

        <section className="mt-14">
          <SectionHeading>Other tool categories</SectionHeading>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {otherCategories.map((c) => (
              <Link
                key={c.slug}
                href={`/${c.slug}`}
                className="card card-hover group flex items-center gap-3 p-4 no-underline"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/60">
                  <ToolIcon name={c.icon} className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink-900 dark:text-ink-100">{c.name}</span>
                  <span className="block truncate text-xs text-ink-500 dark:text-ink-400">{c.tagline}</span>
                </span>
                <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
      </Container>
    </>
  );
}
