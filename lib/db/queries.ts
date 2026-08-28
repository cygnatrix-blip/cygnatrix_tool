import { query } from './pool';

export interface AnalyticsRow {
  event: string;
  toolSlug: string | null;
  category: string | null;
  meta: Record<string, unknown> | null;
  country: string | null;
  device: string | null;
  referrerHost: string | null;
  ipHash: string | null;
}

export async function insertAnalyticsEvent(row: AnalyticsRow): Promise<void> {
  await query(
    `INSERT INTO analytics_events
       (event, tool_slug, category, meta, country, device, referrer_host, ip_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.event,
      row.toolSlug,
      row.category,
      row.meta ? JSON.stringify(row.meta) : null,
      row.country,
      row.device,
      row.referrerHost,
      row.ipHash,
    ],
  );
}

export interface ContactRow {
  name: string;
  email: string;
  subject: string;
  message: string;
  ipHash: string | null;
  userAgent: string | null;
}

export async function insertContactMessage(row: ContactRow): Promise<void> {
  await query(
    `INSERT INTO contact_messages (name, email, subject, message, ip_hash, user_agent)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [row.name, row.email, row.subject, row.message, row.ipHash, row.userAgent],
  );
}
