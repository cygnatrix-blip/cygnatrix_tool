import { NextResponse } from 'next/server';
import { analyticsPayloadSchema } from '@/lib/validation/schemas';
import { rateLimit, clientIp } from '@/lib/security/rate-limit';
import { hashIp } from '@/lib/security/hash';
import { insertAnalyticsEvent } from '@/lib/db/queries';
import { isDbEnabled } from '@/lib/db/pool';
import { RATE_LIMITS } from '@/config/site';
import { logError } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function deviceFromUa(ua: string): string {
  if (/mobile/i.test(ua)) return 'mobile';
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  if (ua) return 'desktop';
  return 'unknown';
}

export async function POST(request: Request) {
  const ip = clientIp(request.headers);

  const rl = rateLimit(`analytics:${ip}`, RATE_LIMITS.apiPerMinute, 60_000);
  if (!rl.allowed) {
    return new NextResponse(null, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } });
  }

  // Same-origin guard.
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (origin && host) {
    let originHost = '';
    try {
      originHost = new URL(origin).host;
    } catch {
      /* malformed Origin */
    }
    if (originHost !== host) {
      return NextResponse.json({ ok: false }, { status: 403 });
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = analyticsPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 422 });
  }

  // Accepted regardless of DB availability — analytics is best-effort.
  if (!isDbEnabled()) {
    return NextResponse.json({ ok: true, stored: false });
  }

  try {
    const ua = request.headers.get('user-agent') ?? '';
    const referer = request.headers.get('referer');
    let referrerHost: string | null = null;
    try {
      referrerHost = referer ? new URL(referer).host.slice(0, 120) : null;
    } catch {
      referrerHost = null;
    }

    await insertAnalyticsEvent({
      event: parsed.data.event,
      toolSlug: parsed.data.toolSlug ?? null,
      category: parsed.data.category ?? null,
      meta: parsed.data.meta ?? null,
      country: request.headers.get('x-vercel-ip-country') ?? request.headers.get('cf-ipcountry') ?? null,
      device: deviceFromUa(ua),
      referrerHost,
      ipHash: hashIp(ip),
    });
    return NextResponse.json({ ok: true, stored: true });
  } catch (error) {
    logError('api/analytics', error);
    return NextResponse.json({ ok: true, stored: false });
  }
}
