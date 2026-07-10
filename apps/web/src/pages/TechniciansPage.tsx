import { useMemo, useState } from 'react';
import {
  Briefcase,
  CheckCircle2,
  Phone,
  Search,
  Sparkles,
  Star,
  Truck,
  UserPlus,
  Users,
  Wrench,
} from 'lucide-react';
import { useUser } from '@clerk/clerk-react';

import { PageHeader } from '../components/layout/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { EmptyState } from '../components/ui/EmptyState';
import { useAuthedFetch } from '../hooks/useAuthedFetch';
import { useQuery } from '@tanstack/react-query';
import {
  listWorkers,
  type WorkerListResponse,
  type WorkerDto,
  type WorkerRole,
} from '../lib/api-workers';

const ROLE_LABEL: Record<WorkerRole, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  DISPATCHER: 'Dispatcher',
  TECHNICIAN: 'Technician',
};

const GRADIENTS = [
  'from-primary to-accent',
  'from-accent to-secondary',
  'from-warning to-primary',
  'from-success to-primary',
  'from-secondary to-accent',
];

function initialsFor(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2);
}

function gradientFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

export default function TechniciansPage(): JSX.Element {
  const { isLoaded } = useUser();
  const fetch = useAuthedFetch();
  const [search, setSearch] = useState('');

  const workersQuery = useQuery<WorkerListResponse>({
    queryKey: ['workers', {}],
    queryFn: () => fetch((token) => listWorkers(token, {})),
    enabled: isLoaded,
    staleTime: 30_000,
  });

  const workers: WorkerDto[] = workersQuery.data?.items ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return workers;
    return workers.filter((w) => {
      const hay = `${w.name} ${w.role} ${w.email ?? ''} ${w.phone ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [workers, search]);

  const total = workers.length;
  const activeCount = workers.filter((w) => w.active).length;

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8 pb-32 space-y-8">
      <PageHeader
        eyebrow="Technicians"
        title="Engineers & dispatch"
        subtitle="See who's on your team. Invite engineers to start dispatching jobs."
        actions={
          <a
            href="/settings/team"
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium shadow-sm shadow-primary/30 hover:shadow-primary/50 transition-all inline-flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Invite technician
          </a>
        }
      />

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total team"
          value={String(total)}
          icon={Users}
          accent="primary"
        />
        <StatCard
          label="Active"
          value={String(activeCount)}
          icon={CheckCircle2}
          accent="success"
        />
        <StatCard
          label="Admins"
          value={String(workers.filter((w) => w.role !== 'TECHNICIAN').length)}
          icon={Briefcase}
        />
        <StatCard
          label="Technicians"
          value={String(workers.filter((w) => w.role === 'TECHNICIAN').length)}
          icon={Truck}
          accent="accent"
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search technicians\u2026"
              className="w-full h-9 pl-8 pr-3 rounded-lg glass-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
        </div>

        {workersQuery.isPending && (
          <div
            className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3"
            role="status"
            aria-label="Loading technicians"
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card rounded-2xl p-5 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/5 rounded bg-muted" />
                    <div className="h-3 w-2/5 rounded bg-muted" />
                    <div className="h-3 w-1/3 rounded bg-muted" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {workersQuery.isError && (
          <div
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/10 p-4"
          >
            <p className="font-medium text-destructive">
              Couldn't load technicians
            </p>
            <p className="text-sm text-destructive/80 mt-1">
              {(() => {
                const err = workersQuery.error as { message?: string };
                return err?.message ?? 'Unknown error';
              })()}
            </p>
          </div>
        )}

        {workers.length === 0 &&
          !workersQuery.isPending &&
          !workersQuery.isError && (
            <EmptyState
              icon={Users}
              title="No technicians yet"
              description="Invite your first engineer to start dispatching jobs. They'll receive a magic-link sign-up."
              action={
                <a
                  href="/settings/team"
                  className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Invite technician
                </a>
              }
            />
          )}

        {filtered.length === 0 && workers.length > 0 && (
          <EmptyState
            icon={Search}
            title="No technicians match"
            description="Try a different name or role keyword."
          />
        )}

        {filtered.length > 0 && (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((w) => (
              <WorkerCard key={w.id} worker={w} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function WorkerCard({ worker }: { worker: WorkerDto }): JSX.Element {
  return (
    <div className="glass-card rounded-2xl p-5 hover:border-white/[0.16] hover:bg-white/[0.06] transition-all group">
      <div className="flex items-start gap-3">
        <span
          className={[
            'w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20',
            gradientFor(worker.id),
          ].join(' ')}
        >
          {initialsFor(worker.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">
            {worker.name}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {ROLE_LABEL[worker.role]}
          </p>
          <span
            className={[
              'mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ring-1',
              worker.active
                ? 'bg-success/15 text-success ring-success/30'
                : 'bg-muted text-muted-foreground ring-white/[0.08]',
            ].join(' ')}
          >
            <span
              className={[
                'w-1 h-1 rounded-full',
                worker.active
                  ? 'bg-success animate-pulse'
                  : 'bg-muted-foreground',
              ].join(' ')}
            />
            {worker.active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {worker.phone ? (
          <div className="rounded-lg glass-card p-2.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Phone
            </p>
            <p className="text-sm font-mono text-foreground mt-0.5 truncate">
              {worker.phone}
            </p>
          </div>
        ) : (
          <div className="rounded-lg glass-card p-2.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Phone
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">\u2014</p>
          </div>
        )}
        {worker.email ? (
          <div className="rounded-lg glass-card p-2.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Email
            </p>
            <p className="text-sm text-foreground mt-0.5 truncate">
              {worker.email}
            </p>
          </div>
        ) : (
          <div className="rounded-lg glass-card p-2.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Email
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">\u2014</p>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button className="flex-1 h-8 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors">
          Assign
        </button>
        {worker.phone && (
          <a
            href={`tel:${worker.phone}`}
            className="h-8 w-8 rounded-lg glass-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label={`Call ${worker.name}`}
          >
            <Phone className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
