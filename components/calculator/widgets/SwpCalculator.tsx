'use client';

import { calculateSwp } from '@/lib/finance/swp';
import { formatCurrency, formatCurrencyCompact } from '@/lib/format';
import { CalculatorShell, NumberField, ResultStat, CalcError } from '@/components/calculator/shell';
import { LineChart } from '@/components/charts/LineChart';
import { SectionHeading } from '@/components/ui/primitives';
import { useCalc } from '@/lib/hooks/useCalc';
import { useShareableState } from '@/lib/hooks/useShareableState';

export function SwpCalculator() {
  const [state, setState] = useShareableState({ initial: 5_000_000, withdrawal: 30_000, rate: 8, years: 15 });
  const { initial, withdrawal, rate, years } = state;

  const result = useCalc(
    'swp-calculator',
    () => calculateSwp({ initialInvestment: initial, monthlyWithdrawal: withdrawal, annualReturnPct: rate, years }),
    [initial, withdrawal, rate, years],
    () => ({ initial, withdrawal, rate, years }),
  );

  return (
    <CalculatorShell
      form={
        <>
          <NumberField label="Initial investment" prefix="₹" value={initial} onChange={(v) => setState({ initial: v })} min={10_000} max={1_000_000_000} step={100_000} slider />
          <NumberField label="Monthly withdrawal" prefix="₹" value={withdrawal} onChange={(v) => setState({ withdrawal: v })} min={500} max={10_000_000} step={1_000} slider />
          <NumberField label="Expected annual return" suffix="% p.a." value={rate} onChange={(v) => setState({ rate: v })} min={0} max={30} step={0.5} slider />
          <NumberField label="Withdrawal period" suffix="years" value={years} onChange={(v) => setState({ years: v })} min={1} max={40} step={1} slider />
        </>
      }
      results={
        result.ok ? (
          <>
            {result.data.monthsUntilDepleted !== null && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                At this withdrawal rate, the corpus runs out after {result.data.monthsUntilDepleted} months — before
                your {years}-year period ends.
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <ResultStat label="Total withdrawn" value={formatCurrency(result.data.totalWithdrawn)} />
              <ResultStat label="Final corpus value" value={formatCurrency(result.data.finalValue)} emphasis />
              <ResultStat
                label="Corpus lasted"
                value={result.data.monthsUntilDepleted === null ? `Full ${years} years` : `${result.data.monthsUntilDepleted} months`}
              />
            </div>

            <div className="card p-5">
              <SectionHeading as="h3" className="!mb-4 !text-base">Corpus value over time</SectionHeading>
              <LineChart
                xLabels={result.data.yearly.map((y) => `Y${y.year}`)}
                series={[{ label: 'Remaining value', color: '#0d9089', points: result.data.yearly.map((y) => y.value) }]}
              />
            </div>

            <div className="rounded-xl border border-ink-200 bg-ink-50/60 p-4 text-xs leading-6 text-ink-500 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-400">
              Assumes a steady {rate}% annual return with withdrawals at the start of each month — real returns vary
              year to year, so treat this as a planning estimate, not a guarantee. Cumulative withdrawn:{' '}
              {formatCurrencyCompact(result.data.totalWithdrawn)}.
            </div>
          </>
        ) : (
          <CalcError message={result.error} />
        )
      }
    />
  );
}
