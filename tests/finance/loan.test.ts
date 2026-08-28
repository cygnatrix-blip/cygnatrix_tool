import { describe, expect, it } from 'vitest';
import { calculateLoan } from '@/lib/finance/loan';
import { calculateEmi } from '@/lib/finance/emi';

describe('calculateLoan', () => {
  it('matches the EMI engine exactly', () => {
    const input = { principal: 800_000, annualRatePct: 9.25, tenureMonths: 96 };
    expect(calculateLoan(input)).toEqual(calculateEmi(input));
  });

  it('produces a full amortization schedule that clears the balance', () => {
    const r = calculateLoan({ principal: 300_000, annualRatePct: 11, tenureMonths: 48 });
    expect(r.schedule).toHaveLength(48);
    expect(r.schedule.at(-1)?.closingBalance).toBe(0);
    expect(r.totalPayment).toBeGreaterThan(r.principal);
  });

  it('rejects invalid input', () => {
    expect(() => calculateLoan({ principal: 0, annualRatePct: 10, tenureMonths: 12 })).toThrow();
  });
});
