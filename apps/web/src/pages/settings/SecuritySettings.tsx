import {
  Download,
  KeyRound,
  Laptop,
  Smartphone,
  Shield,
  Trash2,
} from 'lucide-react';

import { PageHeader } from '../../components/layout/PageHeader';
import { SettingsCard, Toggle } from '../../components/settings/SettingsPrimitives';

type Session = {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current: boolean;
  icon: typeof Laptop;
};

const SESSIONS: Session[] = [
  {
    id: 's1',
    device: 'MacBook Pro · Chrome',
    location: 'Brighton, UK',
    lastActive: 'Active now',
    current: true,
    icon: Laptop,
  },
  {
    id: 's2',
    device: 'iPhone 15 · FlowFix app',
    location: 'Brighton, UK',
    lastActive: '12 min ago',
    current: false,
    icon: Smartphone,
  },
];

const API_KEYS = [
  {
    id: 'flowfix_live_test_8a3c91f2e4d6a0b7',
    label: 'Local dev',
    created: 'Jun 28, 2026',
    lastUsed: '2 min ago',
  },
  {
    id: 'flowfix_live_81bdf7c2e9a35b08',
    label: 'Production webhook',
    created: 'Jul 2, 2026',
    lastUsed: '14 min ago',
  },
];

function maskKey(key: string): string {
  // Show the prefix + last 4 only. Never render the full secret in client code
  // outside of an intentional reveal action.
  if (key.length <= 12) return key;
  return `${key.slice(0, 12)}\u2026${key.slice(-4)}`;
}

const AUDIT_LOG = [
  {
    who: 'Nauman A.',
    what: 'Updated AI Receptionist voice to Marcus',
    when: '12 min ago',
  },
  {
    who: 'Nauman A.',
    what: 'Invited aisha@flowfix.example as Dispatcher',
    when: '1 h ago',
  },
  {
    who: 'system',
    what: 'Twilio webhook delivery: 200 OK',
    when: '14 min ago',
  },
  {
    who: 'system',
    what: 'Auto-created customer from call (555) 234-8910',
    when: '2 min ago',
  },
];

export default function SecuritySettings(): JSX.Element {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings · Security"
        title="Security"
        subtitle="Sign-in, sessions, API keys, audit log, and data export."
      />

      <SettingsCard
        title="Two-factor authentication"
        description="Require a one-time code from an authenticator app on top of your password."
        actions={
          <Toggle checked={false} onChange={() => {}} />
        }
      >
        <div className="rounded-xl glass-card p-3 flex items-start gap-3">
          <span className="w-9 h-9 rounded-lg bg-warning/15 text-warning ring-1 ring-warning/30 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">2FA disabled</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Strongly recommended for Owner and Admin accounts.
            </p>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Active sessions"
        description={`${SESSIONS.length} active sessions · sign out from any device you don't recognise.`}
      >
        <ul className="space-y-2">
          {SESSIONS.map((s) => {
            const Icon = s.icon;
            return (
              <li
                key={s.id}
                className="flex items-center gap-3 p-3 rounded-xl glass-card hover:bg-white/[0.06] transition-colors"
              >
                <span className="w-9 h-9 rounded-lg bg-white/[0.04] text-muted-foreground ring-1 ring-white/[0.06] flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {s.device}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {s.location} · {s.lastActive}
                  </p>
                </div>
                {s.current ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-success/15 text-success ring-1 ring-success/30">
                    This device
                  </span>
                ) : (
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-md text-xs font-semibold bg-danger/15 text-danger hover:bg-danger/20 ring-1 ring-danger/30 inline-flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3 h-3" />
                    Sign out
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </SettingsCard>

      <SettingsCard
        title="API keys"
        description="Use API keys to integrate FlowFix with your own tooling."
        actions={
          <button className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 shadow-sm shadow-primary/30 transition-all inline-flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5" />
            New key
          </button>
        }
      >
        <ul className="space-y-2">
          {API_KEYS.map((k) => (
            <li
              key={k.id}
              className="flex items-center gap-3 p-3 rounded-xl glass-card hover:bg-white/[0.06] transition-colors"
            >
              <span className="w-9 h-9 rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30 flex items-center justify-center flex-shrink-0">
                <KeyRound className="w-4 h-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {k.label}
                </p>
                <p className="text-xs text-muted-foreground font-mono truncate">
                  <span title="Hidden for security — click reveal to view">{maskKey(k.id)}</span>
                  {' \u00b7 '}created {k.created}
                </p>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">
                {k.lastUsed}
              </span>
              <button
                type="button"
                aria-label="Revoke key"
                className="text-muted-foreground hover:text-danger p-1 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      </SettingsCard>

      <SettingsCard title="Audit log" description="Last 4 events (older entries in /activity).">
        <ul className="space-y-2">
          {AUDIT_LOG.map((e, i) => (
            <li
              key={i}
              className="p-3 rounded-xl glass-card flex items-start gap-3"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {e.what}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  by {e.who} · {e.when}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </SettingsCard>

      <SettingsCard
        title="Data export"
        description="Request a copy of all your team's data. Delivered as a zip in under an hour."
        actions={
          <button className="px-3 py-1.5 rounded-lg glass-card text-xs font-semibold text-foreground/90 hover:text-foreground hover:bg-white/[0.06] transition-colors inline-flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" />
            Request export
          </button>
        }
      >
        <p className="text-xs text-muted-foreground leading-relaxed">
          Includes customers, jobs, call transcripts, invoices, and audit log.
          Encrypted at rest with your account's recovery key; you can re-download
          for 30 days.
        </p>
      </SettingsCard>
    </div>
  );
}
