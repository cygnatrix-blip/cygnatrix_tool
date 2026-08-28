import { cn } from '@/lib/cn';

export interface Series {
  label: string;
  color: string;
  points: number[];
}

/** Multi-series line chart, pure SVG. x-axis is the index; labels supplied separately. */
export function LineChart({
  series,
  xLabels,
  className,
}: {
  series: Series[];
  xLabels: string[];
  className?: string;
}) {
  const n = Math.max(...series.map((s) => s.points.length), 0);
  if (n < 2) return null;

  const width = 640;
  const height = 220;
  const padL = 8;
  const padB = 24;
  const padT = 8;
  const max = Math.max(...series.flatMap((s) => s.points)) || 1;

  const x = (i: number) => padL + (i / (n - 1)) * (width - padL * 2);
  const y = (v: number) => padT + (1 - v / max) * (height - padT - padB);

  return (
    <figure className={cn('w-full', className)}>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full min-w-[420px]" role="img" aria-label={series.map((s) => s.label).join(' and ')}>
          {series.map((s) => {
            const d = s.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p)}`).join(' ');
            return <path key={s.label} d={d} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" />;
          })}
          {xLabels.map((label, i) =>
            i % Math.ceil(n / 8) === 0 || i === n - 1 ? (
              <text key={i} x={x(i)} y={height - 6} textAnchor="middle" className="fill-ink-400 text-[10px]">
                {label}
              </text>
            ) : null,
          )}
        </svg>
      </div>
      <figcaption className="mt-3 flex gap-4 text-xs text-ink-500 dark:text-ink-400">
        {series.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} /> {s.label}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
