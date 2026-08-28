import { cn } from '@/lib/cn';

export interface StackedDatum {
  label: string;
  a: number;
  b: number;
}

/**
 * Stacked vertical bars (e.g. invested vs gains per year, principal vs interest
 * per year). Pure SVG, responsive via viewBox.
 */
export function StackedBarChart({
  data,
  aLabel,
  bLabel,
  aColor = '#0d9089',
  bColor = '#77e7db',
  formatValue = (n) => String(Math.round(n)),
  className,
}: {
  data: StackedDatum[];
  aLabel: string;
  bLabel: string;
  aColor?: string;
  bColor?: string;
  formatValue?: (n: number) => string;
  className?: string;
}) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.a + d.b)) || 1;
  const width = 640;
  const height = 240;
  const padB = 28;
  const padL = 8;
  const gap = 10;
  const barW = (width - padL * 2 - gap * (data.length - 1)) / data.length;

  return (
    <figure className={cn('w-full', className)}>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full min-w-[420px]" role="img" aria-label={`${aLabel} and ${bLabel} by period`}>
          {data.map((d, i) => {
            const x = padL + i * (barW + gap);
            const total = d.a + d.b;
            const hTotal = (total / max) * (height - padB - 8);
            const hA = (d.a / max) * (height - padB - 8);
            const yTop = height - padB - hTotal;
            return (
              <g key={d.label}>
                <rect x={x} y={yTop} width={barW} height={hA} fill={aColor} rx="2" />
                <rect x={x} y={yTop + hA} width={barW} height={hTotal - hA} fill={bColor} rx="2" />
                <text
                  x={x + barW / 2}
                  y={height - padB + 16}
                  textAnchor="middle"
                  className="fill-ink-400 text-[10px]"
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <figcaption className="mt-3 flex gap-4 text-xs text-ink-500 dark:text-ink-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: aColor }} /> {aLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: bColor }} /> {bLabel}
        </span>
        <span className="ml-auto">Peak: {formatValue(max)}</span>
      </figcaption>
    </figure>
  );
}
