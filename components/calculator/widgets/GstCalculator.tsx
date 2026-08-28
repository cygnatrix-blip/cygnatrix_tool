'use client';

import { useState } from 'react';
import { calculateGst } from '@/lib/finance/gst';
import type { GstMode } from '@/types/finance';
import { formatCurrency } from '@/lib/format';
import { CalculatorShell, NumberField, ResultStat, CalcError, SegmentedControl } from '@/components/calculator/shell';
import { SectionHeading } from '@/components/ui/primitives';
import { useCalc } from '@/lib/hooks/useCalc';

const RATES = [0.25, 3, 5, 12, 18, 28];

export function GstCalculator() {
  const [amount, setAmount] = useState(1000);
  const [rate, setRate] = useState(18);
  const [mode, setMode] = useState<GstMode>('exclusive');
  const [scope, setScope] = useState<'intra' | 'inter'>('intra');

  const result = useCalc(
    'gst-calculator',
    () => calculateGst({ amount, ratePct: rate, mode, interState: scope === 'inter' }),
    [amount, rate, mode, scope],
    () => ({ amount, rate, mode, scope }),
  );

  return (
    <CalculatorShell
      form={
        <>
          <NumberField label="Amount" prefix="₹" value={amount} onChange={setAmount} min={0} max={100_000_000} step={100} slider />
          <SegmentedControl
            label="Calculation type"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'exclusive', label: 'Add GST' },
              { value: 'inclusive', label: 'Remove GST' },
            ]}
          />
          <div className="mb-5">
            <span className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-200">GST rate</span>
            <div className="flex flex-wrap gap-2">
              {RATES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRate(r)}
                  aria-pressed={rate === r}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                    rate === r ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-200 text-ink-600 dark:border-ink-700 dark:text-ink-300'
                  }`}
                >
                  {r}%
                </button>
              ))}
            </div>
          </div>
          <NumberField label="Custom rate" suffix="%" value={rate} onChange={setRate} min={0} max={100} step={0.25} />
          <SegmentedControl
            label="Supply type"
            value={scope}
            onChange={setScope}
            options={[
              { value: 'intra', label: 'Intra-state (CGST+SGST)' },
              { value: 'inter', label: 'Inter-state (IGST)' },
            ]}
          />
        </>
      }
      results={
        result.ok ? (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <ResultStat label="Base amount" value={formatCurrency(result.data.baseAmount)} />
              <ResultStat label="Total GST" value={formatCurrency(result.data.gstAmount)} />
              <ResultStat label="Total amount" value={formatCurrency(result.data.totalAmount)} emphasis />
            </div>
            <div className="card p-5">
              <SectionHeading as="h3" className="!mb-4 !text-base">Tax split</SectionHeading>
              <dl className="space-y-2 text-sm">
                {scope === 'intra' ? (
                  <>
                    <Row label={`CGST (${rate / 2}%)`} value={formatCurrency(result.data.cgst)} />
                    <Row label={`SGST (${rate / 2}%)`} value={formatCurrency(result.data.sgst)} />
                  </>
                ) : (
                  <Row label={`IGST (${rate}%)`} value={formatCurrency(result.data.igst)} />
                )}
                <Row label="Total GST" value={formatCurrency(result.data.gstAmount)} bold />
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

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between border-b border-ink-100 pb-2 last:border-0 dark:border-ink-800 ${bold ? 'font-semibold' : ''}`}>
      <dt className="text-ink-500 dark:text-ink-400">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
