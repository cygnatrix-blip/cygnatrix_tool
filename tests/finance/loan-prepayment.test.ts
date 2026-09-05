import { describe, expect, it } from 'vitest';
import { calculateLoanPrepayment } from '@/lib/finance/loan-prepayment';
import { calculateEmi } from '@/lib/finance/emi';

describe('calculateLoanPrepayment', () => {
  it('matches the plain EMI engine when there is no prepayment', () => {
    const base = { principal: 3_000_000, annualRatePct: 8.5, tenureMonths: 240 };
    const noExtra = calculateLoanPrepayment({ ...base, prepaymentType: 'monthly', extraMonthly: 0 });
    const plain = calculateEmi(base);
    expect(noExtra.emi).toBe(plain.emi);
    expect(noExtra.newTenureMonths).toBe(plain.schedule.length);
    expect(noExtra.interestSaved).toBe(0);
    expect(noExtra.emisSaved).toBe(0);
  });

  it('a recurring extra monthly payment shortens tenure and saves interest', () => {
    const r = calculateLoanPrepayment({
      principal: 3_000_000,
      annualRatePct: 8.5,
      tenureMonths: 240,
      prepaymentType: 'monthly',
      extraMonthly: 10_000,
    });
    expect(r.newTenureMonths).toBeLessThan(r.originalTenureMonths);
    expect(r.newTotalInterest).toBeLessThan(r.originalTotalInterest);
    expect(r.interestSaved).toBeGreaterThan(0);
    expect(r.emisSaved).toBe(r.originalTenureMonths - r.newTenureMonths);
  });

  it('a one-time lump sum applied early saves more interest than the same lump sum applied late', () => {
    const early = calculateLoanPrepayment({
      principal: 2_000_000,
      annualRatePct: 9,
      tenureMonths: 180,
      prepaymentType: 'lumpsum',
      lumpsumAmount: 500_000,
      lumpsumMonth: 12,
    });
    const late = calculateLoanPrepayment({
      principal: 2_000_000,
      annualRatePct: 9,
      tenureMonths: 180,
      prepaymentType: 'lumpsum',
      lumpsumAmount: 500_000,
      lumpsumMonth: 120,
    });
    expect(early.interestSaved).toBeGreaterThan(late.interestSaved);
  });

  it('the new schedule always clears to a zero closing balance', () => {
    const r = calculateLoanPrepayment({
      principal: 1_000_000,
      annualRatePct: 10,
      tenureMonths: 60,
      prepaymentType: 'lumpsum',
      lumpsumAmount: 200_000,
      lumpsumMonth: 6,
    });
    expect(r.newSchedule.at(-1)?.closingBalance).toBe(0);
  });

  it('a lump sum large enough to clear the loan ends the schedule at that month', () => {
    const r = calculateLoanPrepayment({
      principal: 500_000,
      annualRatePct: 8,
      tenureMonths: 120,
      prepaymentType: 'lumpsum',
      lumpsumAmount: 500_000,
      lumpsumMonth: 1,
    });
    expect(r.newTenureMonths).toBe(1);
    expect(r.newSchedule.at(-1)?.closingBalance).toBe(0);
  });

  it.each([
    ['zero principal', { principal: 0, annualRatePct: 8, tenureMonths: 120, prepaymentType: 'monthly' as const }],
    [
      'lump sum exceeding principal',
      {
        principal: 500_000,
        annualRatePct: 8,
        tenureMonths: 120,
        prepaymentType: 'lumpsum' as const,
        lumpsumAmount: 600_000,
        lumpsumMonth: 1,
      },
    ],
    [
      'lump sum month beyond tenure',
      {
        principal: 500_000,
        annualRatePct: 8,
        tenureMonths: 120,
        prepaymentType: 'lumpsum' as const,
        lumpsumAmount: 10_000,
        lumpsumMonth: 200,
      },
    ],
  ])('rejects %s', (_label, input) => {
    expect(() => calculateLoanPrepayment(input)).toThrow();
  });
});
