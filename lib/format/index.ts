/** Display formatters. Never used inside the calculation layer — display only. */

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const INR_PAISE = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const NUM_IN = new Intl.NumberFormat('en-IN');

export function formatCurrency(value: number, withPaise = false): string {
  if (!Number.isFinite(value)) return '—';
  return (withPaise ? INR_PAISE : INR).format(value);
}

/** Compact Indian style: ₹1.2 Cr, ₹45.0 L, ₹8,000. */
export function formatCurrencyCompact(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(2)} L`;
  return formatCurrency(value);
}

export function formatNumber(value: number, dp = 0): string {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  }).format(value);
}

export function formatPercent(value: number, dp = 2): string {
  if (!Number.isFinite(value)) return '—';
  return `${NUM_IN.format(Number(value.toFixed(dp)))}%`;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const val = bytes / 1024 ** i;
  return `${val.toFixed(i === 0 ? 0 : val >= 100 ? 0 : 1)} ${units[i]}`;
}

export function percentReduction(originalBytes: number, newBytes: number): number {
  if (originalBytes <= 0) return 0;
  return Math.max(0, Math.round((1 - newBytes / originalBytes) * 100));
}

export function formatDateHuman(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}
