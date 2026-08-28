import type { CategorySlug } from '@/types/tool';

const RAW_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tools.cygnatrix.com';
/** Canonical origin, never a trailing slash. */
export const SITE_URL = RAW_URL.replace(/\/+$/, '');

export const SITE = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? 'Cygnatrix Tools',
  shortName: 'Cygnatrix Tools',
  url: SITE_URL,
  tagline: 'Fast, Free & Useful Online Tools',
  description:
    'Free online PDF tools, finance calculators and image tools designed to be fast, simple and easy to use.',
  locale: 'en_IN',
  twitter: '@cygnatrix',
  company: {
    name: 'Cygnatrix IT Solutions',
    url: 'https://cygnatrix.com',
  },
  contactEmail: process.env.CONTACT_NOTIFY_EMAIL ?? 'support@cygnatrix.com',
} as const;

/**
 * Brand assets. To use the exact company logo, drop the files into `public/brand/`
 * with these names (SVG preferred; PNG with transparent background also fine — just
 * change the extension here). Nothing else needs to change.
 *   - logo-mark.(svg|png):  square-ish swan mark, used in the header, footer and share cards
 *   - app/icon.svg:          favicon / PWA icon (edit that file directly)
 */
export const BRAND = {
  mark: '/brand/logo-mark.svg',
  markSize: { width: 32, height: 32 },
  /** Alt text for the logo image. */
  alt: `${process.env.NEXT_PUBLIC_SITE_NAME ?? 'Cygnatrix Tools'} logo`,
} as const;

export const NAV_LINKS: { label: string; href: string }[] = [
  { label: 'PDF Tools', href: '/pdf' },
  { label: 'Finance', href: '/finance' },
  { label: 'Image Tools', href: '/image' },
  { label: 'All Tools', href: '/tools' },
];

export const FOOTER_LINKS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Categories',
    links: [
      { label: 'PDF Tools', href: '/pdf' },
      { label: 'Finance Calculators', href: '/finance' },
      { label: 'Image Tools', href: '/image' },
      { label: 'All Tools', href: '/tools' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookie-policy' },
      { label: 'Disclaimer', href: '/disclaimer' },
    ],
  },
];

/**
 * File-processing limits. Every file tool reads from here and shows the relevant
 * limit before processing. Tuned conservatively for in-browser processing on
 * modest mobile devices.
 */
export const FILE_LIMITS = {
  pdf: {
    maxFileSizeMB: 50,
    maxFiles: 20,
    maxPages: 500,
    processingTimeoutMs: 120_000,
  },
  image: {
    maxFileSizeMB: 25,
    maxFiles: 30,
    processingTimeoutMs: 60_000,
  },
} as const;

export type FileLimitGroup = keyof typeof FILE_LIMITS;

export const RATE_LIMITS = {
  apiPerMinute: Number(process.env.RATE_LIMIT_PER_MINUTE ?? 30),
  contactPerHour: Number(process.env.CONTACT_RATE_LIMIT_PER_HOUR ?? 5),
} as const;

/** AdSense configuration. Ads are disabled entirely when the client id is unset. */
export const ADS = {
  client: process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? '',
  enabled: Boolean(process.env.NEXT_PUBLIC_ADSENSE_CLIENT),
  placeholder: process.env.NEXT_PUBLIC_ADS_PLACEHOLDER === 'true',
  slots: {
    landing: process.env.NEXT_PUBLIC_ADSENSE_SLOT_LANDING ?? '',
    category: process.env.NEXT_PUBLIC_ADSENSE_SLOT_CATEGORY ?? '',
    toolResult: process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOOL_RESULT ?? '',
    content: process.env.NEXT_PUBLIC_ADSENSE_SLOT_CONTENT ?? '',
  },
} as const;

export type AdSlotName = keyof typeof ADS.slots;

export const ANALYTICS = {
  gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? '',
  enabled: Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID),
} as const;

export const CATEGORY_ORDER: CategorySlug[] = ['pdf', 'finance', 'image'];
