'use client';

import type { FinancialYear } from '@/config/india-payroll';
import { calculateIncomeTax } from '@/lib/finance/income-tax';
import { formatCurrency, formatCurrencyCompact } from '@/lib/format';
import { CalculatorShell, NumberField, ResultStat, CalcError, SegmentedControl } from '@/components/calculator/shell';
import { DonutChart } from '@/components/charts/DonutChart';
import { SectionHeading } from '@/components/ui/primitives';
import { useCalc } from '@/lib/hooks/useCalc';
import { useShareableState } from '@/lib/hooks/useShareableState';
import { cn } from '@/lib/cn';

export function IncomeTaxCalculator() {
  const [state, setState] = useShareableState({
    income: 1_275_000,
    deductions: 150_000,
    fy: '2025-26' as FinancialYear,
  });
  const { income, deductions, fy } = state;

  const result = useCalc(
    'income-tax-calculator',
    () => calculateIncomeTax({ annualIncome: income, oldRegimeDeductions: deductions, financialYear: fy }),
    [income, deductions, fy],
    () => ({ income, deductions, fy }),
  );

  return (
    <CalculatorShell
      form={
        <>
          <SegmentedControl
            label="Financial year"
            value={fy}
            onChange={(v) => setState({ fy: v })}
            options={[
              { value: '2025-26', label: 'FY 2025-26' },
              { value: '2024-25', label: 'FY 2024-25' },
            ]}
          />
          <NumberField
            label="Annual income"
            prefix="₹"
            value={income}
            onChange={(v) => setState({ income: v })}
            min={0}
            max={100_000_000}
            step={25_000}
            slider
          />
          <NumberField
            label="Old regime deductions"
            help="80C, 80D, home loan interest, HRA exemption etc. combined — ignored under the new regime."
            prefix="₹"
            value={deductions}
            onChange={(v) => setState({ deductions: v })}
            min={0}
            max={income || 100_000_000}
            step={10_000}
            slider
          />
        </>
      }
      results={
        result.ok ? (
          <>
            <div className="rounded-xl border border-brand-300 bg-brand-50 p-4 text-sm dark:border-brand-800 dark:bg-brand-950/40">
              {result.data.betterRegime === 'equal' ? (
                <p className="font-semibold text-brand-800 dark:text-brand-200">
                  Both regimes result in the same tax for FY {result.data.financialYear}.
                </p>
              ) : (
                <p className="font-semibold text-brand-800 dark:text-brand-200">
                  For FY {result.data.financialYear}, the {result.data.betterRegime} regime saves you{' '}
                  {formatCurrency(result.data.annualSavings)} a year.
                </p>
              )}
              {result.data.new.incomeTax === 0 && result.data.new.taxableIncome > 0 && (
                <p className="mt-1 text-xs text-brand-700 dark:text-brand-300">
                  New regime tax is nil here — the Section 87A rebate covers taxable income up to{' '}
                  {fy === '2025-26' ? '₹12,00,000' : '₹7,00,000'}.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <RegimeCard title="Old regime" data={result.data.old} highlighted={result.data.betterRegime === 'old'} />
              <RegimeCard title="New regime" data={result.data.new} highlighted={result.data.betterRegime === 'new'} />
            </div>

            <div className="card p-5">
              <SectionHeading as="h3" className="!mb-4 !text-base">Old vs new: tax paid</SectionHeading>
              <DonutChart
                centerLabel="Higher tax"
                centerValue={formatCurrencyCompact(Math.max(result.data.old.incomeTax, result.data.new.incomeTax))}
                formatValue={formatCurrencyCompact}
                segments={[
                  { label: 'Old regime tax', value: result.data.old.incomeTax, color: '#f59e0b' },
                  { label: 'New regime tax', value: result.data.new.incomeTax, color: '#0d9089' },
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

function RegimeCard({
  title,
  data,
  highlighted,
}: {
  title: string;
  data: ReturnType<typeof calculateIncomeTax>['old'];
  highlighted: boolean;
}) {
  return (
    <div
      className={cn(
        'card space-y-3 p-5',
        highlighted && 'border-brand-300 ring-1 ring-brand-300 dark:border-brand-700 dark:ring-brand-700',
      )}
    >
      <div className="flex items-center justify-between">
        <SectionHeading as="h3" className="!mb-0 !text-base">{title}</SectionHeading>
        {highlighted && (
          <span className="rounded-full bg-brand-600 px-2.5 py-0.5 text-xs font-semibold text-white">Better</span>
        )}
      </div>
      <ResultStat label="Income tax (with cess)" value={formatCurrency(data.incomeTax)} emphasis />
      <dl className="space-y-1.5 text-sm">
        <Row label="Standard deduction" value={formatCurrency(data.standardDeduction)} />
        <Row label="Other deductions" value={formatCurrency(data.otherDeductions)} />
        <Row label="Taxable income" value={formatCurrency(data.taxableIncome)} />
        <Row label="Effective rate" value={`${data.effectiveRatePct.toFixed(2)}%`} />
        <Row label="In-hand (annual)" value={formatCurrency(data.inHandAnnual)} />
      </dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-ink-100 pb-1.5 last:border-0 dark:border-ink-800">
      <dt className="text-ink-500 dark:text-ink-400">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
