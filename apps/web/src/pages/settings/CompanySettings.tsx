import { useState } from 'react';
import { Camera, Save } from 'lucide-react';

import { PageHeader } from '../../components/layout/PageHeader';
import {
  FieldRow,
  Select,
  SettingsCard,
  TextInput,
} from '../../components/settings/SettingsPrimitives';

export default function CompanySettings(): JSX.Element {
  const [dba, setDba] = useState('FlowFix Plumbing & Heating');
  const [legal, setLegal] = useState('FlowFix Holdings LLC');
  const [ein, setEin] = useState('83-1234567');
  const [addr, setAddr] = useState('128 Brighton Ave, Suite 4');
  const [serviceArea, setServiceArea] = useState('15-mile radius');
  const [phone, setPhone] = useState('(555) 010-2200');
  const [email, setEmail] = useState('ops@flowfix.example');

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings · Company"
        title="Company"
        subtitle="Legal entity, branding, address, service area, contact information."
        actions={
          <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 shadow-sm shadow-primary/30 hover:shadow-primary/50 transition-all inline-flex items-center gap-2">
            <Save className="w-4 h-4" />
            Save changes
          </button>
        }
      />

      <SettingsCard
        title="Branding"
        description="Your logo is used on the dashboard, emails, customer invoices, and SMS previews."
        actions={
          <button
            type="button"
            className="px-3 py-1.5 rounded-lg glass-card text-xs font-semibold text-foreground/90 hover:text-foreground hover:bg-white/[0.06] transition-colors inline-flex items-center gap-1.5"
          >
            <Camera className="w-3.5 h-3.5" />
            Upload logo
          </button>
        }
      >
        <div className="flex items-center gap-4">
          <span className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary via-accent to-secondary shadow-lg shadow-primary/30 flex items-center justify-center text-sm font-bold text-primary-foreground">
            FF
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              flowfix-logo.png
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">PNG · 128×128</p>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Business details">
        <FieldRow label="Doing business as" description="Customer-facing brand.">
          <TextInput value={dba} onChange={setDba} />
        </FieldRow>
        <FieldRow label="Legal entity" description="Required for invoices.">
          <TextInput value={legal} onChange={setLegal} />
        </FieldRow>
        <FieldRow
          label="Tax ID (EIN)"
          description="Used on invoices. Stored encrypted at rest."
        >
          <TextInput value={ein} onChange={setEin} />
        </FieldRow>
      </SettingsCard>

      <SettingsCard title="Address & service area">
        <FieldRow label="Business address">
          <TextInput value={addr} onChange={setAddr} />
        </FieldRow>
        <FieldRow label="Service area" description="Auto-routed to your techs.">
          <Select
            value={serviceArea}
            onChange={setServiceArea}
            options={[
              { value: '5-mile radius', label: '5-mile radius' },
              { value: '10-mile radius', label: '10-mile radius' },
              { value: '15-mile radius', label: '15-mile radius' },
              { value: '25-mile radius', label: '25-mile radius' },
              { value: 'statewide', label: 'Statewide' },
            ]}
          />
        </FieldRow>
      </SettingsCard>

      <SettingsCard title="Public contact">
        <FieldRow label="Public phone">
          <TextInput value={phone} onChange={setPhone} type="tel" />
        </FieldRow>
        <FieldRow label="Public email">
          <TextInput value={email} onChange={setEmail} type="email" />
        </FieldRow>
      </SettingsCard>
    </div>
  );
}
