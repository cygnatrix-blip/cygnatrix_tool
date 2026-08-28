'use client';

import { useState } from 'react';
import { calculateFd } from '@/lib/finance/fd';
import type { CompoundingFrequency } from '@/types/finance';
import { formatCurrency, formatCurrencyCompact } from '@/lib/format';
import { CalculatorShell, NumberField, ResultStat, CalcError, SegmentedControl } from '@/components/calculator/shell';
import { DonutChart } from '@/components/charts/DonutChart';
import { SectionHeading } from '@/components/ui/primitives';
import { useCalc } from '@/lib/hooks/useCalc';

export function FdCalculator() {
  const [principal, setPrincipal] = useState(100_000);
  const [rate, setRate] = useState(7);
  const [months, setMonths] = useState(60);
  const [freq, setFreq] = useState<'1' | '2' | '4' | '12'>('4');

  const result = useCalc(
    'fd-calculator',
    () =>
      calculateFd({
        principal,
        annualRatePct: rate,
        tenureMonths: months,
        compounding: Number(freq) as CompoundingFrequency,
      }),
    [principal, rate, months, freq],
    () => ({ principal, rate, months, freq }),
  );

  return (
    <CalculatorShell
      form={
        <>
          <NumberField label="Principal" prefix="₹" value={principal} onChange={setPrincipal} min={1000} max={100_000_000} step={1000} slider />
          <NumberField label="Interest rate" suffix="% p.a." value={rate} onChange={setRate} min={0} max={15} step={0.05} slider />
          <NumberField label="Tenure" suffix="months" value={months} onChange={setMonths} min={1} max={240} step={1} slider />
          <SegmentedControl
            label="Compounding"
            value={freq}
            onChange={setFreq}
            options={[
              { value: '12', label: 'Monthly' },
              { value: '4', label: 'Quarterly' },
              { value: '2', label: 'Half-yearly' },
              { value: '1', label: 'Yearly' },
            ]}
          />
        </>
      }
      results={
        result.ok ? (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ResultStat label="Maturity value" value={formatCurrency(result.data.maturityValue)} emphasis />
              <ResultStat label="Interest earned" value={formatCurrency(result.data.interestEarned)} />
            </div>
            <div className="card p-5">
              <SectionHeading as="h3" className="!mb-4 !text-base">Principal vs interest</SectionHeading>
              <DonutChart
                centerLabel="Maturity"
                centerValue={formatCurrencyCompact(result.data.maturityValue)}
                formatValue={formatCurrencyCompact}
                segments={[
                  { label: 'Principal', value: result.data.principal, color: '#0d9089' },
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
