'use client';

import { useState } from 'react';
import { calculateRd } from '@/lib/finance/rd';
import { formatCurrency, formatCurrencyCompact } from '@/lib/format';
import { CalculatorShell, NumberField, ResultStat, CalcError } from '@/components/calculator/shell';
import { DonutChart } from '@/components/charts/DonutChart';
import { SectionHeading } from '@/components/ui/primitives';
import { useCalc } from '@/lib/hooks/useCalc';

export function RdCalculator() {
  const [deposit, setDeposit] = useState(5_000);
  const [rate, setRate] = useState(7);
  const [months, setMonths] = useState(24);

  const result = useCalc(
    'rd-calculator',
    () => calculateRd({ monthlyDeposit: deposit, annualRatePct: rate, tenureMonths: months }),
    [deposit, rate, months],
    () => ({ deposit, rate, months }),
  );

  return (
    <CalculatorShell
      form={
        <>
          <NumberField label="Monthly deposit" prefix="₹" value={deposit} onChange={setDeposit} min={100} max={1_000_000} step={500} slider />
          <NumberField label="Interest rate" suffix="% p.a." value={rate} onChange={setRate} min={0} max={15} step={0.05} slider />
          <NumberField label="Tenure" suffix="months" value={months} onChange={setMonths} min={6} max={120} step={1} slider />
        </>
      }
      results={
        result.ok ? (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <ResultStat label="Total deposited" value={formatCurrency(result.data.totalDeposited)} />
              <ResultStat label="Interest earned" value={formatCurrency(result.data.interestEarned)} />
              <ResultStat label="Maturity value" value={formatCurrency(result.data.maturityValue)} emphasis />
            </div>
            <div className="card p-5">
              <SectionHeading as="h3" className="!mb-4 !text-base">Deposits vs interest</SectionHeading>
              <DonutChart
                centerLabel="Maturity"
                centerValue={formatCurrencyCompact(result.data.maturityValue)}
                formatValue={formatCurrencyCompact}
                segments={[
                  { label: 'Deposited', value: result.data.totalDeposited, color: '#0d9089' },
                  { label: 'Interest', value: result.data.interestEarned, color: '#77e7db' },
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
