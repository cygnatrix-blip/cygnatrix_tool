/**
 * In-memory token-bucket rate limiter. Per-process — fine for a single Node
 * instance on shared hosting. The interface is deliberately Redis-shaped so it
 * can be swapped for a distributed store later without touching callers.
 */
interface Bucket {
  tokens: number;
  updatedAt: number;
}

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, b] of buckets) {
    if (now - b.updatedAt > 3_600_000) buckets.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * @param key      unique identifier (e.g. `analytics:1.2.3.4`)
 * @param limit    max requests per window
 * @param windowMs window length in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const refillRate = limit / windowMs;
  const existing = buckets.get(key);
  const bucket: Bucket = existing ?? { tokens: limit, updatedAt: now };

  // Refill based on elapsed time.
  const elapsed = now - bucket.updatedAt;
  bucket.tokens = Math.min(limit, bucket.tokens + elapsed * refillRate);
  bucket.updatedAt = now;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    buckets.set(key, bucket);
    return { allowed: true, remaining: Math.floor(bucket.tokens), retryAfterSeconds: 0 };
  }

  buckets.set(key, bucket);
  const needed = 1 - bucket.tokens;
  return {
    allowed: false,
    remaining: 0,
    retryAfterSeconds: Math.ceil(needed / refillRate / 1000),
  };
}

/** Best-effort client IP from proxy headers (Hostinger / reverse proxy). */
export function clientIp(headers: Headers): string {
  const candidates = [
    headers.get('cf-connecting-ip'),
    headers.get('x-real-ip'),
    headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
  ];
  return candidates.find((v) => v && v.length > 0) ?? '0.0.0.0';
}
