import { describe, expect, it } from 'vitest';
import { calculateCapitalGains } from '@/lib/finance/capital-gains';

describe('calculateCapitalGains', () => {
  it('taxes equity LTCG at the flat rate above the annual exemption', () => {
    const r = calculateCapitalGains({
      assetClass: 'equity',
      purchaseValue: 100_000,
      saleValue: 300_000,
      holdingMonths: 13,
    });
    expect(r.isLongTerm).toBe(true);
    expect(r.gain).toBe(200_000);
    expect(r.exemptionApplied).toBe(125_000);
    expect(r.taxableGain).toBe(75_000);
    expect(r.tax).toBeCloseTo(75_000 * 0.125, 2);
    expect(r.note).toBeNull();
  });

  it('exempts equity LTCG entirely when the gain is within the annual exemption', () => {
    const r = calculateCapitalGains({
      assetClass: 'equity',
      purchaseValue: 100_000,
      saleValue: 200_000,
      holdingMonths: 24,
    });
    expect(r.exemptionApplied).toBe(100_000);
    expect(r.taxableGain).toBe(0);
    expect(r.tax).toBe(0);
  });

  it('taxes equity STCG at the short-term rate with no exemption', () => {
    const r = calculateCapitalGains({
      assetClass: 'equity',
      purchaseValue: 100_000,
      saleValue: 150_000,
      holdingMonths: 6,
    });
    expect(r.isLongTerm).toBe(false);
    expect(r.exemptionApplied).toBe(0);
    expect(r.tax).toBeCloseTo(50_000 * 0.2, 2);
  });

  it('taxes non-equity LTCG at the flat rate with no exemption', () => {
    const r = calculateCapitalGains({
      assetClass: 'other',
      purchaseValue: 1_000_000,
      saleValue: 1_500_000,
      holdingMonths: 30,
    });
    expect(r.isLongTerm).toBe(true);
    expect(r.exemptionApplied).toBe(0);
    expect(r.tax).toBeCloseTo(500_000 * 0.125, 2);
  });

  it('reports null tax with an explanatory note for non-equity STCG', () => {
    const r = calculateCapitalGains({
      assetClass: 'other',
      purchaseValue: 1_000_000,
      saleValue: 1_200_000,
      holdingMonths: 10,
    });
    expect(r.isLongTerm).toBe(false);
    expect(r.tax).toBeNull();
    expect(r.ratePct).toBeNull();
    expect(r.note).toMatch(/slab rate/i);
  });

  it('treats a loss as zero taxable gain with zero tax', () => {
    const r = calculateCapitalGains({
      assetClass: 'equity',
      purchaseValue: 200_000,
      saleValue: 150_000,
      holdingMonths: 15,
    });
    expect(r.gain).toBe(-50_000);
    expect(r.taxableGain).toBe(0);
    expect(r.tax).toBe(0);
  });

  it('classifies exactly the threshold month as long-term', () => {
    const equity = calculateCapitalGains({
      assetClass: 'equity',
      purchaseValue: 100_000,
      saleValue: 110_000,
      holdingMonths: 12,
    });
    expect(equity.isLongTerm).toBe(true);

    const other = calculateCapitalGains({
      assetClass: 'other',
      purchaseValue: 100_000,
      saleValue: 110_000,
      holdingMonths: 24,
    });
    expect(other.isLongTerm).toBe(true);
  });

  it.each([
    ['negative purchase value', { assetClass: 'equity' as const, purchaseValue: -1, saleValue: 100, holdingMonths: 12 }],
    ['negative holding period', { assetClass: 'equity' as const, purchaseValue: 100, saleValue: 200, holdingMonths: -1 }],
    ['invalid asset class', { assetClass: 'crypto' as never, purchaseValue: 100, saleValue: 200, holdingMonths: 12 }],
  ])('rejects %s', (_label, input) => {
    expect(() => calculateCapitalGains(input)).toThrow();
  });
});
