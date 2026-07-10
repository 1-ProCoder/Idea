import { useState } from 'react';
import { Save, MessageSquare, Mail, Smartphone } from 'lucide-react';

import { PageHeader } from '../../components/layout/PageHeader';
import { FieldRow, SettingsCard, Toggle } from '../../components/settings/SettingsPrimitives';

type Channel = {
  key: 'sms' | 'email' | 'push';
  label: string;
  description: string;
  icon: typeof MessageSquare;
  recipient: string;
};

const CHANNELS: Channel[] = [
  {
    key: 'sms',
    label: 'SMS',
    description: 'Send to a phone number. Carrier rates may apply.',
    icon: MessageSquare,
    recipient: '+1 (555) 010-2200',
  },
  {
    key: 'email',
    label: 'Email',
    description: 'Send to any email — staff, owners, customer CC.',
    icon: Mail,
    recipient: 'ops@flowfix.example',
  },
  {
    key: 'push',
    label: 'Push notification',
    description: 'Mobile app push via our iOS / Android apps.',
    icon: Smartphone,
    recipient: 'All team devices',
  },
];

type AlertKey =
  | 'missed-call'
  | 'emergency'
  | 'new-customer'
  | 'invoice-paid'
  | 'tech-on-route';

type Channels = 'sms' | 'email' | 'push';
type AlertMatrix = Record<AlertKey, Record<Channels, boolean>>;

const ALERT_DEFAULTS: AlertMatrix = {
  'missed-call':   { sms: true,  email: true,  push: true  },
  emergency:       { sms: true,  email: true,  push: true  },
  'new-customer':  { sms: false, email: false, push: false },
  'invoice-paid':  { sms: false, email: true,  push: false },
  'tech-on-route': { sms: false, email: false, push: true  },
};

const ALERTS: Array<{
  key: AlertKey;
  label: string;
  description: string;
}> = [
  {
    key: 'missed-call',
    label: 'Missed call',
    description: "When the AI can't reach anyone and the call is dropped.",
  },
  {
    key: 'emergency',
    label: 'Emergency escalation',
    description: 'AI flagged a flood, leak, gas, or explicit urgency.',
  },
  {
    key: 'new-customer',
    label: 'New customer record',
    description: 'When the AI captures a brand-new phone number.',
  },
  {
    key: 'invoice-paid',
    label: 'Invoice paid',
    description: 'When Stripe confirms payment for an invoice.',
  },
  {
    key: 'tech-on-route',
    label: 'Technician en route',
    description: 'When a tech is dispatched to a job.',
  },
];

export default function NotificationsSettings(): JSX.Element {
  const [channel, setChannel] = useState<Record<Channels, boolean>>({
    sms: true,
    email: true,
    push: true,
  });
  const [alerts, setAlerts] = useState<AlertMatrix>(ALERT_DEFAULTS);

  const toggleChannel = (a: AlertKey, ch: Channels) =>
    setAlerts((s) => ({
      ...s,
      [a]: { ...s[a], [ch]: !s[a][ch] },
    }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings · Notifications"
        title="Notifications"
        subtitle="Where we send alerts. Less noise, more signal."
        actions={
          <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 shadow-sm shadow-primary/30 hover:shadow-primary/50 transition-all inline-flex items-center gap-2">
            <Save className="w-4 h-4" />
            Save changes
          </button>
        }
      />

      <SettingsCard
        title="Channels"
        description="Where notifications can be delivered."
      >
        {CHANNELS.map((c) => {
          const Icon = c.icon;
          return (
            <FieldRow
              key={c.key}
              label={c.label}
              description={c.description}
            >
              <div className="flex items-center gap-3">
                <Toggle
                  checked={channel[c.key]}
                  onChange={(v) => setChannel((s) => ({ ...s, [c.key]: v }))}
                />
                <span className="text-xs text-muted-foreground font-mono ml-auto truncate">
                  {c.recipient}
                </span>
              </div>
            </FieldRow>
          );
        })}
      </SettingsCard>

      <SettingsCard
        title="Alerts"
        description="Pick which events are worth a notification per channel."
      >
        {ALERTS.map((a) => (
          <FieldRow key={a.key} label={a.label} description={a.description}>
            <div className="flex items-center gap-2 flex-wrap">
              {(['sms', 'email', 'push'] as const).map((ch) => {
                const Icon = CHANNELS.find((c) => c.key === ch)!.icon;
                const on = alerts[a.key][ch];
                return (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => toggleChannel(a.key, ch)}
                    aria-pressed={on}
                    className={[
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ring-1 transition-colors',
                      on
                        ? 'bg-primary/15 text-primary ring-primary/30 hover:bg-primary/20'
                        : 'bg-white/[0.04] text-muted-foreground ring-white/[0.06] hover:bg-white/[0.06]',
                    ].join(' ')}
                  >
                    <Icon className="w-3 h-3" />
                    {ch.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </FieldRow>
        ))}
      </SettingsCard>
    </div>
  );
}
