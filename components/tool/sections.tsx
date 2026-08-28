import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import type { ToolConfig } from '@/types/tool';
import { getRelatedTools } from '@/config/tools';
import { CATEGORIES } from '@/config/categories';
import { formatDateHuman } from '@/lib/format';
import { ToolIcon } from '@/components/ui/ToolIcon';
import { Card, SectionHeading } from '@/components/ui/primitives';
import { faqJsonLd } from '@/lib/seo/jsonld';
import { JsonLd } from '@/components/seo/JsonLd';

export function ToolHeader({ tool }: { tool: ToolConfig }) {
  return (
    <div className="mb-6">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
        <ToolIcon name={tool.icon} className="h-3.5 w-3.5" />
        {CATEGORIES[tool.category].name}
      </div>
      <h1 className="text-3xl font-bold sm:text-4xl">{tool.name}</h1>
      <p className="mt-3 max-w-2xl text-lg text-ink-600 dark:text-ink-300">{tool.description}</p>
      <p className="mt-2 text-xs text-ink-400">Last updated {formatDateHuman(tool.updatedAt)}</p>
    </div>
  );
}

export function HowItWorks({ steps }: { steps: ToolConfig['content']['howItWorks'] }) {
  return (
    <section className="mt-12">
      <SectionHeading>How it works</SectionHeading>
      <ol className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {steps.map((step, i) => (
          <li key={step.title} className="card p-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
              {i + 1}
            </span>
            <h3 className="mt-3 text-base font-semibold">{step.title}</h3>
            <p className="mt-1 text-sm leading-6 text-ink-600 dark:text-ink-300">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function FeatureList({ features }: { features: string[] }) {
  return (
    <section className="mt-12">
      <SectionHeading>Features</SectionHeading>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-ink-700 dark:text-ink-300">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
            {f}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ContentSections({ sections }: { sections?: ToolConfig['content']['sections'] }) {
  if (!sections?.length) return null;
  return (
    <section className="mt-12 prose-content">
      {sections.map((s) => (
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
  );
}

export function FormulaSection({ formula }: { formula?: ToolConfig['content']['formula'] }) {
  if (!formula) return null;
  return (
    <section className="mt-12">
      <SectionHeading>Formula</SectionHeading>
      <Card className="bg-ink-50/60 dark:bg-ink-900">
        <p className="rounded-lg bg-white px-4 py-3 font-mono text-sm text-ink-900 shadow-sm dark:bg-ink-950 dark:text-ink-100">
          {formula.expression}
        </p>
        <dl className="mt-4 space-y-1.5 text-sm">
          {formula.where.map((w) => (
            <div key={w.sym} className="flex gap-2">
              <dt className="font-mono font-semibold text-brand-700 dark:text-brand-400">{w.sym}</dt>
              <dd className="text-ink-600 dark:text-ink-300">— {w.meaning}</dd>
            </div>
          ))}
        </dl>
        {formula.notes?.map((n) => (
          <p key={n} className="mt-3 text-sm text-ink-500 dark:text-ink-400">
            {n}
          </p>
        ))}
      </Card>
    </section>
  );
}

export function ExampleSection({ example }: { example?: ToolConfig['content']['example'] }) {
  if (!example) return null;
  return (
    <section className="mt-12">
      <SectionHeading>Worked example</SectionHeading>
      <Card>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-400">Inputs</h3>
            <dl className="mt-2 space-y-1 text-sm">
              {example.inputs.map((row) => (
                <div key={row.label} className="flex justify-between gap-4">
                  <dt className="text-ink-500 dark:text-ink-400">{row.label}</dt>
                  <dd className="font-medium">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-400">Result</h3>
            <dl className="mt-2 space-y-1 text-sm">
              {example.result.map((row) => (
                <div key={row.label} className="flex justify-between gap-4">
                  <dt className="text-ink-500 dark:text-ink-400">{row.label}</dt>
                  <dd className="font-semibold text-brand-700 dark:text-brand-400">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
        <p className="mt-4 border-t border-ink-200 pt-4 text-sm leading-6 text-ink-600 dark:border-ink-800 dark:text-ink-300">
          {example.walkthrough}
        </p>
      </Card>
    </section>
  );
}

export function FAQSection({ faq, heading = 'Frequently asked questions' }: { faq: ToolConfig['faq']; heading?: string }) {
  if (!faq.length) return null;
  return (
    <section className="mt-12">
      <SectionHeading>{heading}</SectionHeading>
      <div className="divide-y divide-ink-200 overflow-hidden rounded-2xl border border-ink-200 bg-white dark:divide-ink-800 dark:border-ink-800 dark:bg-ink-900">
        {faq.map((item) => (
          <details
            key={item.q}
            className="group [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-medium text-ink-900 transition hover:bg-ink-50 dark:text-ink-100 dark:hover:bg-ink-800/50">
              {item.q}
              <span
                aria-hidden="true"
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-ink-200 text-ink-400 transition group-open:rotate-45 group-open:border-brand-300 group-open:text-brand-600 dark:border-ink-700"
              >
                +
              </span>
            </summary>
            <p className="px-5 pb-5 text-sm leading-7 text-ink-600 dark:text-ink-300">{item.a}</p>
          </details>
        ))}
      </div>
      <JsonLd data={faqJsonLd(faq)} />
    </section>
  );
}

export function RelatedTools({ tool }: { tool: ToolConfig }) {
  const related = getRelatedTools(tool, 6);
  if (!related.length) return null;
  return (
    <section className="mt-12">
      <SectionHeading>Related tools</SectionHeading>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {related.map((t) => (
          <Link
            key={t.id}
            href={t.path}
            className="card card-hover group flex items-center gap-3 p-4 no-underline"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/60">
              <ToolIcon name={t.icon} className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-ink-900 dark:text-ink-100">{t.name}</span>
              <span className="block truncate text-xs text-ink-500 dark:text-ink-400">{t.shortDescription}</span>
            </span>
            <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );
}

export function PrivacyNote({ group }: { group: 'pdf' | 'image' }) {
  const noun = group === 'pdf' ? 'PDF' : 'image';
  return (
    <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm leading-6 text-brand-900 dark:border-brand-900 dark:bg-brand-950/40 dark:text-brand-100">
      <strong className="font-semibold">Your files stay on your device.</strong> This tool processes
      your {noun} entirely in your browser. Nothing is uploaded to a server, nothing is stored, and
      the result is generated locally.
    </div>
  );
}

export function FinanceDisclaimer() {
  return (
    <section className="mt-12 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
      <h2 className="mb-1 text-sm font-semibold">Disclaimer</h2>
      <p>
        This calculator provides estimates for general information only. Results are mathematical
        calculations based on the figures you enter and standard formulas. Actual bank, loan, deposit
        and investment products may differ due to fees, rounding conventions, day-count methods and
        changing rates and rules. Projected investment returns are not guaranteed and you may get back
        less than you invest. Nothing here is financial, tax or investment advice — verify the actual
        terms with the relevant institution or a qualified adviser before making a decision. See our{' '}
        <Link href="/disclaimer" className="underline">
          full disclaimer
        </Link>
        .
      </p>
    </section>
  );
}
