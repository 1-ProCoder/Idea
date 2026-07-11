import { useUser } from '@clerk/clerk-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  ChevronRight,
  Gauge,
  PhoneCall,
  Plus,
  Sparkles,
  Users,
  Wrench,
  Zap,
} from 'lucide-react';

import { PageHeader } from '../components/layout/PageHeader';
import { StatRowItem } from '../components/ui/StatCard';
import { Sparkline } from '../components/ui/Sparkline';
import { EmptyState } from '../components/ui/EmptyState';
import { useAuthedFetch, useOptionalFetch } from '../hooks/useAuthedFetch';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getDashboardStats,
  type DashboardStats,
  type AppointmentListItem,
  type JobListItem,
} from '../lib/api-dashboard';
import {
  listCalls,
  type CallListResponse,
  type CallDto,
} from '../lib/api-calls';

type MeResponse = {
  userId: string;
  sessionId: string | null;
};

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

function timeOfDayGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return 'just now';
  if (min === 1) return '1 min ago';
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h === 1) return '1 h ago';
  if (h < 24) return `${h} h ago`;
  return `${Math.floor(h / 24)} d ago`;
}

function startTimeLabel(iso: string): string {
  const d = new Date(iso);
  return d
    .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    .replace(/^24:/, '00:');
}

function priorityBadge(
  priority: 'NORMAL' | 'URGENT' | 'EMERGENCY',
): { label: string; className: string } {
  switch (priority) {
    case 'EMERGENCY':
      return {
        label: 'Emergency',
        className: 'bg-danger/15 text-danger ring-danger/30',
      };
    case 'URGENT':
      return {
        label: 'Urgent',
        className: 'bg-warning/15 text-warning ring-warning/30',
      };
    case 'NORMAL':
    default:
      return {
        label: 'Standard',
        className: 'bg-primary/15 text-primary ring-primary/30',
      };
  }
}

function jobStatusBadge(status: JobListItem['status']): {
  label: string;
  className: string;
} {
  switch (status) {
    case 'PENDING':
      return {
        label: 'Pending',
        className: 'bg-warning/15 text-warning ring-warning/30',
      };
    case 'SCHEDULED':
      return {
        label: 'Scheduled',
        className: 'bg-primary/15 text-primary ring-primary/30',
      };
    case 'IN_PROGRESS':
      return {
        label: 'In progress',
        className: 'bg-accent/15 text-accent ring-accent/30',
      };
    case 'COMPLETED':
      return {
        label: 'Completed',
        className: 'bg-success/15 text-success ring-success/30',
      };
    case 'CANCELLED':
      return {
        label: 'Cancelled',
        className: 'bg-muted text-muted-foreground ring-white/[0.08]',
      };
  }
}

