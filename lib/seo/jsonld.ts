import type { CategoryConfig, ToolConfig } from '@/types/tool';
import { SITE, SITE_URL } from '@/config/site';
import { absoluteUrl } from './metadata';

type Json = Record<string, unknown>;

export function organizationJsonLd(): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE.name,
    url: SITE_URL,
    logo: absoluteUrl('/brand/logo-mark.svg'),
    parentOrganization: { '@type': 'Organization', name: SITE.company.name, url: SITE.company.url },
    sameAs: [SITE.company.url],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: SITE.contactEmail,
      url: absoluteUrl('/contact'),
    },
  };
}

export function websiteJsonLd(): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    url: SITE_URL,
    description: SITE.description,
    publisher: { '@type': 'Organization', name: SITE.name },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/tools?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

export interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbJsonLd(crumbs: Crumb[]): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  };
}

export function faqJsonLd(faq: { q: string; a: string }[]): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function softwareApplicationJsonLd(tool: ToolConfig): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    url: absoluteUrl(tool.path),
    description: tool.seoDescription,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any (web browser)',
    browserRequirements: 'Requires JavaScript. Runs in any modern browser.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
    isAccessibleForFree: true,
    publisher: { '@type': 'Organization', name: SITE.name },
    dateModified: tool.updatedAt,
  };
}

export function collectionPageJsonLd(category: CategoryConfig, tools: ToolConfig[]): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.title,
    url: absoluteUrl(`/${category.slug}`),
    description: category.seoDescription,
    dateModified: category.updatedAt,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: tools.map((t, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: absoluteUrl(t.path),
        name: t.name,
      })),
    },
  };
}

export function webPageJsonLd(name: string, path: string, description: string): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    url: absoluteUrl(path),
    description,
    isPartOf: { '@type': 'WebSite', name: SITE.name, url: SITE_URL },
  };
}
