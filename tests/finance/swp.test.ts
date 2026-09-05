import { describe, expect, it } from 'vitest';
import { calculateSwp } from '@/lib/finance/swp';

describe('calculateSwp', () => {
  it('grows leftover balance when withdrawals are smaller than returns can sustain', () => {
    const r = calculateSwp({
      initialInvestment: 5_000_000,
      monthlyWithdrawal: 10_000,
      annualReturnPct: 12,
      years: 5,
    });
    expect(r.monthsUntilDepleted).toBeNull();
    expect(r.finalValue).toBeGreaterThan(5_000_000);
    expect(r.totalWithdrawn).toBeCloseTo(10_000 * 60, 2);
  });

  it('depletes the corpus and reports the month it ran out', () => {
    const r = calculateSwp({
      initialInvestment: 100_000,
      monthlyWithdrawal: 20_000,
      annualReturnPct: 6,
      years: 2,
    });
    expect(r.monthsUntilDepleted).not.toBeNull();
    expect(r.finalValue).toBe(0);
    expect(r.monthsUntilDepleted!).toBeLessThanOrEqual(24);
  });

  it('never withdraws more than the remaining balance in the final month', () => {
    const r = calculateSwp({
      initialInvestment: 50_000,
      monthlyWithdrawal: 20_000,
      annualReturnPct: 0,
      years: 1,
    });
    // 50000 / 20000 = 2.5 months of full withdrawals, so total withdrawn caps at the corpus.
    expect(r.totalWithdrawn).toBeLessThanOrEqual(50_000);
    expect(r.finalValue).toBe(0);
  });

  it('produces one yearly snapshot per year', () => {
    const r = calculateSwp({
      initialInvestment: 2_000_000,
      monthlyWithdrawal: 15_000,
      annualReturnPct: 8,
      years: 3,
    });
    expect(r.yearly).toHaveLength(3);
    expect(r.yearly.map((y) => y.year)).toEqual([1, 2, 3]);
  });

  it.each([
    ['zero initial investment', { initialInvestment: 0, monthlyWithdrawal: 1000, annualReturnPct: 8, years: 5 }],
    ['zero monthly withdrawal', { initialInvestment: 100_000, monthlyWithdrawal: 0, annualReturnPct: 8, years: 5 }],
    ['negative return', { initialInvestment: 100_000, monthlyWithdrawal: 1000, annualReturnPct: -1, years: 5 }],
  ])('rejects %s', (_label, input) => {
    expect(() => calculateSwp(input)).toThrow();
  });
});
