'use client';

import { calculateGratuity } from '@/lib/finance/gratuity';
import { formatCurrency } from '@/lib/format';
import { CalculatorShell, NumberField, ResultStat, CalcError, SegmentedControl } from '@/components/calculator/shell';
import { useCalc } from '@/lib/hooks/useCalc';
import { useShareableState } from '@/lib/hooks/useShareableState';

export function GratuityCalculator() {
  const [state, setState] = useShareableState({
    salary: 50_000,
    years: 10,
    covered: 'yes' as 'yes' | 'no',
  });
  const { salary, years, covered } = state;

  const result = useCalc(
    'gratuity-calculator',
    () => calculateGratuity({ lastDrawnMonthlySalary: salary, yearsOfService: years, coveredUnderAct: covered === 'yes' }),
    [salary, years, covered],
    () => ({ years, covered }),
  );

  return (
    <CalculatorShell
      form={
        <>
          <NumberField label="Last drawn monthly salary" help="Basic + DA" prefix="₹" value={salary} onChange={(v) => setState({ salary: v })} min={0} max={10_000_000} step={1_000} slider />
          <NumberField label="Years of service" suffix="years" value={years} onChange={(v) => setState({ years: v })} min={0} max={50} step={0.5} slider />
          <SegmentedControl
            label="Employer covered under the Gratuity Act"
            value={covered}
            onChange={(v) => setState({ covered: v })}
            options={[
              { value: 'yes', label: 'Yes (most employers)' },
              { value: 'no', label: 'No' },
            ]}
          />
        </>
      }
      results={
        result.ok ? (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ResultStat label="Gratuity payable" value={formatCurrency(result.data.gratuityPayable)} emphasis />
              <ResultStat label="Years used in formula" value={`${result.data.yearsUsedInFormula} years`} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ResultStat label="Tax-exempt amount" value={formatCurrency(result.data.taxExemptAmount)} />
              <ResultStat label="Taxable amount" value={formatCurrency(result.data.taxableAmount)} />
            </div>
            <div className="rounded-xl border border-ink-200 bg-ink-50/60 p-4 text-xs leading-6 text-ink-500 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-400">
              The statutory tax exemption limit under Section 10(10) is currently{' '}
              {formatCurrency(result.data.statutoryExemptionLimit)}. Any gratuity above this is added to your taxable
              income.
            </div>
          </>
        ) : (
          <CalcError message={result.error} />
        )
      }
    />
  );
}
