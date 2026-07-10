import { Phone, KeyRound, Calendar, CreditCard, BookOpen, Zap } from 'lucide-react';

import { PageHeader } from '../../components/layout/PageHeader';
import { SettingsCard } from '../../components/settings/SettingsPrimitives';
import type { LucideIcon } from 'lucide-react';

type Integration = {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  status: 'Connected' | 'Available';
  category: 'Telephony' | 'Identity' | 'Calendar' | 'Payments' | 'Accounting' | 'Automation';
};

const INTEGRATIONS: Integration[] = [
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'Powers inbound + outbound calls, SMS notifications.',
    icon: Phone,
    status: 'Connected',
    category: 'Telephony',
  },
  {
    id: 'clerk',
    name: 'Clerk',
    description: 'Authentication, user management, sessions.',
    icon: KeyRound,
    status: 'Connected',
    category: 'Identity',
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Two-way sync of jobs and driver schedules.',
    icon: Calendar,
    status: 'Available',
    category: 'Calendar',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Invoices, payments, payout reports.',
    icon: CreditCard,
    status: 'Available',
    category: 'Payments',
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Daily journal of completed jobs, taxes, expenses.',
    icon: BookOpen,
    status: 'Available',
    category: 'Accounting',
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: '5,000+ apps via webhook triggers and actions.',
    icon: Zap,
    status: 'Available',
    category: 'Automation',
  },
];

export default function IntegrationsSettings(): JSX.Element {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings · Integrations"
        title="Integrations"
        subtitle="Connect the rest of your stack. Two connected · four ready to add."
      />

      <SettingsCard
        title="All integrations"
        description="Click Connect to OAuth-install. Disconnect stops the sync but keeps the history."
      >
        <div className="space-y-2">
          {INTEGRATIONS.map((i) => {
            const Icon = i.icon;
            const connected = i.status === 'Connected';
            return (
              <div
                key={i.id}
                className="flex items-center gap-3 p-3 rounded-xl glass-card hover:bg-white/[0.06] transition-colors"
              >
                <span
                  className={[
                    'w-10 h-10 rounded-lg flex items-center justify-center ring-1 flex-shrink-0',
                    connected
                      ? 'bg-success/15 text-success ring-success/30'
                      : 'bg-white/[0.04] text-muted-foreground ring-white/[0.06]',
                  ].join(' ')}
                >
                  <Icon className="w-5 h-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">
                      {i.name}
                    </p>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {i.category}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {i.description}
                  </p>
                </div>
                {connected ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-success/15 text-success ring-1 ring-success/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    Connected
                  </span>
                ) : null}
                <button
                  type="button"
                  className={[
                    'px-3 py-1.5 rounded-md text-xs font-semibold transition-colors',
                    connected
                      ? 'bg-white/[0.04] text-muted-foreground hover:text-foreground ring-1 ring-white/[0.06]'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/30',
                  ].join(' ')}
                >
                  {connected ? 'Manage' : 'Connect'}
                </button>
              </div>
            );
          })}
        </div>
      </SettingsCard>
    </div>
  );
}