export default function DashboardPage(): JSX.Element {
  const { user, isLoaded, isSignedIn } = useUser();
  const authedFetch = useAuthedFetch();
  const optionalFetch = useOptionalFetch();

  // /api/me requires auth (requireAuth() on the server) — only fire
  // when the visitor is actually signed in. Signed-out visitors
  // browsing the landing page's "Open the demo" CTA still see a fully
  // populated dashboard thanks to /api/dashboard/stats + /api/calls,
  // both of which have been intentionally opened up to demo traffic.
  //
  // NOTE: we intentionally don't name the closure `fetch` — that would
  // shadow the global `fetch` and break the inner `await fetch('/api/me', …)`
  // call below. Name it `authedFetch` instead.
  const meQuery = useQuery<MeResponse>({
    queryKey: ['me'],
    queryFn: () =>
      authedFetch(async (token) => {
        const res = await fetch('/api/me', {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(
            `Backend returned ${res.status}: ${text || res.statusText}`,
          );
        }
        return (await res.json()) as MeResponse;
      }),
    enabled: isLoaded && isSignedIn === true,
    staleTime: 60_000,
  });

  // /api/dashboard/stats is public — works for both signed-in users
  // (their own business) and signed-out visitors (shared demo
  // business). No `enabled` gate: we want stats to load as soon as
  // the page mounts regardless of Clerk auth state.
  const statsQuery = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => optionalFetch((token) => getDashboardStats(token)),
    staleTime: 30_000,
  });

  // /api/calls (list) is also public for the demo. Same rationale as
  // statsQuery — works for both signed-in and signed-out visitors.
  const callsQuery = useQuery<CallListResponse>({
    queryKey: ['calls', { limit: 5 }],
    queryFn: () => optionalFetch((token) => listCalls(token, { limit: 5 })),
    staleTime: 30_000,
  });

  const queryClient = useQueryClient();

  // Pull the most informative error message from any of the queries —
  // the API now returns structured `error` codes (backend_misconfigured /
  // database_unavailable), but they get embedded into the throw-string
  // by useAuthedFetch, so we substring-match on the message.
  const backendErrorMsg = (
    (statsQuery.error as Error | null)?.message ??
    (callsQuery.error as Error | null)?.message ??
    (meQuery.error as Error | null)?.message ??
    ''
  ).toLowerCase();

  const errorKind: 'auth' | 'database' | 'other' =
    backendErrorMsg.includes('backend_misconfigured')
      ? 'auth'
      : backendErrorMsg.includes('database_unavailable')
        ? 'database'
        : 'other';

  // For signed-in users, greet them by first name / username. For
  // signed-out visitors (the demo CTA), use a neutral welcome so the
  // page reads as "preview" rather than "broken".
  const greetingName = useMemo(() => {
    if (isSignedIn === false) return 'explorer';
    return user?.firstName ?? user?.username ?? 'there';
  }, [isSignedIn, user]);

  const stats = statsQuery.data;
  const calls: CallDto[] = callsQuery.data?.items ?? [];
  const todayAppointments: AppointmentListItem[] =
    stats?.todayAppointments ?? [];
  const recentJobs: JobListItem[] = stats?.recentJobs ?? [];
  const spark = stats?.sparklines.calls ?? [];

  const totalCalls = stats?.totals.totalCalls ?? 0;
  const jobsToday = stats?.totals.jobsToday ?? 0;
  const emergencyJobs = stats?.totals.emergencyJobs ?? 0;
  const completionRate = stats?.totals.completionRate ?? 0;
  const activeTechnicians = stats?.totals.activeTechnicians ?? 0;

  const isBackendError =
    statsQuery.isError || callsQuery.isError;

  const isAllEmpty =
    !statsQuery.isPending &&
    !isBackendError &&
    totalCalls === 0 &&
    jobsToday === 0 &&
    emergencyJobs === 0 &&
    todayAppointments.length === 0 &&
    recentJobs.length === 0 &&
    calls.length === 0;

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8 pb-32 space-y-10">
      <PageHeader
        eyebrow="Today"
        title={
          isSignedIn === false
            ? 'Welcome to the FlowFix AI demo 👋'
            : `${timeOfDayGreeting()}, ${greetingName} 👋`
        }
        subtitle={
          isSignedIn === false
            ? "You're browsing a shared demo business. Sign in any time to start saving your own data."
            : "Here's what's happening in your business today."
        }
        actions={
          <>
            <button className="btn-organic px-4 py-2 rounded-lg glass-blend text-sm font-medium text-foreground/90 hover:text-foreground inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Job
            </button>
            <button className="btn-organic px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium shadow-sm shadow-primary/30 inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Customer
            </button>
          </>
        }
      />

      {/*
        Borderless stats row, integrated directly into the page header.
        Generous horizontal negative space (gap-8 / lg:gap-12) and tiny
        pulsing accent dots replace the old 4 boxy metric cards. The row
        has no background or border — the canvas shows through.
      */}
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.4 }}
        className="flex flex-wrap items-end gap-x-8 lg:gap-x-12 gap-y-6 -mt-2"
        aria-label="Today stats"
      >
        <StatRowItem
          label="Calls (7d)"
          value={String(totalCalls)}
          icon={PhoneCall}
          accent="primary"
        />
        <StatRowItem
          label="Jobs today"
          value={String(jobsToday)}
          icon={Briefcase}
          accent="success"
        />
        <StatRowItem
          label="Emergency jobs"
          value={String(emergencyJobs)}
          icon={Zap}
          accent="warning"
        />
        <StatRowItem
          label="Completion"
          value={`${completionRate}%`}
          icon={Gauge}
          accent="accent"
        />
      </motion.div>

      {isBackendError ? (
        <EmptyState
          variant="spotlight"
          icon={Wrench}
          title="Dashboard unavailable"
          description={
            errorKind === 'auth'
              ? 'Backend authentication is misconfigured. Set CLERK_SECRET_KEY in apps/api/.env (matching VITE_CLERK_PUBLISHABLE_KEY on the web) and restart the API.'
              : errorKind === 'database'
                ? 'The database cannot be reached. Check DATABASE_URL in apps/api/.env and confirm Postgres is running.'
                : "We couldn't connect to the backend service. It may be unreachable or down. If this persists, check the API process."
          }
          action={
            <button
              type="button"
              onClick={() => {
                void queryClient.invalidateQueries();
              }}
              className="btn-organic inline-flex items-center gap-2 px-5 py-2.5 rounded-md font-medium bg-primary text-primary-foreground shadow-lg shadow-primary/30"
            >
              <Wrench className="w-4 h-4" />
              Retry
            </button>
          }
        />
      ) : isAllEmpty ? (
        <EmptyState
          variant="spotlight"
          icon={Sparkles}
          title={
            isSignedIn === false
              ? 'Welcome to the demo'
              : 'Welcome — no activity yet'
          }
          description={
            isSignedIn === false
              ? 'This demo business is empty. To see a populated demo, ask the operator to seed it with example customers and jobs — or sign up and start tracking your own.'
              : "Your AI receptionist will log calls here as customers reach out. Add your first customer to start tracking jobs and technicians."
          }
          action={
            isSignedIn === false ? (
              <Link
                to="/waitlist"
                className="btn-organic inline-flex items-center gap-2 px-5 py-2.5 rounded-md font-medium bg-primary text-primary-foreground shadow-lg shadow-primary/30"
              >
                Join the waitlist
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <a
                href="/customers"
                className="btn-organic inline-flex items-center gap-2 px-5 py-2.5 rounded-md font-medium bg-primary text-primary-foreground shadow-lg shadow-primary/30"
              >
                <Plus className="w-4 h-4" />
                Add your first customer
              </a>
            )
          }
        />
      ) : (
        <>
          {/* 2nd row — recent calls + today's schedule + recent jobs */}
          <section className="grid lg:grid-cols-3 gap-4">
            <Panel title="Recent calls" actionLabel="View all" icon={PhoneCall}>
              {calls.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No calls yet — they'll appear here as they come in.
                </div>
              ) : (
                <ul className="divide-y divide-white/[0.04]">
                  {calls.slice(0, 5).map((c) => {
                    const label = c.summary ?? c.fromPhone;
                    const badge = c.isEmergency
                      ? {
                          label: 'Emergency',
                          className:
                            'bg-danger/15 text-danger ring-danger/30',
                        }
                      : {
                          label: 'Answered',
                          className:
                            'bg-primary/15 text-primary ring-primary/30',
                        };
                    return (
                      <li
                        key={c.id}
                        className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            {c.summary ? 'Caller' : c.fromPhone}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {label}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
                            {relativeTime(c.createdAt)}
                          </span>
                          <span
                            className={[
                              'inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold ring-1',
                              badge.className,
                            ].join(' ')}
                          >
                            {badge.label}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>

            <Panel
              title="Today's schedule"
              actionLabel="Open calendar"
              icon={Sparkles}
            >
              {todayAppointments.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Nothing scheduled today. New bookings will appear here.
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {todayAppointments.map((a) => {
                    const priority = priorityBadge(a.priority);
                    return (
                      <li
                        key={a.id}
                        className="flex items-center gap-3 p-3 rounded-xl glass-card hover:bg-white/[0.06] transition-colors"
                      >
                        <span className="w-14 text-center flex-shrink-0">
                          <span className="block text-base font-bold text-foreground tabular-nums">
                            {startTimeLabel(a.start)}
                          </span>
                        </span>
                        <div className="min-w-0 flex-1 border-l border-white/[0.08] pl-3">
                          <p className="text-sm font-medium text-foreground truncate">
                            {a.customerName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {a.issue} · with {a.workerName}
                          </p>
                        </div>
                        <span
                          className={[
                            'inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold ring-1 flex-shrink-0',
                            priority.className,
                          ].join(' ')}
                        >
                          {priority.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>

            <Panel title="Recent jobs" actionLabel="View all" icon={Wrench}>
              {recentJobs.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No jobs yet — they'll appear here as calls convert into
                  work.
                </div>
              ) : (
                <ul className="divide-y divide-white/[0.04]">
                  {recentJobs.map((j) => {
                    const sb = jobStatusBadge(j.status);
                    return (
                      <li
                        key={j.id}
                        className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            {j.issue}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {j.customerName} · {j.workerName ?? 'Unassigned'}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
                            {relativeTime(j.updatedAt)}
                          </span>
                          <span
                            className={[
                              'inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold ring-1',
                              sb.className,
                            ].join(' ')}
                          >
                            {sb.label}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          </section>

          {/* 3rd row — 7-day calls chart + active techs summary */}
          <section className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Calls (7 days)
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-0.5 tabular-nums">
                    {totalCalls}
                    <span className="ml-2 text-sm font-semibold text-muted-foreground">
                      last 7 days
                    </span>
                  </p>
                </div>
              </div>
              {spark.length === 0 ? (
                <div className="h-44 flex items-center justify-center text-sm text-muted-foreground">
                  No calls in the last week.
                </div>
              ) : (
                <div className="h-44">
                  <Sparkline
                    data={spark}
                    className="w-full h-full"
                    strokeClassName="text-primary"
                    fillClassName="text-primary/15"
                  />
                </div>
              )}
            </div>

            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Active technicians
                </p>
                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-3 py-4">
                <span className="w-12 h-12 rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </span>
                <div>
                  <p className="text-3xl font-bold text-foreground tabular-nums">
                    {activeTechnicians}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activeTechnicians === 1
                      ? 'technician active'
                      : 'technicians active'}
                  </p>
                </div>
              </div>
              {isSignedIn === false ? (
                <Link
                  to="/waitlist"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  Sign in to manage your own data
                  <ChevronRight className="w-3 h-3" />
                </Link>
              ) : (
                <a
                  href="/technicians"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  Manage team
                  <ChevronRight className="w-3 h-3" />
                </a>
              )}
            </div>
          </section>
        </>
      )}

      {/* Backend handshake pill (debug).
          - Signed in + /api/me ok  → "Clerk JWT verified · …"
          - Signed in + /api/me err → existing auth/database/general error copy
          - Signed out              → "Demo data · shared demo business"  */}
      <div className="text-xs text-muted-foreground inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-blend">
        <span
          className={[
            'w-1.5 h-1.5 rounded-full',
            isBackendError
              ? 'bg-destructive'
              : meQuery.data || statsQuery.data
                ? 'bg-success'
                : 'bg-warning',
          ].join(' ')}
        />
        {isBackendError
          ? errorKind === 'auth'
            ? 'Backend auth misconfigured'
            : errorKind === 'database'
              ? 'Backend DB unavailable'
              : 'Backend unavailable'
          : isSignedIn === false
            ? 'Demo data · shared demo business'
            : meQuery.data
              ? `Clerk JWT verified · ${meQuery.data.userId.slice(0, 12)}…`
              : 'Backend handshake: checking…'}
      </div>
    </div>
  );
}

/* ----------------- sub-components ----------------- */

function Panel({
  title,
  actionLabel,
  icon: Icon,
  children,
}: {
  title: string;
  actionLabel: string;
  icon: typeof PhoneCall;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-primary" />
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
        </div>
        <button
          type="button"
          className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-0.5"
        >
          {actionLabel}
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      {children}
    </div>
  );
}
