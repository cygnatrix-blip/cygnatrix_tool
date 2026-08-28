'use client';

import { useState } from 'react';
import type { AmortizationRow } from '@/types/finance';
import { formatCurrency } from '@/lib/format';
import { Button } from '@/components/ui/Button';

export function AmortizationTable({ rows }: { rows: AmortizationRow[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? rows : rows.slice(0, 12);

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-ink-200 dark:border-ink-800">
        <table className="w-full min-w-[520px] text-right text-sm tabular-nums">
          <thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-500 dark:bg-ink-900 dark:text-ink-400">
            <tr>
              <th scope="col" className="px-3 py-2 text-left">#</th>
              <th scope="col" className="px-3 py-2">Opening</th>
              <th scope="col" className="px-3 py-2">EMI</th>
              <th scope="col" className="px-3 py-2">Principal</th>
              <th scope="col" className="px-3 py-2">Interest</th>
              <th scope="col" className="px-3 py-2">Closing</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
            {visible.map((row) => (
              <tr key={row.period}>
                <td className="px-3 py-2 text-left font-medium">{row.period}</td>
                <td className="px-3 py-2 text-ink-500">{formatCurrency(row.openingBalance)}</td>
                <td className="px-3 py-2">{formatCurrency(row.payment)}</td>
                <td className="px-3 py-2 text-brand-700 dark:text-brand-400">{formatCurrency(row.principal)}</td>
                <td className="px-3 py-2 text-amber-700 dark:text-amber-400">{formatCurrency(row.interest)}</td>
                <td className="px-3 py-2 text-ink-500">{formatCurrency(row.closingBalance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 12 && (
        <Button variant="ghost" size="sm" className="mt-2" onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Show less' : `Show all ${rows.length} instalments`}
        </Button>
      )}
    </div>
  );
}
