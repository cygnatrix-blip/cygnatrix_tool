import { describe, expect, it } from 'vitest';
import { calculateGst } from '@/lib/finance/gst';

describe('calculateGst', () => {
  it('adds GST on an exclusive amount', () => {
    const r = calculateGst({ amount: 1000, ratePct: 18, mode: 'exclusive' });
    expect(r.baseAmount).toBe(1000);
    expect(r.gstAmount).toBe(180);
    expect(r.totalAmount).toBe(1180);
    expect(r.cgst).toBe(90);
    expect(r.sgst).toBe(90);
    expect(r.igst).toBe(0);
  });

  it('backs GST out of an inclusive amount', () => {
    const r = calculateGst({ amount: 1180, ratePct: 18, mode: 'inclusive' });
    expect(r.baseAmount).toBeCloseTo(1000, 2);
    expect(r.gstAmount).toBeCloseTo(180, 2);
    expect(r.totalAmount).toBe(1180);
  });

  it('uses IGST for inter-state supply', () => {
    const r = calculateGst({ amount: 5000, ratePct: 12, mode: 'exclusive', interState: true });
    expect(r.igst).toBe(600);
    expect(r.cgst).toBe(0);
    expect(r.sgst).toBe(0);
  });

  it('handles a zero rate and a zero amount', () => {
    expect(calculateGst({ amount: 500, ratePct: 0, mode: 'exclusive' }).totalAmount).toBe(500);
    expect(calculateGst({ amount: 0, ratePct: 18, mode: 'inclusive' }).baseAmount).toBe(0);
  });

  it.each([28, 5, 3, 0.25])('supports the %s%% slab', (rate) => {
    const r = calculateGst({ amount: 10_000, ratePct: rate, mode: 'exclusive' });
    expect(r.gstAmount).toBeCloseTo((10_000 * rate) / 100, 2);
  });

  it.each([
    ['negative amount', { amount: -1, ratePct: 18, mode: 'exclusive' as const }],
    ['negative rate', { amount: 100, ratePct: -1, mode: 'exclusive' as const }],
    ['NaN amount', { amount: Number.NaN, ratePct: 18, mode: 'exclusive' as const }],
  ])('rejects %s', (_label, input) => {
    expect(() => calculateGst(input)).toThrow();
  });
});
