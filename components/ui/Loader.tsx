import { cn } from '@/lib/cn';

/**
 * Brand loader — the Cygnatrix swan mark inside a spinning ring.
 * `inline` for buttons/sections, `page` for full route fallbacks.
 */
export function Loader({
  size = 'inline',
  label = 'Loading…',
  className,
}: {
  size?: 'inline' | 'page';
  label?: string;
  className?: string;
}) {
  const px = size === 'page' ? 56 : 24;
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn('inline-flex items-center justify-center', className)}
      style={{ width: px, height: px }}
    >
      <span className="relative inline-flex" style={{ width: px, height: px }}>
        <svg
          className="absolute inset-0 animate-spin text-brand-500 [animation-duration:0.9s]"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2.5" />
          <path
            d="M22 12a10 10 0 0 0-10-10"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
        {/* swan mark */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/logo-mark.svg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 m-auto animate-pulse"
          style={{ width: px * 0.58, height: px * 0.58 }}
        />
      </span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** Centered full-height loader for route-level Suspense fallbacks. */
export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <Loader size="page" label={label} />
      <p className="text-sm text-ink-400">{label}</p>
    </div>
  );
}
