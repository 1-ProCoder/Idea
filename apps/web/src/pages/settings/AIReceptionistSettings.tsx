import { useState } from 'react';
import { Mic, Save, Sliders, Volume2, Zap } from 'lucide-react';

import { PageHeader } from '../../components/layout/PageHeader';
import {
  FieldRow,
  Select,
  SettingsCard,
  TextInput,
  Toggle,
} from '../../components/settings/SettingsPrimitives';

export default function AIReceptionistSettings(): JSX.Element {
  const [voice, setVoice] = useState('female-warm-us');
  const [speed, setSpeed] = useState(1);
  const [greeting, setGreeting] = useState(
    'Hi, thanks for calling FlowFix! This is Sarah, the AI receptionist. How can I help you today?',
  );
  const [autoBook, setAutoBook] = useState(true);
  const [escalate, setEscalate] = useState(true);
  const [afterHours, setAfterHours] = useState(true);
  const [transcripts, setTranscripts] = useState(true);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings · AI Receptionist"
        title="AI Receptionist"
        subtitle="Tune the voice, greeting, and behaviour of your 24/7 AI receptionist."
        actions={
          <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 shadow-sm shadow-primary/30 hover:shadow-primary/50 transition-all inline-flex items-center gap-2">
            <Save className="w-4 h-4" />
            Save changes
          </button>
        }
      />

      <SettingsCard
        title="Voice"
        description="How the receptionist sounds. Tested across 200+ flows."
      >
        <FieldRow label="Voice" description="Voice model and tone.">
          <Select
            value={voice}
            onChange={setVoice}
            options={[
              { value: 'female-warm-us', label: 'Sarah — warm, US English' },
              { value: 'male-calm-us', label: 'Marcus — calm, US English' },
              { value: 'female-bright-uk', label: 'Priya — bright, UK English' },
              { value: 'male-deep-us', label: 'James — deep, US English' },
            ]}
          />
        </FieldRow>
        <FieldRow
          label="Speed"
          description={`${speed.toFixed(1)}× — lower is calmer; higher is more efficient.`}
        >
          <input
            type="range"
            min={0.5}
            max={1.5}
            step={0.1}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            style={{ accentColor: 'hsl(var(--primary))' }}
            className="w-full"
          />
        </FieldRow>
        <FieldRow label="Test voice">
          <button
            type="button"
            className="px-3 py-1.5 rounded-lg glass-card text-xs font-semibold text-foreground/90 hover:text-foreground hover:bg-white/[0.06] transition-colors inline-flex items-center gap-1.5"
          >
            <Volume2 className="w-3.5 h-3.5" />
            Preview greeting
          </button>
        </FieldRow>
      </SettingsCard>

      <SettingsCard
        title="Greeting"
        description="Plays when a call connects. Keep it warm and short."
      >
        <TextInput
          value={greeting}
          onChange={setGreeting}
          placeholder="Hi, thanks for calling…"
        />
        <p className="text-[10px] text-muted-foreground mt-1">
          {greeting.length} / 600 characters · auto-trimmed if longer
        </p>
      </SettingsCard>

      <SettingsCard
        title="Call handling rules"
        description="What the receptionist should do during and after a call."
      >
        <Toggle
          checked={autoBook}
          onChange={setAutoBook}
          label="Auto-book standard jobs"
          description="If the customer wants a standard visit, the AI books it without asking a human."
        />
        <Toggle
          checked={escalate}
          onChange={setEscalate}
          label="Escalate emergencies"
          description="On detecting floods, gas leaks, no-heat, or 'asap' urgency — page the owner immediately."
        />
        <Toggle
          checked={afterHours}
          onChange={setAfterHours}
          label="Answer 24/7"
          description="Outside business hours, capture every call and send a transcript within 60 seconds."
        />
        <Toggle
          checked={transcripts}
          onChange={setTranscripts}
          label="Record transcripts"
          description="Required for training. Customers are told the call may be recorded."
        />
      </SettingsCard>

      <SettingsCard
        title="Emergency escalation"
        description="Who gets paged and how, when the AI flags an emergency."
      >
        <FieldRow
          label="Page"
          description="Phone or extension to ring on emergency escalation."
        >
          <TextInput value="(555) 010-2200" onChange={() => {}} type="tel" />
        </FieldRow>
        <FieldRow
          label="Channel"
          description="Multi-channel pings usually catch the owner faster."
        >
          <div className="flex items-center gap-2 flex-wrap">
            {['SMS', 'Phone', 'Email', 'Slack'].map((c, i) => (
              <span
                key={c}
                className={[
                  'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ring-1',
                  i < 2
                    ? 'bg-primary/15 text-primary ring-primary/30'
                    : 'bg-white/[0.04] text-muted-foreground ring-white/[0.06]',
                ].join(' ')}
              >
                {c}
              </span>
            ))}
          </div>
        </FieldRow>
        <FieldRow
          label="Trigger words"
          description="Comma-separated words that tell the AI to escalate."
        >
          <TextInput
            value="flood, leak, gas, fire, asap, urgent, broken pipe, sparking"
            onChange={() => {}}
            placeholder="flood, leak, gas, fire, asap, urgent"
          />
        </FieldRow>
      </SettingsCard>
    </div>
  );
}
