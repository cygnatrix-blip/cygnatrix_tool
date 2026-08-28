import Link from 'next/link';
import { cn } from '@/lib/cn';
import { BRAND } from '@/config/site';

/**
 * Cygnatrix Tools lockup: the swan mark + wordmark.
 * The mark is an <img> pointing at `public/brand/logo-mark.svg` — swap that file (or
 * the path in `config/site.ts`) to use the exact company artwork. The wordmark stays
 * as live text so it renders crisply at every size and in both themes.
 */
export function Logo({
  className,
  showText = true,
}: {
  className?: string;
  showText?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn('inline-flex items-center gap-2 no-underline', className)}
      aria-label="Cygnatrix Tools — home"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BRAND.mark}
        alt=""
        width={28}
        height={28}
        className="h-7 w-7 shrink-0"
        decoding="async"
      />
      {showText && (
        <span className="text-[15px] font-semibold leading-none tracking-tight text-ink-900 dark:text-white">
          Cygnatrix<span className="text-brand-600"> Tools</span>
        </span>
      )}
    </Link>
  );
}
