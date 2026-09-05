'use client';

import { calculateHraExemption } from '@/lib/finance/hra';
import { formatCurrency } from '@/lib/format';
import { CalculatorShell, NumberField, ResultStat, CalcError, SegmentedControl } from '@/components/calculator/shell';
import { useCalc } from '@/lib/hooks/useCalc';
import { useShareableState } from '@/lib/hooks/useShareableState';

const LIMITING_LABEL = {
  actualHra: 'Actual HRA received',
  rentMinusTenPct: 'Rent paid minus 10% of basic',
  salaryPct: '% of basic salary',
} as const;

export function HraCalculator() {
  const [state, setState] = useShareableState({
    basic: 600_000,
    hra: 300_000,
    rent: 240_000,
    metro: 'yes' as 'yes' | 'no',
  });
  const { basic, hra, rent, metro } = state;

  const result = useCalc(
    'hra-exemption-calculator',
    () =>
      calculateHraExemption({
        basicPlusDaAnnual: basic,
        hraReceivedAnnual: hra,
        rentPaidAnnual: rent,
        isMetro: metro === 'yes',
      }),
    [basic, hra, rent, metro],
    () => ({ metro }),
  );

  return (
    <CalculatorShell
      form={
        <>
          <NumberField label="Basic + DA (annual)" prefix="₹" value={basic} onChange={(v) => setState({ basic: v })} min={0} max={100_000_000} step={10_000} slider />
          <NumberField label="HRA received (annual)" prefix="₹" value={hra} onChange={(v) => setState({ hra: v })} min={0} max={100_000_000} step={10_000} slider />
          <NumberField label="Rent paid (annual)" prefix="₹" value={rent} onChange={(v) => setState({ rent: v })} min={0} max={100_000_000} step={10_000} slider />
          <SegmentedControl
            label="City"
            value={metro}
            onChange={(v) => setState({ metro: v })}
            options={[
              { value: 'yes', label: 'Metro (Delhi, Mumbai, Kolkata, Chennai)' },
              { value: 'no', label: 'Non-metro' },
            ]}
          />
        </>
      }
      results={
        result.ok ? (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ResultStat label="HRA exempt from tax" value={formatCurrency(result.data.exemptAnnual)} emphasis />
              <ResultStat label="Taxable HRA" value={formatCurrency(result.data.taxableHraAnnual)} />
            </div>

            <div className="card space-y-3 p-5">
              <p className="text-sm font-medium text-ink-700 dark:text-ink-200">
                The least of these three is exempt — in your case, {LIMITING_LABEL[result.data.limitingFactor]}.
              </p>
              <dl className="space-y-1.5 text-sm">
                <Row label="Actual HRA received" value={formatCurrency(result.data.breakdown.actualHra)} highlighted={result.data.limitingFactor === 'actualHra'} />
                <Row label="Rent paid − 10% of basic" value={formatCurrency(result.data.breakdown.rentMinusTenPct)} highlighted={result.data.limitingFactor === 'rentMinusTenPct'} />
                <Row label={`${metro === 'yes' ? '50' : '40'}% of basic`} value={formatCurrency(result.data.breakdown.salaryPct)} highlighted={result.data.limitingFactor === 'salaryPct'} />
              </dl>
            </div>
          </>
        ) : (
          <CalcError message={result.error} />
        )
      }
    />
  );
}

function Row({ label, value, highlighted }: { label: string; value: string; highlighted: boolean }) {
  return (
    <div
      className={`flex justify-between rounded-lg px-2 py-1.5 ${highlighted ? 'bg-brand-50 font-semibold text-brand-800 dark:bg-brand-950/40 dark:text-brand-200' : ''}`}
    >
      <dt className={highlighted ? '' : 'text-ink-500 dark:text-ink-400'}>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
