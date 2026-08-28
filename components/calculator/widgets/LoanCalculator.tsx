'use client';

import { useState } from 'react';
import { calculateLoan } from '@/lib/finance/loan';
import { yearlyBreakdown } from '@/lib/finance/emi';
import { formatCurrency, formatCurrencyCompact } from '@/lib/format';
import { CalculatorShell, NumberField, ResultStat, CalcError } from '@/components/calculator/shell';
import { AmortizationTable } from '@/components/calculator/AmortizationTable';
import { DonutChart } from '@/components/charts/DonutChart';
import { StackedBarChart } from '@/components/charts/BarChart';
import { SectionHeading } from '@/components/ui/primitives';
import { useCalc } from '@/lib/hooks/useCalc';

export function LoanCalculator() {
  const [amount, setAmount] = useState(800_000);
  const [rate, setRate] = useState(11);
  const [months, setMonths] = useState(60);

  const result = useCalc(
    'loan-calculator',
    () => calculateLoan({ principal: amount, annualRatePct: rate, tenureMonths: months }),
    [amount, rate, months],
    () => ({ amount, rate, months }),
  );

  return (
    <CalculatorShell
      form={
        <>
          <NumberField label="Loan amount" prefix="₹" value={amount} onChange={setAmount} min={10000} max={100_000_000} step={10000} slider />
          <NumberField label="Interest rate" suffix="% p.a." value={rate} onChange={setRate} min={0} max={36} step={0.05} slider />
          <NumberField label="Tenure" suffix="months" value={months} onChange={setMonths} min={1} max={480} step={1} slider />
        </>
      }
      results={
        result.ok ? (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <ResultStat label="Monthly EMI" value={formatCurrency(result.data.emi)} emphasis />
              <ResultStat label="Total interest" value={formatCurrency(result.data.totalInterest)} />
              <ResultStat label="Total repayment" value={formatCurrency(result.data.totalPayment)} />
            </div>
            <div className="card p-5">
              <SectionHeading as="h3" className="!mb-4 !text-base">Cost of the loan</SectionHeading>
              <DonutChart
                centerLabel="Repayment"
                centerValue={formatCurrencyCompact(result.data.totalPayment)}
                formatValue={formatCurrencyCompact}
                segments={[
                  { label: 'Principal', value: result.data.principal, color: '#0d9089' },
                  { label: 'Interest', value: result.data.totalInterest, color: '#f59e0b' },
                ]}
              />
            </div>
            <div className="card p-5">
              <SectionHeading as="h3" className="!mb-4 !text-base">Yearly principal &amp; interest</SectionHeading>
              <StackedBarChart
                data={yearlyBreakdown(result.data.schedule).map((y) => ({ label: `Y${y.year}`, a: y.principal, b: y.interest }))}
                aLabel="Principal"
                bLabel="Interest"
                aColor="#0d9089"
                bColor="#f59e0b"
                formatValue={formatCurrencyCompact}
              />
            </div>
            <div className="card p-5">
              <SectionHeading as="h3" className="!mb-4 !text-base">Amortization schedule</SectionHeading>
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
