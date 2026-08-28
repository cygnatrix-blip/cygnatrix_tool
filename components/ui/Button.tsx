import Link from 'next/link';
import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 disabled:bg-brand-300 shadow-sm',
  secondary:
    'bg-white text-ink-800 border border-ink-200 hover:bg-ink-50 dark:bg-ink-800 dark:text-ink-100 dark:border-ink-700 dark:hover:bg-ink-700',
  ghost: 'text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm rounded-lg gap-1.5',
  md: 'h-11 px-5 text-sm rounded-xl gap-2',
  lg: 'h-12 px-6 text-base rounded-xl gap-2',
};

const baseClasses =
  'inline-flex select-none items-center justify-center font-medium transition disabled:cursor-not-allowed disabled:opacity-70';

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
}

type ButtonProps = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: never };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className, ...props },
  ref,
) {
  return (
    <button ref={ref} className={cn(baseClasses, VARIANTS[variant], SIZES[size], className)} {...props} />
  );
});

type LinkButtonProps = CommonProps &
  Omit<React.ComponentProps<typeof Link>, 'className'> & { external?: boolean };

export function LinkButton({
  variant = 'primary',
  size = 'md',
  className,
  external,
  ...props
}: LinkButtonProps) {
  const cls = cn(baseClasses, VARIANTS[variant], SIZES[size], 'no-underline', className);
  if (external) {
    return (
      <a
        className={cls}
        href={props.href as string}
        target="_blank"
        rel="noopener noreferrer"
      >
        {props.children}
      </a>
    );
  }
  return <Link className={cls} {...props} />;
}
