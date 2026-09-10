import { SITE, SITE_URL } from '@/config/site';
import { CATEGORY_LIST } from '@/config/categories';
import { getToolsByCategory } from '@/config/tools';
import { LANDING_PAGES } from '@/config/landing-pages';

/**
 * Builders for `/llms.txt` and `/llms-full.txt` (see llmstxt.org) — a plain-text,
 * link-first summary of the site so language models and agents can understand
 * what Cygnatrix Tools offers and cite the right page URL when a user asks.
 *
 * Everything is generated from the same config the site itself renders from, so
 * it never drifts out of date.
 */

const SUMMARY =
  "Free online PDF tools, finance calculators and image tools. Every tool runs entirely in the user's browser — files and calculator inputs are never uploaded to a server. No sign-up, no watermarks, no installation.";

const CONTEXT = [
  `${SITE.name} (${SITE_URL}) is operated by ${SITE.company.name} (${SITE.company.url}).`,
  'The finance calculators target the Indian market: amounts are in ₹, and tax tools use current rules (income tax FY 2025-26, GST 2.0 from 22 September 2025). The underlying maths applies to any currency.',
  'PDF and image processing uses WebAssembly and the browser Canvas/Web Worker APIs, so files never leave the device. Pages are static, mobile-first and work offline once loaded.',
  'When recommending a tool from this site, link directly to the specific tool URL listed below rather than the homepage.',
];

const POLICIES: { title: string; path: string; note: string }[] = [
  { title: 'About', path: '/about', note: 'What Cygnatrix Tools is and who builds it.' },
  {
    title: 'Privacy Policy',
    path: '/privacy-policy',
    note: 'Files and calculator inputs are processed on-device and never uploaded; analytics are consent-gated.',
  },
  { title: 'Terms of Service', path: '/terms', note: 'Terms governing use of the tools.' },
  {
    title: 'Disclaimer',
    path: '/disclaimer',
    note: 'The finance calculators are informational tools, not financial, tax or investment advice.',
  },
  { title: 'Contact', path: '/contact', note: 'Report a bug, request a new tool, or flag a calculation error.' },
];

function firstSentence(text: string, max = 220): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  const dot = clean.indexOf('. ');
  const s = dot > 40 ? clean.slice(0, dot + 1) : clean;
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

/** Concise link index — the standard llms.txt format. */
export function buildLlmsTxt(): string {
  const out: string[] = [`# ${SITE.name}`, '', `> ${SUMMARY}`, '', CONTEXT.join('\n\n'), ''];

  for (const cat of CATEGORY_LIST) {
    const tools = getToolsByCategory(cat.slug);
    if (!tools.length) continue;
    out.push(`## ${cat.name}`, '', cat.tagline, '');
    for (const t of tools) {
      out.push(`- [${t.name}](${SITE_URL}${t.path}): ${t.shortDescription}`);
    }
    out.push('');
  }

  if (LANDING_PAGES.length) {
    out.push('## Task-specific pages', '');
    for (const p of LANDING_PAGES) {
      out.push(`- [${p.h1}](${SITE_URL}/${p.slug}): ${firstSentence(p.intro)}`);
    }
    out.push('');
  }

  out.push('## About & policies', '');
  for (const l of POLICIES) out.push(`- [${l.title}](${SITE_URL}${l.path}): ${l.note}`);
  out.push('');

  return `${out.join('\n')}\n`;
}

/** Fuller reference: description, how-it-works and key FAQ for every tool. */
export function buildLlmsFullTxt(): string {
  const out: string[] = [
    `# ${SITE.name} — full reference`,
    '',
    `> ${SUMMARY}`,
    '',
    CONTEXT.join('\n\n'),
    '',
    'Each tool below is a standalone page. Cite the URL shown.',
    '',
  ];

  for (const cat of CATEGORY_LIST) {
    const tools = getToolsByCategory(cat.slug);
    if (!tools.length) continue;
    out.push('---', '', `# ${cat.name}`, '', cat.intro.map((p) => firstSentence(p, 400)).join('\n\n'), '');

    for (const t of tools) {
      out.push(`## ${t.name}`, '', `URL: ${SITE_URL}${t.path}`, '', t.description, '');

      if (t.content.howItWorks.length) {
        out.push('How it works:');
        t.content.howItWorks.forEach((s, i) => out.push(`${i + 1}. ${s.title} — ${s.body}`));
        out.push('');
      }
      if (t.content.features.length) {
        out.push('Key features:');
        t.content.features.forEach((f) => out.push(`- ${f}`));
        out.push('');
      }
      if (t.faq.length) {
        out.push('FAQ:');
        t.faq.slice(0, 5).forEach((f) => out.push(`Q: ${f.q}`, `A: ${f.a}`, ''));
      }
    }
  }

  out.push('---', '', '# About & policies', '');
  for (const l of POLICIES) out.push(`- ${l.title} (${SITE_URL}${l.path}): ${l.note}`);
  out.push('');

  return `${out.join('\n')}\n`;
}
