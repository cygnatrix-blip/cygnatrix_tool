import { createHash } from 'node:crypto';

/**
 * One-way, daily-rotating hash of a visitor IP. The daily salt component means a
 * hash cannot be linked across days, and without the server secret it cannot be
 * reversed or matched to an IP at all. Used only for coarse abuse detection and
 * unique-visitor estimates.
 */
export function hashIp(ip: string): string {
  const secret = process.env.ANALYTICS_IP_SALT ?? 'insecure-dev-salt';
  const day = new Date().toISOString().slice(0, 10);
  return createHash('sha256').update(`${secret}:${day}:${ip}`).digest('hex');
}
