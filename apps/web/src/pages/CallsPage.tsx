import { useMemo, useState } from 'react';
import {
  ChevronRight,
  Phone,
  PhoneCall,
  PhoneMissed,
  Search,
  Sparkles,
  Zap,
} from 'lucide-react';

import { PageHeader } from '../components/layout/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { EmptyState } from '../components/ui/EmptyState';
import { useAuthedFetch } from '../hooks/useAuthedFetch';
import { useQuery } from '@tanstack/react-query';
import {
  listCalls,
  getCallStats,
  type CallDto,
  type CallStatsResponse,
  type CallListResponse,
} from '../lib/api-calls';
import { useUser } from '@clerk/clerk-react';

function formatDuration(seconds: number | null): string {
  if (seconds == null) return '\u2014';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function startTimeLabel(iso: string): string {
  const d = new Date(iso);
  return d
    .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    .replace(/^24:/, '00:');
}

function priorityBadge(isEmergency: boolean): {
  label: string;
  className: string;
} {
  return isEmergency
    ? {
        label: 'Emergency',
        className: 'bg-danger/15 text-danger ring-danger/30',
      }
    : {
        label: 'Standard',
        className: 'bg-primary/15 text-primary ring-primary/30',
      };
}

function statusBadge(isEmergency: boolean): {
  label: string;
  className: string;
} {
  return isEmergency
    ? {
        label: 'Emergency',
        className: 'bg-danger/15 text-danger ring-danger/30',
      }
    : {
        label: 'Answered',
        className: 'bg-primary/15 text-primary ring-primary/30',
      };
}

export default function CallsPage(): JSX.Element {
  const { isLoaded } = useUser();
  const fetch = useAuthedFetch();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'emergency'>('all');

  const statsQuery = useQuery<CallStatsResponse>({
    queryKey: ['call-stats'],
    queryFn: () => fetch((token) => getCallStats(token)),
    enabled: isLoaded,
    staleTime: 30_000,
  });

  const callsQuery = useQuery<CallListResponse>({
    queryKey: ['calls', { limit: 100 }],
    queryFn: () => fetch((token) => listCalls(token, { limit: 100 })),
    enabled: isLoaded,
    staleTime: 30_000,
  });

  const calls: CallDto[] = callsQuery.data?.items ?? [];
  const stats = statsQuery.data;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return calls.filter((c) => {
      if (filter === 'emergency' && !c.isEmergency) return false;
      if (!q) return true;
      const hay =
        `${c.fromPhone} ${c.summary ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [calls, search, filter]);

  const total = stats?.total ?? 0;
  const emergency = stats?.emergency ?? 0;
  const aiAnswered = Math.max(0, total - emergency);
  const spark = stats?.last7Days ?? [];

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8 pb-32 space-y-8">
      <PageHeader
        eyebrow="Calls"
        title="AI receptionist & calls"
        subtitle="Every call answered, every job triaged, every customer captured \u2014 automatically."
        actions={
          <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium shadow-sm shadow-primary/30 hover:shadow-primary/50 transition-all inline-flex items-center gap-2">
            <PhoneCall className="w-4 h-4" />
            Test call
          </button>
        }
      />

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total calls"
          value={String(total)}
          icon={Phone}
          sparkline={spark}
        />
        <StatCard
          label="Emergency"
          value={String(emergency)}
          icon={Zap}
          accent="danger"
          sparkline={spark}
        />
        <StatCard
          label="AI answered"
          value={String(aiAnswered)}
          icon={Sparkles}
          accent="accent"
          sparkline={spark}
        />
        <StatCard
          label="Booked"
          value={'\u2014'}
          icon={PhoneMissed}
          accent="success"
        />
      </section>

      <section className="grid lg:grid-cols-[minmax(0,1fr)] gap-4">
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by phone or summary\u2026"
                  className="w-full h-9 pl-8 pr-3 rounded-lg glass-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
              </div>
              <div className="flex items-center gap-1">
                {(['all', 'emergency'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className={[
                      'px-2.5 py-1.5 text-xs rounded-md font-medium capitalize transition-colors',
                      filter === s
                        ? 'bg-white/[0.06] text-foreground ring-1 ring-white/[0.08]'
                        : 'text-muted-foreground hover:text-foreground',
                    ].join(' ')}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {callsQuery.isPending && (
            <div
              className="space-y-3"
              role="status"
              aria-label="Loading calls"
            >
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 rounded-lg bg-white/[0.03] animate-pulse"
                />
              ))}
            </div>
          )}

          {callsQuery.isError && (
            <div
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/10 p-4"
            >
              <p className="font-medium text-destructive">
                Couldn't load calls
              </p>
              <p className="text-sm text-destructive/80 mt-1">
                {(() => {
                  const err = callsQuery.error as { message?: string };
                  return err?.message ?? 'Unknown error';
                })()}
              </p>
            </div>
          )}

          {calls.length === 0 &&
            !callsQuery.isPending &&
            !callsQuery.isError && (
              <EmptyState
                icon={PhoneCall}
                title="No calls yet"
                description="Calls answered by your AI receptionist will appear here. Forward your business number to FlowFix to start receiving them."
                action={
                  <a
                    href="/settings/ai-receptionist"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30"
                  >
                    <PhoneCall className="w-4 h-4" />
                    Set up AI receptionist
                  </a>
                }
              />
            )}

          {calls.length > 0 && filtered.length === 0 && (
            <EmptyState
              icon={Search}
              title="No calls match"
              description="Try clearing the search or pick a different filter."
            />
          )}

          {filtered.length > 0 && (
            <div className="overflow-x-auto -mx-5 px-5 scrollbar-thin">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {[
                      'From',
                      'Issue',
                      'Priority',
                      'Duration',
                      'Status',
                      'Date',
                      '',
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left font-bold pb-3 pr-3 last:pr-0"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filtered.map((c) => {
                    const pb = priorityBadge(c.isEmergency);
                    const sb = statusBadge(c.isEmergency);
                    return (
                      <tr
                        key={c.id}
                        className="hover:bg-white/[0.03] transition-colors"
                      >
                        <td className="py-3 pr-3 font-mono text-xs text-foreground">
                          {c.fromPhone}
                        </td>
                        <td className="py-3 pr-3 text-foreground/90 max-w-[260px] truncate">
                          {c.summary ?? '\u2014'}
                        </td>
                        <td className="py-3 pr-3">
                          <span
                            className={[
                              'inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold ring-1',
                              pb.className,
                            ].join(' ')}
                          >
                            {pb.label}
                          </span>
                        </td>
                        <td className="py-3 pr-3 font-mono text-xs text-muted-foreground tabular-nums">
                          {formatDuration(c.duration)}
                        </td>
                        <td className="py-3 pr-3">
                          <span
                            className={[
                              'inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold ring-1',
                              sb.className,
                            ].join(' ')}
                          >
                            {sb.label}
                          </span>
                        </td>
                        <td className="py-3 pr-3 font-mono text-xs text-muted-foreground tabular-nums">
                          {startTimeLabel(c.createdAt)}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            className="text-muted-foreground hover:text-foreground"
                            aria-label="Open"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
