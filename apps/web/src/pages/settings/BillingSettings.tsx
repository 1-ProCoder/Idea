import { useMutation, useQuery } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-react';
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Headphones,
  Loader2,
  PhoneCall,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import type { JSX } from 'react';

import { PageHeader } from '../../components/layout/PageHeader';
import {
  FieldRow,
  SettingsCard,
  TextInput,
} from '../../components/settings/SettingsPrimitives';
import { useAuthedFetch } from '../../hooks/useAuthedFetch';
import {
  getUsage,
  type UsageDto,
} from '../../lib/api-usage';

const PLAN = {
  name: 'Pro',
  pricePerMonth: 149,
  renewal: 'Renews Jan 15, 2026',
  features: [
    'Unlimited AI-answered calls',
    'Smart dispatch + emergency escalation',
    'Custom AI voice + greeting',
    'Up to 10 team members',
    'Priority phone support',
  ],
};

type Stat = {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  tone?: 'primary' | 'accent' | 'warning' | 'success';
};

function buildStats(usage: UsageDto): Stat[] {
  return [
    {
      label: 'Customers',
      value: usage.customers.toLocaleString(),
      icon: Users,
      tone: 'primary',
      hint: 'All-time on this account',
    },
    {
      label: 'Jobs',
      value: usage.jobs.total.toLocaleString(),
      icon: Briefcase,
      tone: 'accent',
      hint: `${usage.jobs.pending} pending · ${usage.jobs.scheduled} scheduled`,
    },
    {
      label: 'Calls',
      value: usage.calls.total.toLocaleString(),
      icon: PhoneCall,
      tone: 'warning',
      hint: `${usage.calls.emergency} emergency`,
    },
    {
      label: 'Appointments',
      value: usage.appointments.total.toLocaleString(),
      icon: Calendar,
      tone: 'success',
      hint: `${usage.appointments.today} scheduled today`,
    },
  ];
}

export default function BillingSettings(): JSX.Element {
  const { isLoaded } = useUser();
  const fetch = useAuthedFetch();

  const query = useQuery<UsageDto>({
    queryKey: ['usage'],
    queryFn: () => fetch((token) => getUsage(token)),
    enabled: isLoaded,
    staleTime: 30_000,
  });

  const stats = query.data ? buildStats(query.data) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings · Billing"
        title="Billing"
        subtitle="Current plan, real usage, and a placeholder for future in-app plan changes."
      />

      <section className="grid lg:grid-cols-[1.4fr_minmax(0,1fr)] gap-4">
        {/* Current plan */}
        <SettingsCard
          title={`Current plan — ${PLAN.name}`}
          description={`$${PLAN.pricePerMonth}/mo · ${PLAN.renewal}`}
        >
          <ul className="space-y-2">
            {PLAN.features.map((f) => (
              <li
                key={f}
                className="flex items-center gap-2 text-sm text-foreground/85"
              >
                <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-end gap-2 flex-wrap">
            <button
              type="button"
              className="btn-organic inline-flex items-center gap-2 px-4 py-2 rounded-lg glass-blend text-sm font-medium text-foreground hover:bg-white/[0.06]"
            >
              <CreditCard className="w-4 h-4" />
              Update payment method
            </button>
            <button
              type="button"
              className="btn-organic inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium shadow-sm shadow-primary/30"
            >
              <Wallet className="w-4 h-4" />
              Manage subscription
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </SettingsCard>

        {/* Account contact for billing */}
        <SettingsCard title="Billing contact">
          <FieldRow
            label="Billing email"
            description="Where invoices land. Defaults to your business email."
          >
            <TextInput
              value={
                query.data
                  ? '—'
                  : '—'
              }
              onChange={() => {
                /* read-only for now */
              }}
              placeholder="billing@yourbusiness.com"
            />
          </FieldRow>
          <p className="text-xs text-muted-foreground leading-relaxed pt-1">
            Updates flow from the Company panel. Real plan changes are
            delegated to the Stripe customer portal once it&apos;s wired.
          </p>
        </SettingsCard>
      </section>

      <SettingsCard
        title="Current usage"
        description="Live counts pulled directly from your operational tables."
      >
        {query.isPending && (
          <div
            className="grid grid-cols-2 lg:grid-cols-4 gap-3"
            role="status"
            aria-label="Loading usage"
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl glass-card p-5 animate-pulse h-[6.5rem]"
              />
            ))}
          </div>
        )}

        {query.isError && (
          <p className="text-danger text-xs">
            Couldn&apos;t load usage stats. Retry after the next tick.
          </p>
        )}

        {!query.isPending && !query.isError && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map((s) => (
              <StatTile key={s.label} stat={s} />
            ))}
          </div>
        )}

        {query.data && (
          <p className="text-[11px] text-muted-foreground/70 mt-3">
            Snapshot taken {new Date(query.data.asOf).toLocaleString()}.
          </p>
        )}
      </SettingsCard>

      <SettingsCard
        title="Support"
        description="Priority phone support ships with Pro. Chat is in-test."
      >
        <div className="flex items-center gap-3 text-sm">
          <span className="w-9 h-9 rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30 flex items-center justify-center flex-shrink-0">
            <Headphones className="w-4 h-4" />
          </span>
          <p className="text-muted-foreground leading-relaxed">
            Real-time support is included &mdash; open a priority ticket from
            any page and your call lands in under 3 minutes.
          </p>
        </div>
      </SettingsCard>
    </div>
  );
}

function StatTile({ stat }: { stat: Stat }): JSX.Element {
  const Icon = stat.icon;
  const toneRing: Record<NonNullable<Stat['tone']>, string> = {
    primary: 'text-primary ring-primary/30',
    accent: 'text-accent ring-accent/30',
    warning: 'text-warning ring-warning/30',
    success: 'text-success ring-success/30',
  };
  const ringCls = stat.tone ? toneRing[stat.tone] : 'text-muted-foreground ring-white/[0.06]';
  return (
    <div className="rounded-2xl glass-card p-5">
      <div className="flex items-start justify-between gap-3">
        <span
          className={[
            'w-9 h-9 rounded-lg bg-white/[0.04] ring-1 flex items-center justify-center',
            ringCls,
          ].join(' ')}
        >
          <Icon className="w-4 h-4" />
        </span>
      </div>
      <p className="mt-3 text-[11px] uppercase tracking-wider text-muted-foreground">
        {stat.label}
      </p>
      <p className="mt-0.5 text-2xl font-bold tracking-tight text-foreground">
        {stat.value}
      </p>
      {stat.hint && (
        <p className="mt-1 text-xs text-muted-foreground truncate">
          {stat.hint}
        </p>
      )}
    </div>
  );
}

// Acknowledge-but-unused import surface — keeps the build consistent
// if the team adds a "delete usage record" affordance later.
void Loader2;
