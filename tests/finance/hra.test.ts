import { describe, expect, it } from 'vitest';
import { calculateHraExemption } from '@/lib/finance/hra';

describe('calculateHraExemption', () => {
  it('picks actual HRA received as the limiting factor when it is smallest', () => {
    const r = calculateHraExemption({
      basicPlusDaAnnual: 1_200_000,
      hraReceivedAnnual: 100_000,
      rentPaidAnnual: 600_000,
      isMetro: true,
    });
    expect(r.limitingFactor).toBe('actualHra');
    expect(r.exemptAnnual).toBe(100_000);
    expect(r.taxableHraAnnual).toBe(0);
  });

  it('picks rent minus 10% of basic when it is the smallest, in a metro', () => {
    const r = calculateHraExemption({
      basicPlusDaAnnual: 600_000,
      hraReceivedAnnual: 400_000,
      rentPaidAnnual: 300_000,
      isMetro: true,
    });
    // rent - 10% basic = 300000 - 60000 = 240000; 50% of basic = 300000; actual = 400000
    expect(r.breakdown.rentMinusTenPct).toBe(240_000);
    expect(r.limitingFactor).toBe('rentMinusTenPct');
    expect(r.exemptAnnual).toBe(240_000);
  });

  it('uses 40% of basic instead of 50% for a non-metro city', () => {
    const metro = calculateHraExemption({
      basicPlusDaAnnual: 600_000,
      hraReceivedAnnual: 400_000,
      rentPaidAnnual: 500_000,
      isMetro: true,
    });
    const nonMetro = calculateHraExemption({
      basicPlusDaAnnual: 600_000,
      hraReceivedAnnual: 400_000,
      rentPaidAnnual: 500_000,
      isMetro: false,
    });
    expect(metro.breakdown.salaryPct).toBe(300_000);
    expect(nonMetro.breakdown.salaryPct).toBe(240_000);
  });

  it('exempts nothing when no rent is paid', () => {
    const r = calculateHraExemption({
      basicPlusDaAnnual: 600_000,
      hraReceivedAnnual: 200_000,
      rentPaidAnnual: 0,
      isMetro: true,
    });
    expect(r.exemptAnnual).toBe(0);
    expect(r.taxableHraAnnual).toBe(200_000);
  });

  it('never lets rent-minus-10% go negative when rent is below 10% of basic', () => {
    const r = calculateHraExemption({
      basicPlusDaAnnual: 1_000_000,
      hraReceivedAnnual: 200_000,
      rentPaidAnnual: 50_000,
      isMetro: false,
    });
    expect(r.breakdown.rentMinusTenPct).toBe(0);
    expect(r.limitingFactor).toBe('rentMinusTenPct');
    expect(r.exemptAnnual).toBe(0);
  });

  it.each([
    ['negative basic', { basicPlusDaAnnual: -1, hraReceivedAnnual: 100, rentPaidAnnual: 100, isMetro: true }],
    ['negative HRA received', { basicPlusDaAnnual: 100, hraReceivedAnnual: -1, rentPaidAnnual: 100, isMetro: true }],
    ['negative rent', { basicPlusDaAnnual: 100, hraReceivedAnnual: 100, rentPaidAnnual: -1, isMetro: true }],
  ])('rejects %s', (_label, input) => {
    expect(() => calculateHraExemption(input)).toThrow();
  });
});
