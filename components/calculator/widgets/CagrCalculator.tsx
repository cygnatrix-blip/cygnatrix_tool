'use client';

import { useState } from 'react';
import { calculateCagr } from '@/lib/finance/cagr';
import { formatCurrency, formatPercent } from '@/lib/format';
import { CalculatorShell, NumberField, ResultStat, CalcError } from '@/components/calculator/shell';
import { useCalc } from '@/lib/hooks/useCalc';

export function CagrCalculator() {
  const [initial, setInitial] = useState(100_000);
  const [final, setFinal] = useState(200_000);
  const [years, setYears] = useState(5);

  const result = useCalc(
    'cagr-calculator',
    () => calculateCagr({ initialValue: initial, finalValue: final, years }),
    [initial, final, years],
    () => ({ initial, final, years }),
  );

  return (
    <CalculatorShell
      form={
        <>
          <NumberField label="Initial value" prefix="₹" value={initial} onChange={setInitial} min={1} max={1_000_000_000} step={1000} slider />
          <NumberField label="Final value" prefix="₹" value={final} onChange={setFinal} min={0} max={1_000_000_000} step={1000} slider />
          <NumberField label="Investment period" suffix="years" value={years} onChange={setYears} min={0.5} max={50} step={0.5} slider />
        </>
      }
      results={
        result.ok ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <ResultStat label="CAGR" value={formatPercent(result.data.cagrPct)} emphasis />
            <ResultStat label="Absolute return" value={formatPercent(result.data.absoluteReturnPct)} />
            <ResultStat label="Growth multiple" value={`${result.data.multiple}×`} />
            <div className="sm:col-span-3">
              <ResultStat
                label="Gain"
                value={formatCurrency(final - initial)}
              />
            </div>
          </div>
        ) : (
          <CalcError message={result.error} />
        )
      }
    />
  );
}
