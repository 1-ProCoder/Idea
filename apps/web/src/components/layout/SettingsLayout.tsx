import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  Building2,
  CreditCard,
  KeyRound,
  Plug,
  Settings as SettingsIcon,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react';

export type SettingsSection = {
  key: string;
  title: string;
  description: string;
  icon: LucideIcon;
  status: 'Live' | 'Setup' | 'Soon';
  count?: string;
  accent: 'primary' | 'accent' | 'success' | 'warning' | 'danger';
};

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    key: 'general',
    title: 'General',
    description: 'Company name, timezone, business hours, language, theme.',
    icon: SettingsIcon,
    status: 'Live',
    accent: 'primary',
  },
  {
    key: 'company',
    title: 'Company',
    description:
      'Business details, logo, address, service areas, contact info.',
    icon: Building2,
    status: 'Live',
    accent: 'primary',
  },
  {
    key: 'team',
    title: 'Team',
    description:
      'Invite members, assign roles, set permissions, view activity.',
    icon: Users,
    status: 'Live',
    count: '3 members',
    accent: 'primary',
  },
  {
    key: 'ai-receptionist',
    title: 'AI Receptionist',
    description:
      'Voice, greeting, call-handling rules, emergency escalation, booking preferences.',
    icon: Sparkles,
    status: 'Live',
    accent: 'accent',
  },
  {
    key: 'notifications',
    title: 'Notifications',
    description:
      'SMS, email, push, missed-call alerts, emergency escalations.',
    icon: Bell,
    status: 'Live',
    accent: 'primary',
  },
  {
    key: 'integrations',
    title: 'Integrations',
    description:
      'Twilio, Clerk, Google Calendar, Stripe, QuickBooks, Zapier.',
    icon: Plug,
    status: 'Setup',
    count: '2 of 6 connected',
    accent: 'warning',
  },
  {
    key: 'billing',
    title: 'Billing',
    description:
      'Current plan, usage, invoices, payment methods, upgrade.',
    icon: CreditCard,
    status: 'Live',
    accent: 'success',
  },
  {
    key: 'security',
    title: 'Security',
    description: '2FA, sessions, API keys, audit logs, data export.',
    icon: KeyRound,
    status: 'Live',
    accent: 'danger',
  },
];

const accentMap: Record<
  SettingsSection['accent'],
  { icon: string; badge: string }
> = {
  primary: {
    icon: 'bg-primary/15 text-primary ring-primary/30',
    badge: 'bg-primary/15 text-primary ring-1 ring-primary/30',
  },
  accent: {
    icon: 'bg-accent/15 text-accent ring-accent/30',
    badge: 'bg-accent/15 text-accent ring-1 ring-accent/30',
  },
  success: {
    icon: 'bg-success/15 text-success ring-success/30',
    badge: 'bg-success/15 text-success ring-1 ring-success/30',
  },
  warning: {
    icon: 'bg-warning/15 text-warning ring-warning/30',
    badge: 'bg-warning/15 text-warning ring-1 ring-warning/30',
  },
  danger: {
    icon: 'bg-danger/15 text-danger ring-danger/30',
    badge: 'bg-danger/15 text-danger ring-1 ring-danger/30',
  },
};

const statusBadge: Record<SettingsSection['status'], string> = {
  Live: 'bg-success/15 text-success ring-1 ring-success/30',
  Setup: 'bg-warning/15 text-warning ring-1 ring-warning/30',
  Soon: 'bg-muted text-muted-foreground ring-1 ring-white/[0.08]',
};

export function SettingsLayout(): JSX.Element {
  const location = useLocation();
  const activeKey = location.pathname.split('/').filter(Boolean).pop() ?? '';

  const SidebarItem = ({ s }: { s: SettingsSection }) => {
    const Icon = s.icon;
    const isActive = s.key === activeKey;
    return (
      <NavLink
        to={`/settings/${s.key}`}
        className={[
          'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors',
          isActive
            ? 'bg-white/[0.06] text-foreground ring-1 ring-white/[0.08]'
            : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]',
        ].join(' ')}
        aria-current={isActive ? 'page' : undefined}
      >
        <span
          className={[
            'w-7 h-7 rounded-md flex items-center justify-center ring-1 flex-shrink-0',
            isActive
              ? accentMap[s.accent].icon
              : 'bg-white/[0.04] text-muted-foreground ring-white/[0.06]',
          ].join(' ')}
        >
          <Icon className="w-3.5 h-3.5" />
        </span>
        <span className="flex-1 min-w-0 truncate">{s.title}</span>
        {s.status && (
          <span
            className={statusBadge[s.status]}
          >
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider">
              {s.status}
            </span>
          </span>
        )}
      </NavLink>
    );
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8 pb-32">
      {/* Mobile pill nav */}
      <div className="lg:hidden mb-6 glass-card rounded-2xl p-3">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin -mx-1 px-1">
          {SETTINGS_SECTIONS.map((s) => (
            <SidebarItem key={s.key} s={s} />
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[240px_minmax(0,1fr)] gap-6 lg:gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block lg:sticky lg:top-[88px] self-start">
          <div className="glass-card rounded-2xl p-2">
            <div className="px-2.5 py-1.5 mb-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Sections
              </p>
            </div>
            <nav className="space-y-0.5" aria-label="Settings sections">
              {SETTINGS_SECTIONS.map((s) => (
                <SidebarItem key={s.key} s={s} />
              ))}
            </nav>
          </div>
          <NavLink
            to="/dashboard"
            className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to dashboard
          </NavLink>
        </aside>

        {/* Content */}
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
