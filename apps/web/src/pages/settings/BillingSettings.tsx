import { CreditCard, Download, Sparkles, TrendingUp } from 'lucide-react';

import { PageHeader } from '../../components/layout/PageHeader';
import { SettingsCard } from '../../components/settings/SettingsPrimitives';

const INVOICES = [
  { id: 'inv_2026_07', date: 'Jul 1, 2026', amount: '$0.00', status: 'Draft' },
  { id: 'inv_2026_06', date: 'Jun 1, 2026', amount: '$0.00', status: 'Paid' },
  { id: 'inv_2026_05', date: 'May 1, 2026', amount: '$0.00', status: 'Paid' },
];

export default function BillingSettings(): JSX.Element {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings · Billing"
        title="Billing"
        subtitle="Plan, usage, invoices, and payment method."
      />

      <SettingsCard
        title="Current plan"
        description="Free during development. No credit card required."
        actions={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/15 text-accent ring-1 ring-accent/30 text-[10px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            Developer · Free
          </span>
        }
      >
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { label: 'Minutes answered', value: '124', max: '∞', accent: 'primary' },
            { label: 'Bookings', value: '38', max: '∞', accent: 'success' },
            { label: 'Team seats', value: '4', max: '∞', accent: 'accent' },
          ].map((s) => (
            <div key={s.label} className="glass-card rounded-xl p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {s.label}
              </p>
              <p className="text-2xl font-bold text-foreground tabular-nums mt-1">
                {s.value}
              </p>
              <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                of {s.max}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 shadow-sm shadow-primary/30 hover:shadow-primary/50 transition-all inline-flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Upgrade to Pro
          </button>
          <button className="px-4 py-2 rounded-lg glass-card text-sm font-semibold text-foreground/90 hover:text-foreground hover:bg-white/[0.06] transition-colors">
            Compare plans
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
          Pro plan launches with detailed analytics, multi-tenant role permissions,
          and custom AI voice clones. Reserve your spot.
        </p>
      </SettingsCard>

      <SettingsCard
        title="Payment method"
        description="Add a card before you upgrade. Encrypted at rest, never logged."
        actions={
          <button className="px-3 py-1.5 rounded-lg glass-card text-xs font-semibold text-foreground/90 hover:text-foreground hover:bg-white/[0.06] transition-colors inline-flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5" />
            Add card
          </button>
        }
      >
        <div className="flex items-center gap-3 p-3 rounded-xl glass-card">
          <span className="w-10 h-10 rounded-lg bg-white/[0.04] text-muted-foreground ring-1 ring-white/[0.06] flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-5 h-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">
              No payment method on file
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Required for Pro plan upgrades.
            </p>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Invoices"
        description="Download any past invoice for your records."
      >
        <ul className="space-y-2">
          {INVOICES.map((inv) => (
            <li
              key={inv.id}
              className="flex items-center gap-3 p-3 rounded-xl glass-card hover:bg-white/[0.06] transition-colors"
            >
              <span className="w-9 h-9 rounded-lg bg-white/[0.04] text-muted-foreground ring-1 ring-white/[0.06] flex items-center justify-center flex-shrink-0 font-mono text-[10px]">
                {inv.id.slice(-2)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {inv.date}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  {inv.id}
                </p>
              </div>
              <p className="text-sm font-semibold text-foreground tabular-nums">
                {inv.amount}
              </p>
              <span
                className={[
                  'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ring-1',
                  inv.status === 'Paid'
                    ? 'bg-success/15 text-success ring-success/30'
                    : 'bg-muted text-muted-foreground ring-white/[0.08]',
                ].join(' ')}
              >
                {inv.status}
              </span>
              <button
                type="button"
                aria-label="Download invoice"
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <Download className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      </SettingsCard>
    </div>
  );
}
