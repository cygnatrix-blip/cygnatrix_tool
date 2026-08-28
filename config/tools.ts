import type { CategorySlug, ToolConfig } from '@/types/tool';
import { ALL_TOOLS } from './tools/index';

export { ALL_TOOLS };

export const ACTIVE_TOOLS: ToolConfig[] = ALL_TOOLS.filter((t) => t.active);

const BY_ID = new Map(ALL_TOOLS.map((t) => [t.id, t]));
const BY_SLUG = new Map(ALL_TOOLS.map((t) => [`${t.category}/${t.slug}`, t]));

export function getToolById(id: string): ToolConfig | undefined {
  return BY_ID.get(id);
}

export function getTool(category: string, slug: string): ToolConfig | undefined {
  return BY_SLUG.get(`${category}/${slug}`);
}

export function getToolsByCategory(category: CategorySlug): ToolConfig[] {
  return ACTIVE_TOOLS.filter((t) => t.category === category).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getFeaturedTools(limit?: number): ToolConfig[] {
  const list = ACTIVE_TOOLS.filter((t) => t.featured).sort(
    (a, b) => a.category.localeCompare(b.category) || a.sortOrder - b.sortOrder,
  );
  return limit ? list.slice(0, limit) : list;
}

/**
 * Popular tools shown on the landing page. The spec fixes the initial six; we keep
 * that order but fall back to the `popular` flag if a config changes.
 */
const LANDING_POPULAR_ORDER = [
  'emi-calculator',
  'merge-pdf',
  'compress-pdf',
  'sip-calculator',
  'compress-image',
  'jpg-to-png',
];

export function getPopularTools(): ToolConfig[] {
  const ordered = LANDING_POPULAR_ORDER.map((id) => BY_ID.get(id)).filter(
    (t): t is ToolConfig => Boolean(t?.active),
  );
  if (ordered.length === LANDING_POPULAR_ORDER.length) return ordered;
  return ACTIVE_TOOLS.filter((t) => t.popular).slice(0, 6);
}

export function getRelatedTools(tool: ToolConfig, limit = 4): ToolConfig[] {
  const related = tool.relatedTools
    .map((id) => BY_ID.get(id))
    .filter((t): t is ToolConfig => Boolean(t?.active));
  return related.slice(0, limit);
}

export interface ToolSearchResult {
  tool: ToolConfig;
  score: number;
}

/**
 * Lightweight local search over the tool registry. Matches name, category,
 * description, short description and keywords. Deterministic and fast for 18–hundreds
 * of tools; swappable for a search service later without touching callers.
 */
export function searchTools(query: string, limit = 8): ToolConfig[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);

  const results: ToolSearchResult[] = [];
  for (const tool of ACTIVE_TOOLS) {
    const haystacks: { text: string; weight: number }[] = [
      { text: tool.name.toLowerCase(), weight: 10 },
      { text: tool.id.replace(/-/g, ' '), weight: 8 },
      { text: tool.category, weight: 6 },
      { text: tool.keywords.join(' ').toLowerCase(), weight: 5 },
      { text: tool.shortDescription.toLowerCase(), weight: 3 },
      { text: tool.description.toLowerCase(), weight: 2 },
    ];

    let score = 0;
    for (const term of terms) {
      let termScore = 0;
      for (const { text, weight } of haystacks) {
        if (text === term) termScore = Math.max(termScore, weight * 3);
        else if (text.startsWith(term)) termScore = Math.max(termScore, weight * 2);
        else if (text.includes(term)) termScore = Math.max(termScore, weight);
      }
      if (termScore === 0) {
        score = 0;
        break;
      }
      score += termScore;
    }
    if (score > 0) results.push({ tool, score });
  }

  return results
    .sort((a, b) => b.score - a.score || a.tool.name.localeCompare(b.tool.name))
    .slice(0, limit)
    .map((r) => r.tool);
}

/** Minimal payload for the client-side search dialog. */
export interface ToolIndexEntry {
  id: string;
  name: string;
  path: string;
  category: CategorySlug;
  icon: string;
  shortDescription: string;
  keywords: string[];
  popular: boolean;
}

export function getToolSearchIndex(): ToolIndexEntry[] {
  return ACTIVE_TOOLS.map((t) => ({
    id: t.id,
    name: t.name,
    path: t.path,
    category: t.category,
    icon: t.icon,
    shortDescription: t.shortDescription,
    keywords: t.keywords,
    popular: t.popular,
  }));
}

const CATEGORY_LABEL: Record<CategorySlug, string> = {
  pdf: 'PDF Tools',
  finance: 'Finance',
  image: 'Image Tools',
};

export function categoryLabel(slug: CategorySlug): string {
  return CATEGORY_LABEL[slug];
}
