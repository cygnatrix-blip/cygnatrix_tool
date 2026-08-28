'use client';

import { useState } from 'react';
import { calculateSalary } from '@/lib/finance/salary';
import { formatCurrency, formatCurrencyCompact } from '@/lib/format';
import { CalculatorShell, NumberField, ResultStat, CalcError, SegmentedControl } from '@/components/calculator/shell';
import { DonutChart } from '@/components/charts/DonutChart';
import { SectionHeading } from '@/components/ui/primitives';
import { useCalc } from '@/lib/hooks/useCalc';

export function SalaryCalculator() {
  const [ctc, setCtc] = useState(1_200_000);
  const [basicPct, setBasicPct] = useState(40);
  const [hraPct, setHraPct] = useState(50);
  const [ptMonthly, setPtMonthly] = useState(200);
  const [regime, setRegime] = useState<'new' | 'old'>('new');
  const [pf, setPf] = useState<'on' | 'off'>('on');

  const result = useCalc(
    'salary-calculator',
    () =>
      calculateSalary({
        ctcAnnual: ctc,
        basicPctOfCtc: basicPct,
        hraPctOfBasic: hraPct,
        monthlyProfessionalTax: ptMonthly,
        regime,
        employeePfEnabled: pf === 'on',
      }),
    [ctc, basicPct, hraPct, ptMonthly, regime, pf],
    () => ({ ctc, basicPct, hraPct, regime, pf }),
  );

  return (
    <CalculatorShell
      form={
        <>
          <NumberField label="Annual CTC" prefix="₹" value={ctc} onChange={setCtc} min={100_000} max={100_000_000} step={50_000} slider />
          <NumberField label="Basic (% of CTC)" suffix="%" value={basicPct} onChange={setBasicPct} min={20} max={60} step={1} slider />
          <NumberField label="HRA (% of basic)" suffix="%" value={hraPct} onChange={setHraPct} min={0} max={100} step={1} slider />
          <NumberField label="Professional tax / month" prefix="₹" value={ptMonthly} onChange={setPtMonthly} min={0} max={250} step={10} />
          <SegmentedControl
            label="Tax regime"
            value={regime}
            onChange={setRegime}
            options={[
              { value: 'new', label: 'New' },
              { value: 'old', label: 'Old' },
            ]}
          />
          <SegmentedControl
            label="Provident Fund"
            value={pf}
            onChange={setPf}
            options={[
              { value: 'on', label: 'Applicable' },
              { value: 'off', label: 'Not applicable' },
            ]}
          />
        </>
      }
      results={
        result.ok ? (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ResultStat label="In-hand / month" value={formatCurrency(result.data.inHandMonthly)} emphasis />
              <ResultStat label="In-hand / year" value={formatCurrency(result.data.inHandAnnual)} />
              <ResultStat label="Gross / year" value={formatCurrency(result.data.grossAnnual)} />
              <ResultStat label="Total deductions / year" value={formatCurrency(result.data.totalDeductionsAnnual)} />
            </div>

            <div className="card p-5">
              <SectionHeading as="h3" className="!mb-4 !text-base">CTC breakup</SectionHeading>
              <DonutChart
                centerLabel="CTC"
                centerValue={formatCurrencyCompact(result.data.ctcAnnual)}
                formatValue={formatCurrencyCompact}
                segments={[
                  { label: 'Basic', value: result.data.basicAnnual, color: '#0d9089' },
                  { label: 'HRA', value: result.data.hraAnnual, color: '#3ad2c6' },
                  { label: 'Special allowance', value: result.data.specialAllowanceAnnual, color: '#aef3ea' },
                  { label: 'Employer PF', value: result.data.employerPfAnnual, color: '#94a3b8' },
                ]}
              />
            </div>

            <div className="card p-5">
              <SectionHeading as="h3" className="!mb-4 !text-base">Annual deductions</SectionHeading>
              <dl className="space-y-2 text-sm">
                <Row label="Employee PF" value={formatCurrency(result.data.employeePfAnnual)} />
                <Row label="Professional tax" value={formatCurrency(result.data.professionalTaxAnnual)} />
                <Row label="Income tax (est.)" value={formatCurrency(result.data.incomeTaxAnnual)} />
                <Row label="Total" value={formatCurrency(result.data.totalDeductionsAnnual)} bold />
              </dl>
            </div>

            <div className="rounded-xl border border-ink-200 bg-ink-50/60 p-4 text-xs leading-6 text-ink-500 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-400">
              <p className="mb-1 font-semibold text-ink-600 dark:text-ink-300">Assumptions</p>
              <ul className="list-disc space-y-0.5 pl-4">
                {result.data.assumptions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <CalcError message={result.error} />
        )
      }
    />
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between border-b border-ink-100 pb-2 last:border-0 dark:border-ink-800 ${bold ? 'font-semibold' : ''}`}>
      <dt className="text-ink-500 dark:text-ink-400">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
