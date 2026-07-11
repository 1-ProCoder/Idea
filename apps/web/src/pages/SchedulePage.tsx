import { useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Plus,
  Sparkles,
  Wrench,
  Zap,
} from 'lucide-react';
import { useUser } from '@clerk/clerk-react';

import { PageHeader } from '../components/layout/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { EmptyState } from '../components/ui/EmptyState';
import { useOptionalFetch } from '../hooks/useAuthedFetch';
import { useQuery } from '@tanstack/react-query';
import {
  getDashboardStats,
  type DashboardStats,
  type AppointmentListItem,
} from '../lib/api-dashboard';

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7am..8pm

type SlotKind = 'standard' | 'emergency' | 'pending' | 'completed' | 'cancelled';

const slotClass: Record<SlotKind, string> = {
  standard: 'bg-primary/20 text-primary ring-primary/30',
  emergency: 'bg-danger/20 text-danger ring-danger/40',
  pending: 'bg-warning/20 text-warning ring-warning/30',
  completed: 'bg-muted text-muted-foreground ring-white/[0.08] line-through',
  cancelled: 'bg-muted text-muted-foreground ring-white/[0.08]',
};

function slotKindFor(
  a: AppointmentListItem,
): SlotKind {
  if (a.priority === 'EMERGENCY' && a.status !== 'COMPLETED') return 'emergency';
  switch (a.status) {
    case 'SCHEDULED':
      return 'standard';
    case 'NO_SHOW':
      return 'pending';
    case 'COMPLETED':
      return 'completed';
    case 'CANCELLED':
      return 'cancelled';
  }
}

function startTimeLabel(iso: string): string {
  const d = new Date(iso);
  return d
    .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    .replace(/^24:/, '00:');
}

