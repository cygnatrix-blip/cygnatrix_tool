import { describe, expect, it } from 'vitest';
import { contactSchema, analyticsPayloadSchema } from '@/lib/validation/schemas';

describe('contactSchema', () => {
  it('accepts a valid submission', () => {
    const r = contactSchema.safeParse({
      name: 'Asha',
      email: 'asha@example.com',
      subject: 'Bug report',
      message: 'The EMI chart does not render on Safari.',
    });
    expect(r.success).toBe(true);
  });

  it('rejects a bad email and a short message', () => {
    expect(contactSchema.safeParse({ name: 'A', email: 'x', subject: 'Hi', message: 'no' }).success).toBe(false);
  });

  it('rejects a filled honeypot', () => {
    const r = contactSchema.safeParse({
      name: 'Bot',
      email: 'bot@spam.com',
      subject: 'Buy now',
      message: 'cheap watches for sale here',
      website: 'http://spam.com',
    });
    expect(r.success).toBe(false);
  });
});

describe('analyticsPayloadSchema', () => {
  it('accepts a known event', () => {
    expect(analyticsPayloadSchema.safeParse({ event: 'tool_view', toolSlug: 'emi-calculator', category: 'finance' }).success).toBe(true);
  });

  it('rejects an unknown event and oversized meta', () => {
    expect(analyticsPayloadSchema.safeParse({ event: 'not_real' }).success).toBe(false);
    const meta = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`k${i}`, i]));
    expect(analyticsPayloadSchema.safeParse({ event: 'tool_view', meta }).success).toBe(false);
  });
});
