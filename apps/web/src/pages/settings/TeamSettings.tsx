import { Mail, Save, Shield, ShieldCheck, UserPlus } from 'lucide-react';

import { PageHeader } from '../../components/layout/PageHeader';
import { SettingsCard } from '../../components/settings/SettingsPrimitives';

type Member = {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Admin' | 'Dispatcher' | 'Tech';
  status: 'Active' | 'Invited';
  initials: string;
  gradient: string;
};

const MEMBERS: Member[] = [
  {
    id: 'm1',
    name: 'Nauman Ali',
    email: 'nauman@flowfix.example',
    role: 'Owner',
    status: 'Active',
    initials: 'NA',
    gradient: 'from-primary to-accent',
  },
  {
    id: 'm2',
    name: 'Sara Khan',
    email: 'sara@flowfix.example',
    role: 'Admin',
    status: 'Active',
    initials: 'SK',
    gradient: 'from-accent to-secondary',
  },
  {
    id: 'm3',
    name: 'Diego Perez',
    email: 'diego@flowfix.example',
    role: 'Tech',
    status: 'Active',
    initials: 'DP',
    gradient: 'from-warning to-primary',
  },
  {
    id: 'm4',
    name: 'Aisha Khan',
    email: 'aisha@flowfix.example',
    role: 'Dispatcher',
    status: 'Invited',
    initials: 'AK',
    gradient: 'from-success to-primary',
  },
];

const roleClass: Record<Member['role'], string> = {
  Owner: 'bg-primary/15 text-primary ring-1 ring-primary/30',
  Admin: 'bg-accent/15 text-accent ring-1 ring-accent/30',
  Dispatcher: 'bg-success/15 text-success ring-1 ring-success/30',
  Tech: 'bg-muted text-muted-foreground ring-1 ring-white/[0.08]',
};

export default function TeamSettings(): JSX.Element {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings · Team"
        title="Team"
        subtitle="Invite members, assign roles, control permissions, review activity."
        actions={
          <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 shadow-sm shadow-primary/30 hover:shadow-primary/50 transition-all inline-flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Invite member
          </button>
        }
      />

      <SettingsCard
        title="Members"
        description={`${MEMBERS.length} active members — ${MEMBERS.filter((m) => m.status === 'Invited').length} invited.`}
      >
        <ul className="space-y-2">
          {MEMBERS.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-3 p-3 rounded-xl glass-card hover:bg-white/[0.06] transition-colors"
            >
              <span
                className={`w-10 h-10 rounded-full bg-gradient-to-br ${m.gradient} flex items-center justify-center text-xs font-bold text-primary-foreground flex-shrink-0`}
              >
                {m.initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {m.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {m.email}
                </p>
              </div>
              <span
                className={[
                  'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider',
                  roleClass[m.role],
                ].join(' ')}
              >
                {m.role}
              </span>
              {m.status === 'Invited' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-warning/15 text-warning ring-1 ring-warning/30">
                  <Mail className="w-3 h-3" />
                  Invited
                </span>
              )}
              <button
                type="button"
                aria-label="Open member menu"
                className="text-muted-foreground hover:text-foreground text-xs font-semibold px-2 py-1"
              >
                ···
              </button>
            </li>
          ))}
        </ul>
      </SettingsCard>

      <SettingsCard
        title="Roles & permissions"
        description="Toggle which capabilities each role unlocks across the dashboard."
      >
        <RoleRow
          role="Owner"
          icon={ShieldCheck}
          desc="Full access. Cannot be removed or demoted."
          perms={['Everything']}
        />
        <RoleRow
          role="Admin"
          icon={Shield}
          desc="Manage team, billing, integrations."
          perms={['Team', 'Billing', 'Integrations', 'Settings']}
        />
        <RoleRow
          role="Dispatcher"
          icon={Shield}
          desc="Schedule, dispatch, customer comms."
          perms={['Calls', 'Schedule', 'Customers']}
        />
        <RoleRow
          role="Tech"
          icon={Shield}
          desc="Mobile-only access. Sees assigned jobs and customer notes."
          perms={['Assigned jobs', 'Customer notes']}
        />
      </SettingsCard>

      <div className="flex items-center justify-end gap-2">
        <button className="px-4 py-2 rounded-lg glass-card text-sm font-semibold text-foreground/90 hover:text-foreground hover:bg-white/[0.06] transition-colors inline-flex items-center gap-2">
          Cancel
        </button>
        <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 shadow-sm shadow-primary/30 transition-all inline-flex items-center gap-2">
          <Save className="w-4 h-4" />
          Save
        </button>
      </div>
    </div>
  );
}

function RoleRow({
  role,
  icon: Icon,
  desc,
  perms,
}: {
  role: string;
  icon: typeof Shield;
  desc: string;
  perms: string[];
}): JSX.Element {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl glass-card">
      <span className="w-9 h-9 rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{role}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {perms.map((p) => (
            <span
              key={p}
              className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/[0.04] text-muted-foreground ring-1 ring-white/[0.06]"
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
