import type { JSX } from 'react';
import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  ChevronRight,
  Inbox,
  Loader2,
  Plus,
  Search,
  type LucideIcon,
  PhoneCall,
  Sparkles,
  Users,
  Wrench,
} from 'lucide-react';

import type {
  UnifiedItem,
  UnifiedListTab,
} from '../../lib/api-items';
import { timeAgoLabel } from '../../lib/api-items';
import { EmptyState } from '../ui/EmptyState';

const TYPE_ICON: Record<UnifiedItem['type'], LucideIcon> = {
  customer: Users,
  job: Wrench,
  call: PhoneCall,
  appt: Calendar,
};

const TABS: Array<{ key: UnifiedListTab; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'customer', label: 'Customers' },
  { key: 'job', label: 'Jobs' },
  { key: 'call', label: 'Calls' },
  { key: 'appt', label: 'Appointments' },
];

const TYPE_LABEL: Record<UnifiedItem['type'], string> = {
  customer: 'Customer',
  job: 'Job',
  call: 'Call',
  appt: 'Appointment',
};

function toneClass(tone: UnifiedItem['badges'][number]['tone']): string {
  switch (tone) {
    case 'primary':
      return 'bg-primary/15 text-primary ring-primary/30';
    case 'accent':
      return 'bg-accent/15 text-accent ring-accent/30';
    case 'warning':
      return 'bg-warning/15 text-warning ring-warning/30';
    case 'success':
      return 'bg-success/15 text-success ring-success/30';
    case 'danger':
      return 'bg-danger/15 text-danger ring-danger/30';
    default:
      return 'bg-muted text-muted-foreground ring-white/[0.08]';
  }
}

type Props = {
  /**
   * The FULL merged stream (customers + jobs + calls + appointments).
   * The board owns per-tab slicing internally so the tab-pill counts
   * always reflect what's available across all types — not just the
   * currently-active tab.
   */
  itemsAll: UnifiedItem[];
  total?: number;
  loading?: boolean;
  error?: string | null;
  q: string;
  tab: UnifiedListTab;
  onQChange: (next: string) => void;
  onTabChange: (next: UnifiedListTab) => void;
  /** Optional CTA shown in the empty state AND as a header action. */
  newHref?: string;
  newLabel?: string;
  /** "Load more" — if undefined, simpler flat list is rendered. */
  pageSize?: number;
  onRetry?: () => void;
};

