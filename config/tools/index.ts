import { z } from 'zod';
import type { ToolConfig } from '@/types/tool';
import { PDF_TOOLS } from './pdf';
import { FINANCE_TOOLS } from './finance';
import { IMAGE_TOOLS } from './image';

const faqSchema = z.object({ q: z.string().min(3), a: z.string().min(3) });

const toolSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(2),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  category: z.enum(['pdf', 'finance', 'image']),
  path: z.string().regex(/^\/(pdf|finance|image)\/[a-z0-9-]+$/),
  shortDescription: z.string().min(10).max(110),
  description: z.string().min(20),
  icon: z.string().min(2),
  toolType: z.enum(['calculator', 'file', 'converter']),
  active: z.boolean(),
  featured: z.boolean(),
  popular: z.boolean(),
  keywords: z.array(z.string().min(2)).min(3),
  // Unique text only — the " | Cygnatrix Tools" suffix is added centrally in buildMetadata.
  // Keep under ~60 so the full title (with suffix) stays near Google's ~600px display width.
  seoTitle: z.string().min(15).max(62),
  // Descriptions aim for 150–160 chars; longer is allowed (Google truncates, not penalises).
  seoDescription: z.string().min(50).max(260),
  content: z.object({
    howItWorks: z.array(z.object({ title: z.string(), body: z.string() })).min(2),
    features: z.array(z.string()).min(3),
    sections: z
      .array(z.object({ heading: z.string(), paragraphs: z.array(z.string()).min(1), bullets: z.array(z.string()).optional() }))
      .optional(),
    formula: z
      .object({
        expression: z.string(),
        where: z.array(z.object({ sym: z.string(), meaning: z.string() })).min(1),
        notes: z.array(z.string()).optional(),
      })
      .optional(),
    example: z
      .object({
        inputs: z.array(z.object({ label: z.string(), value: z.string() })).min(1),
        result: z.array(z.object({ label: z.string(), value: z.string() })).min(1),
        walkthrough: z.string().min(20),
      })
      .optional(),
  }),
  faq: z.array(faqSchema).min(3),
  relatedTools: z.array(z.string()).min(2),
  sortOrder: z.number().int().positive(),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const ALL: ToolConfig[] = [...PDF_TOOLS, ...FINANCE_TOOLS, ...IMAGE_TOOLS];

// Validate at module load — a bad tool config fails the build, never production.
for (const tool of ALL) {
  const parsed = toolSchema.safeParse(tool);
  if (!parsed.success) {
    throw new Error(
      `Invalid tool config "${tool.id ?? 'unknown'}": ${parsed.error.issues
        .map((i) => `${i.path.join('.')} ${i.message}`)
        .join('; ')}`,
    );
  }
  if (tool.path !== `/${tool.category}/${tool.slug}`) {
    throw new Error(`Tool "${tool.id}" path "${tool.path}" does not match category/slug.`);
  }
}

const ids = new Set(ALL.map((t) => t.id));
if (ids.size !== ALL.length) {
  throw new Error('Duplicate tool id detected in tool config.');
}
for (const tool of ALL) {
  if (tool.relatedTools.includes(tool.id)) {
    throw new Error(`Tool "${tool.id}" lists itself as a related tool.`);
  }
  for (const rel of tool.relatedTools) {
    if (!ids.has(rel)) {
      throw new Error(`Tool "${tool.id}" references unknown related tool "${rel}".`);
    }
  }
}

export const ALL_TOOLS: readonly ToolConfig[] = Object.freeze(
  [...ALL].sort((a, b) => a.category.localeCompare(b.category) || a.sortOrder - b.sortOrder),
);