function durationLabel(startIso: string, endIso: string): string {
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  const minutes = Math.max(0, Math.round(ms / 60_000));
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes - h * 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function startHour(a: AppointmentListItem): number {
  return new Date(a.start).getHours();
}

export default function SchedulePage(): JSX.Element {
  const fetch = useOptionalFetch();
  const [view] = useState<'day'>('day');

  // /schedule is public for signed-out visitors via the demo CTA.
  // The dashboard-stats endpoint is now public, so the query fires
  // on mount regardless of Clerk state. `useOptionalFetch` forwards
  // `null` when there's no session, and the backend routes to the
  // shared demo business.
  const statsQuery = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => fetch((token) => getDashboardStats(token)),
    staleTime: 30_000,
  });

  const appointments: AppointmentListItem[] =
    statsQuery.data?.todayAppointments ?? [];

  const grouped = useMemo(() => {
    const byHour = new Map<number, AppointmentListItem[]>();
    for (const a of appointments) {
      const h = startHour(a);
      const list = byHour.get(h) ?? [];
      list.push(a);
      byHour.set(h, list);
    }
    return byHour;
  }, [appointments]);

  // First non-completed appointment drives the detail panel.
  const focus =
    appointments.find((a) => a.status === 'SCHEDULED') ??
    appointments.find((a) => a.status !== 'CANCELLED') ??
    appointments[0];

  const today = appointments.length;
  const emergency = appointments.filter((a) => a.priority === 'EMERGENCY').length;
  const completed = appointments.filter((a) => a.status === 'COMPLETED').length;
  const utilisation =
    today === 0 ? 0 : Math.round((completed / today) * 100);

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8 pb-32 space-y-8">
      <PageHeader
        eyebrow="Schedule"
        title="Today's appointments"
        subtitle="No double-booking, optimal travel time, automatic reminders."
        actions={
          <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium shadow-sm shadow-primary/30 hover:shadow-primary/50 transition-all inline-flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            New booking
          </button>
        }
      />

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Today"
          value={String(today)}
          icon={Calendar}
        />
        <StatCard
          label="Completed"
          value={String(completed)}
          icon={CheckCircle2}
          accent="success"
        />
        <StatCard
          label="Emergency"
          value={String(emergency)}
          icon={Zap}
          accent="danger"
        />
        <StatCard
          label="Utilisation"
          value={`${utilisation}%`}
          icon={Sparkles}
          accent="accent"
        />
      </section>

      <section className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-4">
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <div className="flex items-center gap-3">
              <button
                className="w-8 h-8 rounded-lg glass-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Previous day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Today
                </p>
                <p className="text-xs text-muted-foreground">
                  {today} {today === 1 ? 'appointment' : 'appointments'} \u00b7{' '}
                  {utilisation}% utilisation
                </p>
              </div>
              <button
                className="w-8 h-8 rounded-lg glass-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Next day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-1 p-0.5 rounded-lg glass-card">
              <button
                aria-pressed
                className={[
                  'px-3 py-1 text-xs font-semibold rounded-md transition-colors capitalize',
                  view === 'day'
                    ? 'bg-white/[0.06] text-foreground ring-1 ring-white/[0.08]'
                    : 'text-muted-foreground hover:text-foreground',
                ].join(' ')}
              >
                day
              </button>
            </div>
          </div>

          {statsQuery.isPending && (
            <div className="space-y-2" role="status" aria-label="Loading schedule">
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="h-9 rounded bg-white/[0.03] animate-pulse"
                />
              ))}
            </div>
          )}

          {statsQuery.isError && (
            <div
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/10 p-4"
            >
              <p className="font-medium text-destructive">
                Couldn't load schedule
              </p>
              <p className="text-sm text-destructive/80 mt-1">
                {(() => {
                  const err = statsQuery.error as { message?: string };
                  return err?.message ?? 'Unknown error';
                })()}
              </p>
            </div>
          )}

          {!statsQuery.isPending &&
            !statsQuery.isError &&
            appointments.length === 0 && (
              <EmptyState
                icon={Calendar}
                title="Nothing scheduled today"
                description="When jobs are booked, they'll appear here in the timeline. Use New booking to schedule an appointment."
                action={
                  <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30">
                    <Plus className="w-4 h-4" />
                    New booking
                  </button>
                }
              />
            )}

          {appointments.length > 0 && (
            <div className="relative">
              <div
                className="absolute left-[68px] right-0 top-0 bottom-0 border-l border-white/[0.06]"
                aria-hidden
              />
              {HOURS.map((h) => {
                const slot = grouped.get(h) ?? [];
                return (
                  <div
                    key={h}
                    className="grid grid-cols-[60px_minmax(0,1fr)] gap-2 py-1.5 border-b border-white/[0.04] last:border-b-0"
                  >
                    <span className="text-[10px] font-mono tabular-nums text-muted-foreground pt-2 text-right pr-2">
                      {h.toString().padStart(2, '0')}:00
                    </span>
                    <div className="space-y-1.5 min-h-[28px]">
                      {slot.length === 0 ? (
                        <span className="text-[10px] text-muted-foreground/30">
                          \u2014
                        </span>
                      ) : (
                        slot.map((a) => (
                          <ApptTile key={a.id} a={a} />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {!statsQuery.isPending &&
          !statsQuery.isError &&
          appointments.length > 0 &&
          (focus ? <FocusPanel a={focus} /> : null)}
      </section>
    </div>
  );
}

function ApptTile({ a }: { a: AppointmentListItem }): JSX.Element {
  const kind = slotKindFor(a);
  const startsAt = startTimeLabel(a.start);
  return (
    <div
      className={[
        'relative w-full rounded-lg p-2.5 text-left ring-1 transition-all',
        slotClass[kind],
      ].join(' ')}
    >
      <div className="flex items-start gap-2">
        <span
          className={[
            'flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center ring-1',
            kind === 'emergency'
              ? 'bg-danger/30 ring-danger/50'
              : kind === 'pending'
                ? 'bg-warning/30 ring-warning/50'
                : kind === 'completed'
                  ? 'bg-muted ring-white/[0.08]'
                  : 'bg-primary/30 ring-primary/50',
          ].join(' ')}
        >
          {kind === 'emergency' ? (
            <Zap className="w-3 h-3" />
          ) : kind === 'completed' ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : (
            <Wrench className="w-3 h-3" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold truncate">
            {a.customerName} \u00b7 {a.issue}
          </p>
          <p className="text-[10px] opacity-80 truncate">
            {startsAt} \u2014 {a.workerName}
          </p>
        </div>
        <span className="text-[10px] font-mono opacity-70 flex-shrink-0 mt-0.5">
          {durationLabel(a.start, a.end)}
        </span>
      </div>
    </div>
  );
}

function FocusPanel({ a }: { a: AppointmentListItem }): JSX.Element {
  const kind = slotKindFor(a);
  return (
    <aside className="glass-card-strong rounded-2xl p-5 self-start">
      <div className="flex items-center gap-2 mb-1">
        {kind === 'emergency' && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-danger/15 text-danger ring-1 ring-danger/30">
            <Zap className="w-3 h-3" />
            Emergency
          </span>
        )}
        <span className="text-[10px] text-muted-foreground font-mono">
          {startTimeLabel(a.start)} \u2192 {startTimeLabel(a.end)}
        </span>
      </div>
      <p className="text-lg font-semibold text-foreground">
        {a.customerName}
      </p>
      <p className="text-xs text-muted-foreground truncate">Job: {a.issue}</p>

      <div className="mt-4 space-y-3">
        <DetailRow icon={Wrench} label="Job" value={a.issue} />
        <DetailRow icon={Clock} label="Duration" value={durationLabel(a.start, a.end)} />
        <DetailRow icon={MapPin} label="Technician" value={a.workerName} />
      </div>
    </aside>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
}): JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <span className="w-7 h-7 rounded-md flex items-center justify-center ring-1 bg-white/[0.04] text-muted-foreground ring-white/[0.06]">
        <Icon className="w-3.5 h-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="text-sm text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}
