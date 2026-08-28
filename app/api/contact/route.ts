import { NextResponse } from 'next/server';
import { contactSchema } from '@/lib/validation/schemas';
import { rateLimit, clientIp } from '@/lib/security/rate-limit';
import { hashIp } from '@/lib/security/hash';
import { insertContactMessage } from '@/lib/db/queries';
import { isDbEnabled } from '@/lib/db/pool';
import { RATE_LIMITS } from '@/config/site';
import { logError, logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '').trim();
}

export async function POST(request: Request) {
  const ip = clientIp(request.headers);

  const rl = rateLimit(`contact:${ip}`, RATE_LIMITS.contactPerHour, 3_600_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: 'Too many messages. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } },
    );
  }

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

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid submission.' },
      { status: 422 },
    );
  }

  // Honeypot filled → silently accept, do not store.
  if (parsed.data.website) {
    return NextResponse.json({ ok: true });
  }

  const clean = {
    name: stripHtml(parsed.data.name),
    email: parsed.data.email.trim(),
    subject: stripHtml(parsed.data.subject),
    message: stripHtml(parsed.data.message),
    ipHash: hashIp(ip),
    userAgent: (request.headers.get('user-agent') ?? '').slice(0, 255),
  };

  if (!isDbEnabled()) {
    // No DB configured — log so the message is not lost, then accept.
    logger.info({ scope: 'contact', from: clean.email, subject: clean.subject }, 'Contact message received (no DB)');
    return NextResponse.json({ ok: true });
  }

  try {
    await insertContactMessage(clean);
    return NextResponse.json({ ok: true });
  } catch (error) {
    logError('api/contact', error);
    return NextResponse.json({ ok: false, error: 'Could not send your message. Please try again.' }, { status: 500 });
  }
}
