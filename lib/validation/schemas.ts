import { z } from 'zod';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';

/** Shared between the client analytics helper and the /api/analytics route. */
export const analyticsPayloadSchema = z.object({
  event: z.enum(ANALYTICS_EVENTS),
  toolSlug: z.string().max(60).regex(/^[a-z0-9/-]*$/).optional(),
  category: z.string().max(20).optional(),
  meta: z
    .record(z.union([z.string().max(120), z.number(), z.boolean()]))
    .refine((m) => Object.keys(m).length <= 12, 'Too many meta keys')
    .optional(),
});

export type AnalyticsPayloadInput = z.infer<typeof analyticsPayloadSchema>;

/** Contact form — validated on the client for UX and again on the server. */
export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name.').max(120),
  email: z.string().trim().email('Please enter a valid email address.').max(190),
  subject: z.string().trim().min(3, 'Please add a subject.').max(160),
  message: z.string().trim().min(10, 'Please write a little more.').max(4000),
  /** Honeypot — must stay empty. */
  website: z.string().max(0).optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;
