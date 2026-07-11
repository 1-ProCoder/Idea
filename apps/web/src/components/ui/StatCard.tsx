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
  { icon: string; spark: string; fill: string; rowText: string; rowDot: string }
> = {
  primary: {
    icon: 'text-primary bg-primary/15 ring-primary/20',
    spark: 'text-primary',
    fill: 'text-primary/20',
    rowText: 'text-primary',
    rowDot: 'hsl(var(--primary))',
  },
  success: {
    icon: 'text-success bg-success/15 ring-success/20',
    spark: 'text-success',
    fill: 'text-success/20',
    rowText: 'text-success',
    rowDot: 'hsl(var(--success))',
  },
  warning: {
    icon: 'text-warning bg-warning/15 ring-warning/20',
    spark: 'text-warning',
    fill: 'text-warning/20',
    rowText: 'text-warning',
    rowDot: 'hsl(var(--warning))',
  },
  danger: {
    icon: 'text-danger bg-danger/15 ring-danger/20',
    spark: 'text-danger',
    fill: 'text-danger/20',
    rowText: 'text-danger',
    rowDot: 'hsl(var(--danger))',
  },
  accent: {
    icon: 'text-accent bg-accent/15 ring-accent/20',
    spark: 'text-accent',
    fill: 'text-accent/20',
    rowText: 'text-accent',
    rowDot: 'hsl(var(--accent))',
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

/* ─── StatRowItem — borderless inline stat for the new header row ─────
   The brief says the 4 metric cards "should blend these key metrics
   directly into the page header as a minimalist, borderless stats row,
   separated only by generous negative space and tiny subtle accent
   lights." This component renders ONE such stat: no card, no background,
   just a small pulsing accent dot + label + value. Compose them in a
   flex row with `gap-8 lg:gap-12` to get the generous negative space. */
type StatRowItemProps = {
  label: string;
  value: string;
  icon?: LucideIcon;
  accent?: Accent;
};

export function StatRowItem({
  label,
  value,
  icon: Icon,
  accent = 'primary',
}: StatRowItemProps): JSX.Element {
  const palette = accentMap[accent];
  return (
    <div className="flex items-center gap-3">
      {Icon && (
        <Icon
          className={`w-4 h-4 flex-shrink-0 ${palette.rowText}`}
          aria-hidden
        />
      )}
      <div>
        <div className="flex items-center gap-2">
          <span
            className="stat-row-accent"
            style={{
              backgroundColor: palette.rowDot,
              boxShadow: `0 0 10px 2px ${palette.rowDot}99`,
            }}
            aria-hidden
          />
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
        </div>
        <p className="text-2xl font-bold text-foreground tabular-nums tracking-tight mt-1">
          {value}
        </p>
      </div>
    </div>
  );
}
