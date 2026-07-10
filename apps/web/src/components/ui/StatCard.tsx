import type { LucideIcon } from 'lucide-react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { Sparkline } from './Sparkline';

type Accent = 'primary' | 'success' | 'warning' | 'danger' | 'accent';

type Props = {
  label: string;
  value: string;
  change?: { value: string; direction: 'up' | 'down' };
  icon: LucideIcon;
  sparkline?: number[];
  accent?: Accent;
};

const accentMap: Record<
  Accent,
  { icon: string; spark: string; fill: string }
> = {
  primary: {
    icon: 'text-primary bg-primary/15 ring-primary/20',
    spark: 'text-primary',
    fill: 'text-primary/20',
  },
  success: {
    icon: 'text-success bg-success/15 ring-success/20',
    spark: 'text-success',
    fill: 'text-success/20',
  },
  warning: {
    icon: 'text-warning bg-warning/15 ring-warning/20',
    spark: 'text-warning',
    fill: 'text-warning/20',
  },
  danger: {
    icon: 'text-danger bg-danger/15 ring-danger/20',
    spark: 'text-danger',
    fill: 'text-danger/20',
  },
  accent: {
    icon: 'text-accent bg-accent/15 ring-accent/20',
    spark: 'text-accent',
    fill: 'text-accent/20',
  },
};

export function StatCard({
  label,
  value,
  change,
  icon: Icon,
  sparkline,
  accent = 'primary',
}: Props): JSX.Element {
  const palette = accentMap[accent];
  return (
    <div className="group relative glass-card rounded-2xl p-5 hover:border-white/[0.14] hover:bg-white/[0.06] transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-black/20">
      <div className="flex items-start justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span
          className={`w-9 h-9 rounded-lg ring-1 flex items-center justify-center transition-colors ${palette.icon}`}
        >
          <Icon className="w-4 h-4" />
        </span>
      </div>
      <p className="text-3xl font-bold text-foreground mt-3 tabular-nums tracking-tight">
        {value}
      </p>
      <div className="flex items-end justify-between mt-3 gap-2 min-h-[28px]">
        {change ? (
          <div className="flex items-center gap-1.5 text-xs">
            {change.direction === 'up' ? (
              <TrendingUp className="w-3 h-3 text-success" />
            ) : (
              <TrendingDown className="w-3 h-3 text-danger" />
            )}
            <span
              className={
                change.direction === 'up'
                  ? 'text-success font-semibold'
                  : 'text-danger font-semibold'
              }
            >
              {change.value}
            </span>
            <span className="text-muted-foreground">vs last week</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">last 7 days</span>
        )}
        {sparkline && (
          <Sparkline
            data={sparkline}
            className="w-20 h-8"
            strokeClassName={palette.spark}
            fillClassName={palette.fill}
          />
        )}
      </div>
    </div>
  );
}
