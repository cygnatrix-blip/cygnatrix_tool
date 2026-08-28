'use client';

import { useState } from 'react';
import { calculateSip } from '@/lib/finance/sip';
import { formatCurrency, formatCurrencyCompact } from '@/lib/format';
import { CalculatorShell, NumberField, ResultStat, CalcError, SegmentedControl } from '@/components/calculator/shell';
import { DonutChart } from '@/components/charts/DonutChart';
import { LineChart } from '@/components/charts/LineChart';
import { StackedBarChart } from '@/components/charts/BarChart';
import { SectionHeading } from '@/components/ui/primitives';
import { useCalc } from '@/lib/hooks/useCalc';

export function SipCalculator() {
  const [monthly, setMonthly] = useState(10_000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(10);
  const [stepUp, setStepUp] = useState<'0' | '5' | '10'>('0');

  const result = useCalc(
    'sip-calculator',
    () => calculateSip({ monthlyInvestment: monthly, annualReturnPct: rate, years, annualStepUpPct: Number(stepUp) }),
    [monthly, rate, years, stepUp],
    () => ({ monthly, rate, years, stepUp }),
  );

  return (
    <CalculatorShell
      form={
        <>
          <NumberField label="Monthly investment" prefix="₹" value={monthly} onChange={setMonthly} min={100} max={1_000_000} step={500} slider />
          <NumberField label="Expected annual return" suffix="% p.a." value={rate} onChange={setRate} min={1} max={30} step={0.5} slider />
          <NumberField label="Investment period" suffix="years" value={years} onChange={setYears} min={1} max={40} step={1} slider />
          <SegmentedControl
            label="Annual step-up"
            value={stepUp}
            onChange={setStepUp}
            options={[
              { value: '0', label: 'None' },
              { value: '5', label: '5% / yr' },
              { value: '10', label: '10% / yr' },
            ]}
          />
        </>
      }
      results={
        result.ok ? (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <ResultStat label="Invested" value={formatCurrency(result.data.invested)} />
              <ResultStat label="Est. returns" value={formatCurrency(result.data.estimatedReturns)} />
              <ResultStat label="Est. final value" value={formatCurrency(result.data.futureValue)} emphasis />
            </div>

            <div className="card p-5">
              <SectionHeading as="h3" className="!mb-4 !text-base">Invested vs returns</SectionHeading>
              <DonutChart
                centerLabel="Value"
                centerValue={formatCurrencyCompact(result.data.futureValue)}
                formatValue={formatCurrencyCompact}
                segments={[
                  { label: 'Invested', value: result.data.invested, color: '#0d9089' },
                  { label: 'Returns', value: result.data.estimatedReturns, color: '#77e7db' },
                ]}
              />
            </div>

            <div className="card p-5">
              <SectionHeading as="h3" className="!mb-4 !text-base">Growth over time</SectionHeading>
              <LineChart
                xLabels={result.data.yearly.map((y) => `Y${y.year}`)}
                series={[
                  { label: 'Value', color: '#0d9089', points: result.data.yearly.map((y) => y.value) },
                  { label: 'Invested', color: '#94a3b8', points: result.data.yearly.map((y) => y.invested) },
                ]}
              />
            </div>

            <div className="card p-5">
              <SectionHeading as="h3" className="!mb-4 !text-base">Yearly breakdown</SectionHeading>
              <StackedBarChart
                data={result.data.yearly.map((y) => ({ label: `Y${y.year}`, a: y.invested, b: y.gain }))}
                aLabel="Invested"
                bLabel="Gain"
                formatValue={formatCurrencyCompact}
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
