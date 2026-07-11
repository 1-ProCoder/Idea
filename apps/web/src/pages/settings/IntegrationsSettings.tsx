import { useUser } from '@clerk/clerk-react';
import {
  Calendar,
  CheckCircle2,
  CircleDot,
  CreditCard,
  Phone,
  Plug,
  Wallet,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { JSX } from 'react';

import { PageHeader } from '../../components/layout/PageHeader';
import { SettingsCard } from '../../components/settings/SettingsPrimitives';

type Integration = {
  key: string;
  name: string;
  description: string;
  icon: LucideIcon;
  status: 'connected' | 'available';
  badge?: string;
};

const INTEGRATIONS: Integration[] = [
  {
    key: 'twilio',
    name: 'Twilio',
    description:
      'Powers your AI-receptionist phone forwarding and outbound SMS escalations.',
    icon: Phone,
    status: 'available',
    badge: 'Phone',
  },
  {
    key: 'clerk',
    name: 'Clerk',
    description:
      'Authentication and identity. You signed in with this — it just works.',
    icon: CircleDot,
    status: 'connected',
    badge: 'Identity',
  },
  {
    key: 'google-calendar',
    name: 'Google Calendar',
    description:
      'Two-way sync so jobs booked via the AI land directly in your team calendar.',
    icon: Calendar,
    status: 'available',
    badge: 'Calendar',
  },
  {
    key: 'stripe',
    name: 'Stripe',
    description:
      'Tap-to-pay invoices and card-on-file for repeat customers.',
    icon: CreditCard,
    status: 'available',
    badge: 'Payments',
  },
  {
    key: 'quickbooks',
    name: 'QuickBooks',
    description:
      'Daily export of paid invoices and per-job expenses into your books.',
    icon: Wallet,
    status: 'available',
    badge: 'Accounting',
  },
  {
    key: 'zapier',
    name: 'Zapier',
    description:
      'Pipe FlowFix events into the 6,000+ apps you already use.',
    icon: Zap,
    status: 'available',
    badge: 'Automation',
  },
];

export default function IntegrationsSettings(): JSX.Element {
  const { isLoaded, user } = useUser();
  const isSignedIn = isLoaded && !!user;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings · Integrations"
        title="Integrations"
        subtitle="Hook FlowFix AI into the tools your business already runs on."
      />

      <SettingsCard
        title="Connected services"
        description="Tap a card to manage each integration. We never share your data without explicit signing."
      >
        <ul className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {INTEGRATIONS.map((it) => (
            <IntegrationCard
              key={it.key}
              integration={it}
              signedIn={isSignedIn}
            />
          ))}
        </ul>
      </SettingsCard>

      <SettingsCard
        title="Notes"
        description="A few ground rules while the Connect flows are stubbed."
      >
        <p className="text-sm text-muted-foreground leading-relaxed">
          Clerk is wired end-to-end &mdash; you authenticated with it. The other
          services have a UI pre-flight but the underlying OAuth exchange ships
          once those vendors&apos; partner agreements are finalised. Connect
          buttons on those cards will short-circuit to a notify-me flow until
          then.
        </p>
      </SettingsCard>
    </div>
  );
}

function IntegrationCard({
  integration,
  signedIn,
}: {
  integration: Integration;
  signedIn: boolean;
}): JSX.Element {
  const Icon = integration.icon;
  const connected = integration.status === 'connected' || (integration.key === 'clerk' && signedIn);
  return (
    <li className="glass-card rounded-2xl p-5 flex flex-col gap-4 hover:bg-white/[0.06] transition-colors">
      <div className="flex items-start gap-3">
        <span
          className="w-10 h-10 rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30 flex items-center justify-center flex-shrink-0"
          aria-hidden
        >
          <Icon className="w-5 h-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground truncate">
              {integration.name}
            </p>
            {integration.badge && (
              <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground px-1.5 py-0.5 rounded bg-white/[0.04] ring-1 ring-white/[0.06]">
                {integration.badge}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {integration.description}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/[0.06]">
        <span
          className={[
            'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ring-1',
            connected
              ? 'bg-success/15 text-success ring-success/30'
              : 'bg-muted text-muted-foreground ring-white/[0.08]',
          ].join(' ')}
        >
          {connected ? (
            <>
              <CheckCircle2 className="w-3 h-3" />
              Connected
            </>
          ) : (
            <>
              <Plug className="w-3 h-3" />
              Not connected
            </>
          )}
        </span>
        <button
          type="button"
          disabled={connected}
          className={[
            'btn-organic px-3 py-1.5 rounded-md text-xs font-semibold transition-colors',
            connected
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-primary text-primary-foreground hover:bg-primary/90',
          ].join(' ')}
        >
          {connected ? 'Manage' : 'Connect'}
        </button>
      </div>
    </li>
  );
}
