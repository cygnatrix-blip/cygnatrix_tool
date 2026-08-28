import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Zap, ShieldCheck, Smartphone, Sparkles, MousePointerClick, Download } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { SearchTrigger } from '@/components/layout/SearchTrigger';
import { CategoryCard } from '@/components/cards/CategoryCard';
import { ToolGrid } from '@/components/cards/ToolGrid';
import { AdSlot } from '@/components/ads/AdSlot';
import { FAQSection } from '@/components/tool/sections';
import { SectionHeading } from '@/components/ui/primitives';
import { CATEGORY_LIST } from '@/config/categories';
import { getPopularTools, ACTIVE_TOOLS } from '@/config/tools';
import { buildMetadata } from '@/lib/seo/metadata';
import { SITE } from '@/config/site';

export const dynamic = 'force-static';

export const metadata: Metadata = buildMetadata({
  title: `${SITE.name} — Free Online Tools for Everyday Tasks`,
  description: SITE.description,
  path: '/',
});

const WHY = [
  { icon: Zap, title: 'Fast', body: 'Tools load instantly and process in your browser — no upload wait, no server queue.' },
  { icon: ShieldCheck, title: 'Privacy focused', body: 'Files and calculations stay on your device. Nothing is uploaded or stored.' },
  { icon: Sparkles, title: 'Free to use', body: 'Every tool is free with no sign-up, no watermarks and no page limits.' },
  { icon: Smartphone, title: 'Mobile friendly', body: 'Designed mobile-first with large touch targets and responsive results.' },
  { icon: MousePointerClick, title: 'Easy to use', body: 'One clear job per tool, sensible defaults, and results you can actually read.' },
  { icon: Download, title: 'No installation', body: 'Works in any modern browser. Nothing to download or keep updated.' },
];

const HOW = [
  { step: 1, title: 'Pick a tool', body: 'Choose from PDF tools, finance calculators or image tools — or search.' },
  { step: 2, title: 'Add your input', body: 'Drop in a file or type your figures. Everything runs locally in your browser.' },
  { step: 3, title: 'Get your result', body: 'Download the file or read the calculation instantly. Nothing is saved.' },
];

const FAQ = [
  { q: 'Is Cygnatrix Tools really free?', a: 'Yes. Every tool is free to use with no account, no watermark and no usage cap. The site is funded by unobtrusive advertising.' },
  { q: 'Do my files get uploaded to a server?', a: 'No. PDF and image tools process your files entirely in your browser using WebAssembly and the Canvas API. Your files never leave your device.' },
  { q: 'Do I need to create an account?', a: 'No. Nothing on the site requires sign-up. You can use every tool anonymously.' },
  { q: 'Are the finance calculators accurate?', a: 'They use standard formulas and are covered by an automated test suite. Results are mathematically correct for your inputs, though real financial products can differ due to fees and rounding. They are not financial advice.' },
  { q: 'Which devices and browsers are supported?', a: 'Any modern browser from the last few years — Chrome, Edge, Firefox, Safari and their mobile versions — with JavaScript enabled.' },
  { q: 'Will more tools be added?', a: 'Yes. The platform is built to grow. New tools and whole new categories are added regularly.' },
];

export default function HomePage() {
  const popular = getPopularTools();

  return (
    <>
      <section className="relative overflow-hidden border-b border-ink-200 bg-gradient-to-b from-brand-50/80 via-white to-white dark:border-ink-800 dark:from-brand-950/30 dark:via-ink-950 dark:to-ink-950">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 [background:radial-gradient(60%_50%_at_50%_-10%,theme(colors.brand.200/35),transparent)] dark:[background:radial-gradient(60%_50%_at_50%_-10%,theme(colors.brand.800/25),transparent)]"
        />
        <Container className="relative py-16 text-center sm:py-24">
          <p className="eyebrow">Cygnatrix Tools</p>
          <h1 className="mx-auto mt-3 max-w-3xl text-4xl font-bold sm:text-5xl">
            Free Online Tools for Everyday Tasks
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-600 dark:text-ink-300">
            Fast, simple tools for PDF files, financial calculations and image processing — all
            running privately in your browser.
          </p>
          <div className="mx-auto mt-8 max-w-xl">
            <SearchTrigger variant="inline" />
          </div>
          <div className="mx-auto mt-5 flex max-w-xl flex-wrap items-center justify-center gap-2">
            {popular.slice(0, 5).map((t) => (
              <Link
                key={t.id}
                href={t.path}
                className="rounded-full border border-ink-200 bg-white/70 px-3 py-1 text-xs font-medium text-ink-600 no-underline transition hover:border-brand-300 hover:text-brand-700 dark:border-ink-700 dark:bg-ink-900/60 dark:text-ink-300"
              >
                {t.name}
              </Link>
            ))}
          </div>
          <p className="mt-6 text-sm text-ink-400">
            {ACTIVE_TOOLS.length} tools · {CATEGORY_LIST.length} categories · no sign-up · nothing uploaded
          </p>
        </Container>
      </section>

      <Container className="py-14 sm:py-16">
        <div className="mb-8 text-center">
          <p className="eyebrow">Categories</p>
          <SectionHeading className="mt-2 !mb-2">Browse by category</SectionHeading>
          <p className="mx-auto max-w-xl text-sm text-ink-500 dark:text-ink-400">
            Pick a category to see every tool in it, with descriptions, benefits and FAQs.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {CATEGORY_LIST.map((category) => (
            <CategoryCard key={category.slug} category={category} />
          ))}
        </div>
      </Container>

      <AdSlot name="landing" className="mx-auto max-w-6xl px-4" />

      <Container className="py-14 sm:py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Most used</p>
            <SectionHeading className="mt-2 !mb-0">Popular tools</SectionHeading>
          </div>
          <Link
            href="/tools"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            All tools <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <ToolGrid tools={popular} showCategory />
      </Container>

      <section className="section-muted border-y border-ink-200 dark:border-ink-800">
        <Container className="py-14 sm:py-16">
          <div className="mb-8 text-center">
            <p className="eyebrow">Why us</p>
            <SectionHeading className="mt-2 !mb-0">Built to be fast, private and free</SectionHeading>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {WHY.map(({ icon: Icon, title, body }) => (
              <div key={title} className="card p-6">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-semibold">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-ink-600 dark:text-ink-400">{body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <Container className="py-14 sm:py-16">
        <div className="mb-8 text-center">
          <p className="eyebrow">Simple</p>
          <SectionHeading className="mt-2 !mb-0">How it works</SectionHeading>
        </div>
        <ol className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {HOW.map((s) => (
            <li key={s.step} className="card p-6 text-center">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-lg font-bold text-white shadow-sm">
                {s.step}
              </span>
              <h3 className="mt-4 text-base font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm leading-6 text-ink-600 dark:text-ink-400">{s.body}</p>
            </li>
          ))}
        </ol>
      </Container>

      <Container className="pb-16">
        <FAQSection faq={FAQ} heading="Questions & answers" />
      </Container>
    </>
  );
}
