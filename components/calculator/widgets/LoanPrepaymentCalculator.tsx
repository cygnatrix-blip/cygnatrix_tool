'use client';

import type { AmortizationRow } from '@/types/finance';
import { calculateLoanPrepayment, type PrepaymentType } from '@/lib/finance/loan-prepayment';
import { formatCurrency, formatCurrencyCompact } from '@/lib/format';
import { CalculatorShell, NumberField, ResultStat, CalcError, SegmentedControl } from '@/components/calculator/shell';
import { LineChart } from '@/components/charts/LineChart';
import { SectionHeading } from '@/components/ui/primitives';
import { useCalc } from '@/lib/hooks/useCalc';
import { useShareableState } from '@/lib/hooks/useShareableState';

function yearlyClosingBalance(schedule: AmortizationRow[]): number[] {
  const points: number[] = [];
  schedule.forEach((row, i) => {
    if ((i + 1) % 12 === 0 || i === schedule.length - 1) points.push(row.closingBalance);
  });
  return points;
}

export function LoanPrepaymentCalculator() {
  const [state, setState] = useShareableState({
    principal: 3_000_000,
    rate: 8.5,
    tenureYears: 20,
    prepaymentType: 'monthly' as PrepaymentType,
    lumpsumAmount: 200_000,
    lumpsumMonth: 12,
    extraMonthly: 5_000,
  });
  const { principal, rate, tenureYears, prepaymentType, lumpsumAmount, lumpsumMonth, extraMonthly } = state;

  const result = useCalc(
    'home-loan-prepayment-calculator',
    () =>
      calculateLoanPrepayment({
        principal,
        annualRatePct: rate,
        tenureMonths: tenureYears * 12,
        prepaymentType,
        lumpsumAmount,
        lumpsumMonth,
        extraMonthly,
      }),
    [principal, rate, tenureYears, prepaymentType, lumpsumAmount, lumpsumMonth, extraMonthly],
    () => ({ principal, rate, tenureYears, prepaymentType }),
  );

  return (
    <CalculatorShell
      form={
        <>
          <NumberField label="Loan amount" prefix="₹" value={principal} onChange={(v) => setState({ principal: v })} min={100_000} max={100_000_000} step={50_000} slider />
          <NumberField label="Interest rate" suffix="% p.a." value={rate} onChange={(v) => setState({ rate: v })} min={0} max={30} step={0.05} slider />
          <NumberField label="Loan tenure" suffix="years" value={tenureYears} onChange={(v) => setState({ tenureYears: v })} min={1} max={30} step={1} slider />
          <SegmentedControl
            label="Prepayment type"
            value={prepaymentType}
            onChange={(v) => setState({ prepaymentType: v })}
            options={[
              { value: 'lumpsum', label: 'One-time lump sum' },
              { value: 'monthly', label: 'Extra every month' },
            ]}
          />
          {prepaymentType === 'lumpsum' ? (
            <>
              <NumberField label="Lump sum amount" prefix="₹" value={lumpsumAmount} onChange={(v) => setState({ lumpsumAmount: v })} min={0} max={principal} step={10_000} slider />
              <NumberField label="Applied in month" suffix={`of ${tenureYears * 12}`} value={lumpsumMonth} onChange={(v) => setState({ lumpsumMonth: v })} min={1} max={tenureYears * 12} step={1} slider />
            </>
          ) : (
            <NumberField label="Extra amount every month" prefix="₹" value={extraMonthly} onChange={(v) => setState({ extraMonthly: v })} min={0} max={principal} step={1_000} slider />
          )}
        </>
      }
      results={
        result.ok ? (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ResultStat label="Interest saved" value={formatCurrency(result.data.interestSaved)} emphasis />
              <ResultStat label="EMIs saved" value={`${result.data.emisSaved} months`} emphasis />
              <ResultStat label="Original tenure" value={`${result.data.originalTenureMonths} months`} />
              <ResultStat label="New tenure" value={`${result.data.newTenureMonths} months`} />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ResultStat label="Monthly EMI (unchanged)" value={formatCurrency(result.data.emi)} />
              <ResultStat label="Total interest (with prepayment)" value={formatCurrency(result.data.newTotalInterest)} />
            </div>

            <div className="card p-5">
              <SectionHeading as="h3" className="!mb-4 !text-base">Outstanding balance: original vs with prepayment</SectionHeading>
              <LineChart
                xLabels={yearlyClosingBalance(result.data.originalSchedule).map((_, i) => `Y${i + 1}`)}
                series={[
                  { label: 'Original', color: '#94a3b8', points: yearlyClosingBalance(result.data.originalSchedule) },
                  { label: 'With prepayment', color: '#0d9089', points: yearlyClosingBalance(result.data.newSchedule) },
                ]}
              />
            </div>

            <div className="rounded-xl border border-ink-200 bg-ink-50/60 p-4 text-xs leading-6 text-ink-500 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-400">
              Prepayment shortens the tenure — your EMI stays the same, but you finish paying off the loan{' '}
              {result.data.emisSaved} month{result.data.emisSaved === 1 ? '' : 's'} earlier, saving{' '}
              {formatCurrencyCompact(result.data.interestSaved)} in interest.
            </div>
          </>
        ) : (
          <CalcError message={result.error} />
        )
      }
    />
  );
}
