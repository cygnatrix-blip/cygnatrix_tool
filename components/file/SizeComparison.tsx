'use client';

import { formatBytes, percentReduction } from '@/lib/format';

export function SizeComparison({ original, updated }: { original: number; updated: number }) {
  const reduction = percentReduction(original, updated);
  const grew = updated > original;
  return (
    <div className="grid grid-cols-3 gap-2 rounded-xl border border-ink-200 p-3 text-center text-sm dark:border-ink-800">
      <div>
        <p className="text-xs text-ink-400">Original</p>
        <p className="font-semibold tabular-nums">{formatBytes(original)}</p>
      </div>
      <div>
        <p className="text-xs text-ink-400">New</p>
        <p className="font-semibold tabular-nums">{formatBytes(updated)}</p>
      </div>
      <div>
        <p className="text-xs text-ink-400">{grew ? 'Change' : 'Saved'}</p>
        <p className={grew ? 'font-semibold text-amber-600' : 'font-semibold text-brand-600'}>
          {grew ? `+${percentReduction(updated, original)}%` : `−${reduction}%`}
        </p>
      </div>
    </div>
  );
}
