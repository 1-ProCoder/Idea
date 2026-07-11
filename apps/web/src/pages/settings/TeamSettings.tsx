import { useMemo, useState } from 'react';
import {
  Briefcase,
  CheckCircle2,
  MoreHorizontal,
  Plus,
  Search,
  Truck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { JSX } from 'react';

import { PageHeader } from '../../components/layout/PageHeader';
import {
  FieldRow,
  Select,
  SettingsCard,
  TextInput,
  Toggle,
} from '../../components/settings/SettingsPrimitives';
import { EmptyState } from '../../components/ui/EmptyState';
import { useOptionalFetch } from '../../hooks/useAuthedFetch';
import {
  createWorker,
  deleteWorker,
  listWorkers,
  type ApiError as ApiErrorT,
  type WorkerDto,
  type WorkerListResponse,
  type WorkerRole,
} from '../../lib/api-workers';

const ROLE_LABEL: Record<WorkerRole, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  DISPATCHER: 'Dispatcher',
  TECHNICIAN: 'Technician',
};

export default function TeamSettings(): JSX.Element {
  const fetch = useOptionalFetch();
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<WorkerRole>('TECHNICIAN');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [sendsInvites, setSendsInvites] = useState(true);

  const workersQuery = useQuery<WorkerListResponse>({
    queryKey: ['workers', {}],
    queryFn: () => fetch((token) => listWorkers(token, {})),
    staleTime: 30_000,
  });

  const workers: WorkerDto[] = workersQuery.data?.items ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return workers;
    return workers.filter((w) =>
      `${w.name} ${w.role} ${w.email ?? ''} ${w.phone ?? ''}`
        .toLowerCase()
        .includes(q),
    );
  }, [workers, search]);

  const create = useMutation({
    mutationFn: (input: {
      name: string;
      role: WorkerRole;
      phone: string | null;
      email: string | null;
      active: boolean;
    }) => fetch((token) => createWorker(token, input)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workers'] });
      setName('');
      setPhone('');
      setEmail('');
      setShowInvite(false);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => fetch((token) => deleteWorker(token, id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workers'] });
    },
  });

  function invite() {
    if (!name.trim() || create.isPending) return;
    create.mutate({
      name: name.trim(),
      role,
      phone: phone.trim() || null,
      email: email.trim() || null,
      // Magic-link invites to Clerk are deferred. The toggle is a
      // forward-facing affordance so the UI doesn't go stale when
      // invites ship. Today the row is just created active.
      active: true,
    });
  }

  const total = workers.length;
  const activeCount = workers.filter((w) => w.active).length;

  const createErrorMessage = create.isError
    ? ((create.error as unknown as ApiErrorT | null)?.message ?? 'Failed')
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings · Team"
        title="Team"
        subtitle="Roster + roles. Use the toggle below to invite via Clerk when wiring is enabled."
        actions={
          <button
            type="button"
            onClick={() => setShowInvite((v) => !v)}
            className="btn-organic inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium shadow-sm shadow-primary/30"
          >
            <UserPlus className="w-4 h-4" />
            {showInvite ? 'Close' : 'Add worker'}
          </button>
        }
      />

      <SettingsCard
        title="Borderless stats"
        description="At-a-glance totals pulled directly from your worker roster."
      >
        <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
          <PillStat icon={Users} label="Total team" value={total} tone="primary" />
          <PillStat
            icon={CheckCircle2}
            label="Active"
            value={activeCount}
            tone="success"
          />
          <PillStat
            icon={Briefcase}
            label="Admins"
            value={workers.filter((w) => w.role !== 'TECHNICIAN').length}
            tone="accent"
          />
          <PillStat
            icon={Truck}
            label="Technicians"
            value={workers.filter((w) => w.role === 'TECHNICIAN').length}
            tone="warning"
          />
        </div>
      </SettingsCard>

      {showInvite && (
        <SettingsCard
          title="Add worker"
          description={
            sendsInvites
              ? 'We are stubbing the Clerk invite. The worker is created active so jobs can already be assigned.'
              : 'Adding without sending invites — they show up in the roster immediately.'
          }
        >
          <FieldRow label="Full name" htmlFor="invite-name">
            <TextInput
              id="invite-name"
              value={name}
              onChange={setName}
              placeholder="Jane Smith"
            />
          </FieldRow>
          <FieldRow label="Role" htmlFor="invite-role">
            <Select
              id="invite-role"
              value={role}
              onChange={(v) => setRole(v as WorkerRole)}
              options={[
                { value: 'TECHNICIAN', label: 'Technician' },
                { value: 'DISPATCHER', label: 'Dispatcher' },
                { value: 'ADMIN', label: 'Admin' },
                { value: 'OWNER', label: 'Owner' },
              ]}
            />
          </FieldRow>
          <FieldRow label="Phone" htmlFor="invite-phone">
            <TextInput
              id="invite-phone"
              type="tel"
              value={phone}
              onChange={setPhone}
              placeholder="+1 (555) 123-4567"
            />
          </FieldRow>
          <FieldRow label="Email" htmlFor="invite-email">
            <TextInput
              id="invite-email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="jane@vossplumbing.com"
            />
          </FieldRow>
          <FieldRow
            label="Send magic-link invite"
            description="When Clerk wiring lands, this triggers an email. Today the row is just created."
          >
            <Toggle
              checked={sendsInvites}
              onChange={setSendsInvites}
              label={sendsInvites ? 'On' : 'Off'}
            />
          </FieldRow>

          <div className="flex items-center justify-end gap-3 flex-wrap pt-1">
            {createErrorMessage && (
              <span className="text-danger text-xs">{createErrorMessage}</span>
            )}
            <button
              type="button"
              onClick={() => setShowInvite(false)}
              className="px-4 py-2 rounded-lg glass-blend text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={invite}
              disabled={!name.trim() || create.isPending}
              className="btn-organic inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold shadow-sm shadow-primary/30 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Add to team
            </button>
          </div>
        </SettingsCard>
      )}

      <SettingsCard
        title="Roster"
        description="Soft-deletes keep historical job attribution intact."
      >
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workers..."
            className="w-full h-9 pl-8 pr-3 rounded-lg glass-blend text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
        </div>

        {workersQuery.isPending && (
          <ul
            className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3"
            role="status"
            aria-label="Loading workers"
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <li
                key={i}
                className="glass-card rounded-2xl p-5 animate-pulse h-[8rem]"
              />
            ))}
          </ul>
        )}

        {!workersQuery.isPending && workers.length === 0 && (
          <EmptyState
            icon={Users}
            title="No workers yet"
            description="Add the first teammate to start assigning jobs."
            action={
              <button
                type="button"
                onClick={() => setShowInvite(true)}
                className="btn-organic inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
              >
                <UserPlus className="w-4 h-4" />
                Add first worker
              </button>
            }
          />
        )}

        {!workersQuery.isPending && workers.length > 0 && filtered.length === 0 && (
          <EmptyState
            icon={Search}
            title="No matches"
            description="Try a different name or phone."
          />
        )}

        {filtered.length > 0 && (
          <ul className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((w) => (
              <WorkerRow
                key={w.id}
                worker={w}
                disabled={remove.isPending}
                onRemove={() => remove.mutate(w.id)}
              />
            ))}
          </ul>
        )}
      </SettingsCard>
    </div>
  );
}

function PillStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  tone: 'primary' | 'success' | 'accent' | 'warning';
}): JSX.Element {
  const toneRing: Record<typeof tone, string> = {
    primary: 'ring-primary/30 text-primary',
    success: 'ring-success/30 text-success',
    accent: 'ring-accent/30 text-accent',
    warning: 'ring-warning/30 text-warning',
  };
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={[
          'w-9 h-9 rounded-lg bg-white/[0.04] ring-1 flex items-center justify-center',
          toneRing[tone],
        ].join(' ')}
      >
        <Icon className="w-4 h-4" />
      </span>
      <div>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 text-2xl font-bold tracking-tight text-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}

function WorkerRow({
  worker,
  disabled,
  onRemove,
}: {
  worker: WorkerDto;
  disabled: boolean;
  onRemove: () => void;
}): JSX.Element {
  const initials = worker.name
    .split(/\s+/)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2);
  return (
    <li className="glass-card rounded-2xl p-5 flex items-start gap-3 group">
      <span className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
        {initials}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground truncate">
          {worker.name}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {ROLE_LABEL[worker.role]}
          {worker.phone ? ` · ${worker.phone}` : ''}
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
      <div className="relative">
        <details className="group/menu">
          <summary
            className="list-none w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/[0.06] cursor-pointer"
            aria-label="Open row actions"
          >
            <MoreHorizontal className="w-4 h-4" />
          </summary>
          <div className="absolute right-0 top-9 z-10 w-44 rounded-lg glass-card-strong p-1 shadow-lg shadow-black/40">
            <button
              type="button"
              onClick={onRemove}
              disabled={disabled || !worker.active}
              className="w-full text-left px-3 py-2 rounded-md text-sm text-danger hover:bg-danger/10 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              <X className="w-3.5 h-3.5" />
              {worker.active ? 'Deactivate' : 'Already inactive'}
            </button>
          </div>
        </details>
      </div>
    </li>
  );
}
