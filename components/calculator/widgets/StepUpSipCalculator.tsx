'use client';

import { calculateSip } from '@/lib/finance/sip';
import { formatCurrency, formatCurrencyCompact } from '@/lib/format';
import { CalculatorShell, NumberField, ResultStat, CalcError } from '@/components/calculator/shell';
import { DonutChart } from '@/components/charts/DonutChart';
import { LineChart } from '@/components/charts/LineChart';
import { SectionHeading } from '@/components/ui/primitives';
import { useCalc } from '@/lib/hooks/useCalc';
import { useShareableState } from '@/lib/hooks/useShareableState';

export function StepUpSipCalculator() {
  const [state, setState] = useShareableState({ monthly: 10_000, rate: 12, years: 15, stepUp: 10 });
  const { monthly, rate, years, stepUp } = state;

  const result = useCalc(
    'step-up-sip-calculator',
    () => {
      const stepped = calculateSip({ monthlyInvestment: monthly, annualReturnPct: rate, years, annualStepUpPct: stepUp });
      const flat = calculateSip({ monthlyInvestment: monthly, annualReturnPct: rate, years, annualStepUpPct: 0 });
      return { stepped, flat };
    },
    [monthly, rate, years, stepUp],
    () => ({ monthly, rate, years, stepUp }),
  );

  return (
    <CalculatorShell
      form={
        <>
          <NumberField label="Starting monthly investment" prefix="₹" value={monthly} onChange={(v) => setState({ monthly: v })} min={500} max={1_000_000} step={500} slider />
          <NumberField label="Expected annual return" suffix="% p.a." value={rate} onChange={(v) => setState({ rate: v })} min={1} max={30} step={0.5} slider />
          <NumberField label="Investment period" suffix="years" value={years} onChange={(v) => setState({ years: v })} min={1} max={40} step={1} slider />
          <NumberField label="Annual step-up" suffix="% / yr" value={stepUp} onChange={(v) => setState({ stepUp: v })} min={0} max={50} step={1} slider help="How much you'll raise the monthly investment each year, e.g. with a salary hike." />
        </>
      }
      results={
        result.ok ? (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <ResultStat label="Total invested" value={formatCurrency(result.data.stepped.invested)} />
              <ResultStat label="Est. returns" value={formatCurrency(result.data.stepped.estimatedReturns)} />
              <ResultStat label="Est. final value" value={formatCurrency(result.data.stepped.futureValue)} emphasis />
            </div>

            <div className="rounded-xl border border-brand-300 bg-brand-50 p-4 text-sm dark:border-brand-800 dark:bg-brand-950/40">
              <p className="font-semibold text-brand-800 dark:text-brand-200">
                Stepping up {stepUp}% a year grows your final value to {formatCurrency(result.data.stepped.futureValue)}
                {' — '}
                {formatCurrency(result.data.stepped.futureValue - result.data.flat.futureValue)} more than a flat SIP of the
                same starting amount.
              </p>
            </div>

            <div className="card p-5">
              <SectionHeading as="h3" className="!mb-4 !text-base">Invested vs returns</SectionHeading>
              <DonutChart
                centerLabel="Value"
                centerValue={formatCurrencyCompact(result.data.stepped.futureValue)}
                formatValue={formatCurrencyCompact}
                segments={[
                  { label: 'Invested', value: result.data.stepped.invested, color: '#0d9089' },
                  { label: 'Returns', value: result.data.stepped.estimatedReturns, color: '#77e7db' },
                ]}
              />
            </div>

            <div className="card p-5">
              <SectionHeading as="h3" className="!mb-4 !text-base">Step-up SIP vs flat SIP</SectionHeading>
              <LineChart
                xLabels={result.data.stepped.yearly.map((y) => `Y${y.year}`)}
                series={[
                  { label: 'Step-up SIP', color: '#0d9089', points: result.data.stepped.yearly.map((y) => y.value) },
                  { label: 'Flat SIP', color: '#94a3b8', points: result.data.flat.yearly.map((y) => y.value) },
                ]}
              />
            </div>
          </>
        ) : (
          <CalcError message={result.error} />
        )
      }
    />
  );
}

