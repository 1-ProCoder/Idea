type SparklineProps = {
  data: number[];
  className?: string;
  strokeClassName?: string;
  fillClassName?: string;
};

export function Sparkline({
  data,
  className = 'w-20 h-8',
  strokeClassName = 'text-primary',
  fillClassName = 'text-primary/20',
}: SparklineProps): JSX.Element {
  if (data.length < 2) return <div className={className} />;

  const w = 100;
  const h = 32;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  const fillPath = `M 0,${h} L ${points.split(' ').join(' L ')} L ${w},${h} Z`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d={fillPath} className={fillClassName} fill="currentColor" />
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={strokeClassName}
      />
    </svg>
  );
}

type BarChartProps = {
  data: Array<{ label: string; value: number }>;
  height?: number;
  primaryClassName?: string;
  secondaryClassName?: string;
};

/** Simple side-by-side bar chart with two series per tick. */
export function BarChart({
  data,
  height = 160,
  primaryClassName = 'bg-primary',
  secondaryClassName = 'bg-accent',
}: BarChartProps): JSX.Element {
  const max = Math.max(...data.flatMap((d) => [d.value])) || 1;
  return (
    <div className="flex items-end gap-2 sm:gap-3" style={{ height }}>
      {data.map((d) => (
        <div
          key={d.label}
          className="flex-1 flex flex-col items-center gap-1.5 min-w-0"
        >
          <div className="w-full flex items-end gap-1 h-full">
            <div
              className={`${primaryClassName} rounded-t-md flex-1 transition-all`}
              style={{ height: `${(d.value / max) * 100}%` }}
              aria-label={`${d.label} value`}
            />
            {d && null}
          </div>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground truncate w-full text-center">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}