export function UnifiedListBoard({
  itemsAll,
  total,
  loading = false,
  error = null,
  q,
  tab,
  onQChange,
  onTabChange,
  newHref,
  newLabel = 'New',
  pageSize = 20,
  onRetry,
}: Props): JSX.Element {
  // Local "page size" for load-more. Reset when filter tab or query
  // change so the user re-sees the top of the new slice.
  const [visible, setVisible] = useState(pageSize);
  useEffect(() => {
    setVisible(pageSize);
  }, [tab, q, pageSize]);

  // Tab slicing happens INSIDE the board so tab-pill counts stay
  // accurate against the unfiltered `itemsAll`. A previous version
  // did the slicing in the parent (ListPage) which made the per-tab
  // count badges read 0 for every non-active tab.
  const filtered = useMemo(
    () =>
      tab === 'all'
        ? itemsAll
        : itemsAll.filter((i) => i.type === tab),
    [itemsAll, tab],
  );

  const shown = filtered.slice(0, visible);
  const canLoadMore = filtered.length > visible;

  // Tab counts — derived from the unfiltered `itemsAll` so every
  // pill keeps showing its true inventory regardless of which tab is
  // currently active.
  const tabCounts = useMemo(() => {
    const c: Record<UnifiedListTab, number> = {
      all: itemsAll.length,
      customer: 0,
      job: 0,
      call: 0,
      appt: 0,
    };
    for (const i of itemsAll) c[i.type] += 1;
    return c;
  }, [itemsAll]);

  return (
    <div className="space-y-5">
      {/* Controls: tabs + search + New */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 p-0.5 rounded-lg glass-blend">
          {TABS.map((t) => {
            const isActive = t.key === tab;
            const count = tabCounts[t.key];
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => onTabChange(t.key)}
                className={[
                  'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors',
                  isActive
                    ? 'bg-white/[0.06] text-foreground ring-1 ring-white/[0.08]'
                    : 'text-muted-foreground hover:text-foreground',
                ].join(' ')}
                aria-pressed={isActive}
              >
                {t.label}
                <span
                  className={[
                    'tabular-nums text-[10px] font-mono px-1.5 py-px rounded',
                    isActive
                      ? 'bg-white/[0.08] text-foreground'
                      : 'bg-white/[0.03] text-muted-foreground',
                  ].join(' ')}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            value={q}
            onChange={(e) => onQChange(e.target.value)}
            placeholder="Search across customers, jobs, calls, appointments..."
            aria-label="Search unified list"
            className="w-full h-9 pl-8 pr-3 rounded-lg glass-blend text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
        </div>

        {newHref && (
          <Link
            to={newHref}
            className="btn-organic inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium shadow-sm shadow-primary/30"
          >
            <Plus className="w-4 h-4" />
            {newLabel}
          </Link>
        )}
      </div>

      {/* Result count strip */}
      {typeof total === 'number' && total > 0 && !loading && (
        <p className="text-xs text-muted-foreground -mt-2">
          {filtered.length === 0
            ? '0 matches'
            : `${filtered.length}${filtered.length === total ? '' : ` of ${total}`} ${filtered.length === 1 ? 'match' : 'matches'}`}
        </p>
      )}

      {/* Error state */}
      {error && !loading && (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 p-4"
        >
          <p className="font-medium text-destructive">Couldn't load the list</p>
          <p className="text-sm text-destructive/80 mt-1">{error}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
            >
              <Loader2 className="w-3.5 h-3.5" />
              Retry
            </button>
          )}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <ul className="space-y-2" role="status" aria-label="Loading list">
          {Array.from({ length: 6 }).map((_, i) => (
            <li
              key={i}
              className="glass-card rounded-xl p-4 animate-pulse flex items-center gap-3"
            >
              <span className="w-9 h-9 rounded-lg bg-white/[0.04]" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-2/5 rounded bg-white/[0.04]" />
                <div className="h-2 w-3/5 rounded bg-white/[0.04]" />
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Empty state */}
      {!loading && !error && shown.length === 0 && (
        <EmptyState
          icon={Inbox}
          title={q ? `No matches for "${q}"` : tab === 'all' ? 'Nothing here yet' : `No ${TYPE_LABEL[tab as UnifiedItem['type']]?.toLowerCase() ?? 'items'} yet`}
          description={
            q
              ? 'Try a different name, phone, issue, or summary keyword across customers, jobs, calls, and appointments.'
              : `Your business has no ${
                  tab === 'all' ? 'activity' : (TYPE_LABEL[tab as UnifiedItem['type']]?.toLowerCase() ?? 'items')
                } yet. ${newHref ? 'Use the New button to add your first one.' : ''}`
          }
          action={
            newHref && !q ? (
              <Link
                to={newHref}
                className="btn-organic inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium shadow-sm shadow-primary/30"
              >
                <Plus className="w-4 h-4" />
                {newLabel}
              </Link>
            ) : undefined
          }
        />
      )}

      {/* Rows */}
      {!loading && !error && shown.length > 0 && (
        <ul className="space-y-2">
          {shown.map((item) => (
            <Row key={`${item.type}-${item.id}`} item={item} />
          ))}
        </ul>
      )}

      {/* Load more */}
      {!loading && !error && canLoadMore && (
        <div className="pt-2 flex justify-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + pageSize)}
            className="btn-organic px-4 py-2 rounded-lg glass-blend text-sm font-medium text-foreground hover:bg-white/[0.06] inline-flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Load more
            <span className="text-xs text-muted-foreground font-mono">
              ({visible} / {filtered.length})
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

function Row({ item }: { item: UnifiedItem }): JSX.Element {
  const Icon = TYPE_ICON[item.type];
  const inner = (
    <div className="glass-card rounded-xl p-4 hover:bg-white/[0.06] hover:border-white/[0.16] transition-all">
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 rounded-lg bg-white/[0.04] ring-1 ring-white/[0.08] text-muted-foreground flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {item.badges.map((b, i) => (
              <span
                key={`${b.label}-${i}`}
                className={[
                  'inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ring-1',
                  toneClass(b.tone),
                ].join(' ')}
              >
                {b.label}
              </span>
            ))}
          </div>
          <p className="mt-1 text-sm font-semibold text-foreground truncate">
            {item.headline}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {item.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] font-mono tabular-nums text-muted-foreground hidden sm:inline">
            {timeAgoLabel(item.createdAt)}
          </span>
          {item.actionUrl && item.actionLabel && (
            <span className="text-[10px] uppercase tracking-wider font-bold text-primary hidden sm:inline">
              {item.actionLabel}
            </span>
          )}
          <ChevronRight className="w-4 h-4 text-muted-foreground/70" />
        </div>
      </div>
    </div>
  );

  if (item.actionUrl) {
    return (
      <li>
        <Link to={item.actionUrl} className="block group">
          {inner}
        </Link>
      </li>
    );
  }
  return <li>{inner}</li>;
}
