'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/primitives';

export function ProgressIndicator({ value, label }: { value: number; label?: string }) {
  const pct = Math.round(Math.min(100, Math.max(0, value)));
  return (
    <div className="mt-4" role="status" aria-live="polite">
      <div className="mb-1 flex justify-between text-xs text-ink-500">
        <span>{label ?? 'Processing…'}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
        <div className="h-full rounded-full bg-brand-600 transition-[width] duration-200" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function ProcessButton({
  onClick,
  busy,
  disabled,
  children,
}: {
  onClick: () => void;
  busy: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Button onClick={onClick} disabled={disabled || busy} size="lg" className="mt-4 w-full sm:w-auto">
      {busy && <Spinner />}
      {children}
    </Button>
  );
}

export function DownloadButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button onClick={onClick} size="lg" variant="primary" className="w-full sm:w-auto">
      <Download className="h-4 w-4" aria-hidden="true" />
      {children}
    </Button>
  );
}
