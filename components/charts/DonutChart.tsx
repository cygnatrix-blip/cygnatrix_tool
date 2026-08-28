import { cn } from '@/lib/cn';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

/**
 * Pure-SVG donut. Server-renderable, ~1 KB, no charting library. Theme-aware via
 * currentColor on the track.
 */
export function DonutChart({
  segments,
  size = 190,
  thickness = 24,
  centerLabel,
  centerValue,
  formatValue,
  className,
}: {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
  formatValue?: (v: number) => string;
  className?: string;
}) {
  const total = segments.reduce((s, seg) => s + Math.max(0, seg.value), 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className={cn('flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-8', className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={segments.map((s) => `${s.label}: ${Math.round((s.value / total) * 100)}%`).join(', ')}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={thickness}
          className="stroke-ink-100 dark:stroke-ink-800"
        />
        {segments.map((seg) => {
          const fraction = Math.max(0, seg.value) / total;
          const dash = fraction * circumference;
          const el = (
            <circle
              key={seg.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              strokeLinecap="butt"
            />
          );
          offset += dash;
          return el;
        })}
        {(centerValue || centerLabel) && (
          <text x="50%" y="50%" textAnchor="middle" className="fill-ink-900 dark:fill-white">
            {centerLabel && (
              <tspan x="50%" dy="-0.3em" className="text-[10px] fill-ink-400">
                {centerLabel}
              </tspan>
            )}
            {centerValue && (
              <tspan x="50%" dy="1.4em" className="text-sm font-semibold">
                {centerValue}
              </tspan>
            )}
          </text>
        )}
      </svg>

      <ul className="w-full space-y-3 text-sm sm:w-auto sm:min-w-[180px]">
        {segments.map((seg) => (
          <li key={seg.label} className="flex items-start gap-2.5">
            <span
              className="mt-1 h-3 w-3 shrink-0 rounded-sm"
              style={{ background: seg.color }}
              aria-hidden="true"
            />
            <span className="min-w-0">
              <span className="flex items-baseline gap-2">
                <span className="text-ink-600 dark:text-ink-300">{seg.label}</span>
                <span className="text-xs font-semibold text-ink-400 tabular-nums">
                  {Math.round((Math.max(0, seg.value) / total) * 100)}%
                </span>
              </span>
              {formatValue && (
                <span className="block font-semibold tabular-nums text-ink-900 dark:text-white">
                  {formatValue(Math.max(0, seg.value))}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
