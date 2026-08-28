'use client';

import { useEffect, useMemo, useState } from 'react';
import { calculateEmi, yearlyBreakdown } from '@/lib/finance/emi';
import { CalculationError } from '@/lib/finance/shared';
import { formatCurrency, formatCurrencyCompact } from '@/lib/format';
import { CalculatorShell, NumberField, ResultStat, CalcError } from '@/components/calculator/shell';
import { AmortizationTable } from '@/components/calculator/AmortizationTable';
import { DonutChart } from '@/components/charts/DonutChart';
import { StackedBarChart } from '@/components/charts/BarChart';
import { SectionHeading } from '@/components/ui/primitives';
import { useToolAnalytics } from '@/lib/hooks/useToolAnalytics';

export function EmiCalculator() {
  const { calculated } = useToolAnalytics('emi-calculator', 'finance');
  const [amount, setAmount] = useState(2_500_000);
  const [rate, setRate] = useState(8.5);
  const [years, setYears] = useState(20);

  const result = useMemo(() => {
    try {
      return {
        ok: true as const,
        data: calculateEmi({ principal: amount, annualRatePct: rate, tenureMonths: years * 12 }),
      };
    } catch (e) {
      return { ok: false as const, error: e instanceof CalculationError ? e.message : 'Please check your inputs.' };
    }
  }, [amount, rate, years]);

  useEffect(() => {
    if (result.ok) calculated({ amount, rate, years });
  }, [result.ok, amount, rate, years, calculated]);

  return (
    <CalculatorShell
      form={
        <>
          <NumberField label="Loan amount" prefix="₹" value={amount} onChange={setAmount} min={10000} max={100_000_000} step={10000} slider />
          <NumberField label="Interest rate" suffix="% p.a." value={rate} onChange={setRate} min={0} max={30} step={0.05} slider />
          <NumberField label="Loan tenure" suffix="years" value={years} onChange={setYears} min={1} max={40} step={1} slider />
        </>
      }
      results={
        result.ok ? (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <ResultStat label="Monthly EMI" value={formatCurrency(result.data.emi)} emphasis />
              <ResultStat label="Total interest" value={formatCurrency(result.data.totalInterest)} />
              <ResultStat label="Total payment" value={formatCurrency(result.data.totalPayment)} />
            </div>

            <div className="card p-5">
              <SectionHeading as="h3" className="!mb-4 !text-base">
                Principal vs interest
              </SectionHeading>
              <DonutChart
                centerLabel="Total"
                centerValue={formatCurrencyCompact(result.data.totalPayment)}
                formatValue={formatCurrencyCompact}
                segments={[
                  { label: 'Principal', value: result.data.principal, color: '#0d9089' },
                  { label: 'Interest', value: result.data.totalInterest, color: '#f59e0b' },
                ]}
              />
            </div>

            <div className="card p-5">
              <SectionHeading as="h3" className="!mb-4 !text-base">
                Yearly principal &amp; interest
              </SectionHeading>
              <StackedBarChart
                data={yearlyBreakdown(result.data.schedule).map((y) => ({
                  label: `Y${y.year}`,
                  a: y.principal,
                  b: y.interest,
                }))}
                aLabel="Principal"
                bLabel="Interest"
                aColor="#0d9089"
                bColor="#f59e0b"
                formatValue={formatCurrencyCompact}
              />
            </div>

            <div className="card p-5">
              <SectionHeading as="h3" className="!mb-4 !text-base">
                Amortization schedule
              </SectionHeading>
              <AmortizationTable rows={result.data.schedule} />
            </div>
          </>
        ) : (
          <CalcError message={result.error} />
        )
      }
    />
  );
}
