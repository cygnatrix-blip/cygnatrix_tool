'use client';

import { useId } from 'react';
import { cn } from '@/lib/cn';

export function CalculatorShell({
  form,
  results,
}: {
  form: React.ReactNode;
  results: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:items-start">
      {/* Inputs stay in view while the results, charts and schedule scroll. */}
      <div className="card p-5 sm:p-6 lg:sticky lg:top-20 [&>*:last-child]:mb-0">{form}</div>
      <div className="min-w-0 space-y-4">{results}</div>
    </div>
  );
}

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  slider?: boolean;
  help?: string;
}

export function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  prefix,
  suffix,
  slider = false,
  help,
}: NumberFieldProps) {
  const id = useId();
  return (
    <div className="mb-5">
      <label htmlFor={id} className="mb-1.5 flex items-center justify-between text-sm font-medium text-ink-700 dark:text-ink-200">
        <span>{label}</span>
      </label>
      <div className="flex items-center rounded-xl border border-ink-200 bg-white focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 dark:border-ink-700 dark:bg-ink-950">
        {prefix && <span className="pl-3 text-sm text-ink-400">{prefix}</span>}
        <input
          id={id}
          type="number"
          inputMode="decimal"
          value={Number.isFinite(value) ? value : ''}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(e.target.value === '' ? Number.NaN : Number(e.target.value))}
          className="w-full bg-transparent px-3 py-2.5 text-sm tabular-nums outline-none"
        />
        {suffix && <span className="pr-3 text-sm text-ink-400">{suffix}</span>}
      </div>
      {slider && max !== undefined && (
        <input
          type="range"
          aria-label={`${label} slider`}
          min={min}
          max={max}
          step={step}
          value={Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min}
          onChange={(e) => onChange(Number(e.target.value))}
          className="mt-2 w-full accent-brand-600"
        />
      )}
      {help && <p className="mt-1 text-xs text-ink-400">{help}</p>}
    </div>
  );
}

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="mb-5">
      <span className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-200">{label}</span>
      <div className="flex rounded-xl border border-ink-200 p-1 dark:border-ink-700" role="group" aria-label={label}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            aria-pressed={value === opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition',
              value === opt.value
                ? 'bg-brand-600 text-white'
                : 'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ResultStat({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border p-4',
        emphasis
          ? 'border-brand-300 bg-brand-50 dark:border-brand-800 dark:bg-brand-950/40'
          : 'border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-900',
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-ink-400">{label}</p>
      <p
        className={cn(
          'mt-1 font-bold tabular-nums',
          emphasis ? 'text-2xl text-brand-700 dark:text-brand-300' : 'text-xl text-ink-900 dark:text-white',
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function CalcError({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
      {message}
    </div>
  );
}
