import { useState } from 'react';
import { Save } from 'lucide-react';

import { PageHeader } from '../../components/layout/PageHeader';
import {
  FieldRow,
  Select,
  SettingsCard,
  TextInput,
} from '../../components/settings/SettingsPrimitives';

export default function GeneralSettings(): JSX.Element {
  const [name, setName] = useState('FlowFix Plumbing Co.');
  const [tz, setTz] = useState('America/New_York');
  const [open, setOpen] = useState('08:00');
  const [close, setClose] = useState('18:00');
  const [lang, setLang] = useState('en-US');
  const [theme, setTheme] = useState('dark');

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings · General"
        title="General"
        subtitle="Company-wide defaults and basic preferences."
        actions={
          <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 shadow-sm shadow-primary/30 hover:shadow-primary/50 transition-all inline-flex items-center gap-2">
            <Save className="w-4 h-4" />
            Save changes
          </button>
        }
      />

      <SettingsCard
        title="Identity"
        description="How FlowFix presents you in emails, SMS, and the dashboard."
      >
        <FieldRow
          label="Company name"
          description="Used everywhere customers see your business."
        >
          <TextInput value={name} onChange={setName} />
        </FieldRow>
        <FieldRow
          label="Timezone"
          description="Used for scheduling, dispatch, and reports."
        >
          <Select
            value={tz}
            onChange={setTz}
            options={[
              { value: 'America/New_York', label: 'Eastern (New York)' },
              { value: 'America/Chicago', label: 'Central (Chicago)' },
              { value: 'America/Denver', label: 'Mountain (Denver)' },
              { value: 'America/Los_Angeles', label: 'Pacific (Los Angeles)' },
              { value: 'Europe/London', label: 'London' },
            ]}
          />
        </FieldRow>
        <FieldRow
          label="Language"
          description="Customer-facing messages."
        >
          <Select
            value={lang}
            onChange={setLang}
            options={[
              { value: 'en-US', label: 'English (US)' },
              { value: 'en-GB', label: 'English (UK)' },
              { value: 'es-US', label: 'Spanish (US)' },
              { value: 'fr-FR', label: 'French' },
            ]}
          />
        </FieldRow>
      </SettingsCard>

      <SettingsCard
        title="Business hours"
        description="When the AI receptionist should answer live. Outside these hours calls are still captured but flagged."
      >
        <FieldRow
          label="Opens at"
          description="Earliest time to answer live (Mon–Fri)."
        >
          <TextInput value={open} onChange={setOpen} type="text" />
        </FieldRow>
        <FieldRow label="Closes at" description="Latest time to answer live.">
          <TextInput value={close} onChange={setClose} type="text" />
        </FieldRow>
      </SettingsCard>

      <SettingsCard
        title="Theme"
        description="Currently locked to dark. Toggle to a custom theme in a later milestone."
        actions={
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Locked · Dark
          </span>
        }
      >
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { key: 'light', label: 'Light', soon: true },
            { key: 'dark', label: 'Dark' },
            { key: 'system', label: 'System', soon: true },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              disabled={t.soon}
              onClick={() => !t.soon && setTheme(t.key)}
              className={[
                'rounded-xl p-3 text-left transition-all',
                'border',
                theme === t.key
                  ? 'border-primary/40 bg-primary/10 text-foreground ring-2 ring-primary/30'
                  : 'border-white/[0.06] bg-white/[0.03] text-muted-foreground hover:text-foreground hover:border-white/[0.12]',
                t.soon && 'opacity-50 cursor-not-allowed',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t.label}</span>
                {t.soon && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-white/[0.06] bg-white/[0.04] text-muted-foreground">
                    Soon
                  </span>
                )}
              </div>
              <div
                className={[
                  'mt-2 h-12 rounded-md',
                  t.key === 'light'
                    ? 'bg-gradient-to-b from-zinc-100 to-white ring-1 ring-zinc-200'
                    : t.key === 'dark'
                      ? 'bg-gradient-to-br from-zinc-900 to-zinc-950 ring-1 ring-white/[0.06]'
                      : 'bg-gradient-to-r from-zinc-100 via-zinc-700 to-zinc-900',
                ].join(' ')}
              />
            </button>
          ))}
        </div>
      </SettingsCard>
    </div>
  );
}
