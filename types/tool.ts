export type CategorySlug = 'pdf' | 'finance' | 'image';

export type ToolType = 'calculator' | 'file' | 'converter';

export interface FormulaVar {
  sym: string;
  meaning: string;
}

export interface ToolFormula {
  expression: string;
  where: FormulaVar[];
  notes?: string[];
}

export interface ToolExample {
  inputs: { label: string; value: string }[];
  result: { label: string; value: string }[];
  walkthrough: string;
}

export interface HowItWorksStep {
  title: string;
  body: string;
}

export interface ContentSection {
  heading: string;
  /** Plain paragraphs; rendered as <p>. Keep copy original and genuinely useful. */
  paragraphs: string[];
  /** Optional bullet list rendered after the paragraphs. */
  bullets?: string[];
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface ToolContent {
  howItWorks: HowItWorksStep[];
  features: string[];
  sections?: ContentSection[];
  formula?: ToolFormula;
  example?: ToolExample;
}

export interface ToolConfig {
  id: string;
  name: string;
  slug: string;
  category: CategorySlug;
  /** Derived + validated: `/${category}/${slug}` */
  path: string;
  shortDescription: string;
  description: string;
  icon: string;
  toolType: ToolType;
  active: boolean;
  featured: boolean;
  popular: boolean;
  keywords: string[];
  seoTitle: string;
  seoDescription: string;
  content: ToolContent;
  faq: FaqItem[];
  /** Tool ids. Validated to exist and be active. */
  relatedTools: string[];
  sortOrder: number;
  /** ISO date — powers <lastmod> and the visible "Last updated" line. */
  updatedAt: string;
}

export interface CategoryConfig {
  slug: CategorySlug;
  name: string;
  /** Short label for nav, e.g. "PDF Tools". */
  navLabel: string;
  title: string;
  tagline: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  icon: string;
  intro: string[];
  helpfulContent: ContentSection[];
  faq: FaqItem[];
  sortOrder: number;
  updatedAt: string;
}
