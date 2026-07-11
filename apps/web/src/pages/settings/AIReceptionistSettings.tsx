import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import type { JSX } from 'react';

import { PageHeader } from '../../components/layout/PageHeader';
import {
  FieldRow,
  Select,
  SettingsCard,
  TextInput,
} from '../../components/settings/SettingsPrimitives';
import { useAuthedFetch } from '../../hooks/useAuthedFetch';
import {
  getBusiness,
  updateBusiness,
  type ApiError as ApiErrorT,
  type BusinessPatchInput,
  type BusinessProfileDto,
} from '../../lib/api-business';

const VOICES = [
  { value: 'alloy', label: 'Alloy — balanced, neutral' },
  { value: 'nova', label: 'Nova — warm, friendly' },
  { value: 'echo', label: 'Echo — clear, professional' },
  { value: 'spark', label: 'Spark — confident, upbeat' },
];

const BOOKING_MODES = [
  { value: 'auto', label: 'Auto-book — straight into the calendar' },
  { value: 'confirm', label: 'Confirm — AI texts you a one-tap approval' },
  { value: 'collect', label: 'Collect details only — you take it from here' },
];

type AIConfig = {
  voice?: string;
  greeting?: string;
  bookingMode?: 'auto' | 'confirm' | 'collect' | string;
  escalationPhone?: string;
  transferToHumanSeconds?: number;
};

function readAIConfig(b: BusinessProfileDto): AIConfig {
  const raw = b.aiConfig as Partial<AIConfig>;
  return {
    voice: typeof raw.voice === 'string' ? raw.voice : 'nova',
    greeting: typeof raw.greeting === 'string' ? raw.greeting : '',
    bookingMode: typeof raw.bookingMode === 'string' ? raw.bookingMode : 'auto',
    escalationPhone:
      typeof raw.escalationPhone === 'string' ? raw.escalationPhone : '',
    transferToHumanSeconds:
      typeof raw.transferToHumanSeconds === 'number'
        ? raw.transferToHumanSeconds
        : 60,
  };
}

export default function AIReceptionistSettings(): JSX.Element {
  const { isLoaded } = useUser();
  const fetch = useAuthedFetch();
  const qc = useQueryClient();

  const [voice, setVoice] = useState('nova');
  const [greeting, setGreeting] = useState('');
  const [bookingMode, setBookingMode] = useState('auto');
  const [escalationPhone, setEscalationPhone] = useState('');
  const [transferSeconds, setTransferSeconds] = useState(60);

  const initial = useMemo(() => readAIConfig({} as BusinessProfileDto), []);

  const query = useQuery<BusinessProfileDto>({
    queryKey: ['business'],
    queryFn: () => fetch((token) => getBusiness(token)),
    enabled: isLoaded,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!query.data) return;
    const cfg = readAIConfig(query.data);
    setVoice(cfg.voice ?? 'nova');
    setGreeting(cfg.greeting ?? '');
    setBookingMode(cfg.bookingMode ?? 'auto');
    setEscalationPhone(cfg.escalationPhone ?? '');
    setTransferSeconds(cfg.transferToHumanSeconds ?? 60);
    initial.voice = cfg.voice;
    initial.greeting = cfg.greeting;
    initial.bookingMode = cfg.bookingMode;
    initial.escalationPhone = cfg.escalationPhone;
    initial.transferToHumanSeconds = cfg.transferToHumanSeconds;
  }, [query.data, initial]);

  const mutation = useMutation({
    mutationFn: (input: BusinessPatchInput) =>
      fetch((token) => updateBusiness(token, input)),
    onSuccess: (next) => {
      qc.setQueryData(['business'], next);
    },
  });

  const dirty =
    voice !== initial.voice ||
    greeting !== initial.greeting ||
    bookingMode !== initial.bookingMode ||
    escalationPhone !== initial.escalationPhone ||
    transferSeconds !== initial.transferToHumanSeconds;

  function save() {
    if (!dirty || mutation.isPending) return;
    const next: BusinessPatchInput = {
      aiConfig: {
        ...(query.data?.aiConfig ?? {}),
        voice,
        greeting,
        bookingMode,
        escalationPhone,
        transferToHumanSeconds: transferSeconds,
      },
    };
    mutation.mutate(next);
  }

  const mutationErrorMessage = mutation.isError
    ? ((mutation.error as unknown as ApiErrorT | null)?.message ??
      String(mutation.error))
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings · AI Receptionist"
        title="AI Receptionist"
        subtitle="Train the receptionist on how it greets, books, and escalates calls."
      />

      <SettingsCard
        title="Voice & greeting"
        description="The first impression. Click save and your next call picks it up."
      >
        <FieldRow
          label="Voice"
          description="Tonality of the AI voice on the phone."
          htmlFor="ai-voice"
        >
          <Select
            id="ai-voice"
            value={voice}
            onChange={setVoice}
            options={VOICES}
          />
        </FieldRow>
        <FieldRow
          label="Greeting"
          htmlFor="ai-greeting"
          description="First sentence the caller hears. Keep it under 240 chars."
        >
          <input
            id="ai-greeting"
            type="text"
            value={greeting}
            onChange={(e) => setGreeting(e.target.value)}
            maxLength={240}
            placeholder="Thanks for calling Voss & Sons — how can I help?"
            className="w-full h-9 px-3 rounded-lg glass-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
        </FieldRow>
      </SettingsCard>

      <SettingsCard
        title="Booking behavior"
        description="Decide when human review kicks in."
      >
        <FieldRow
          label="Booking mode"
          htmlFor="ai-booking"
          description="Auto books into the calendar; Confirm texts you one-tap approval."
        >
          <Select
            id="ai-booking"
            value={bookingMode}
            onChange={setBookingMode}
            options={BOOKING_MODES}
          />
        </FieldRow>
        <FieldRow
          label="Transfer to human after"
          htmlFor="ai-transfer"
          description="Seconds the AI waits before handing off. 0 = never."
        >
          <TextInput
            id="ai-transfer"
            type="number"
            value={String(transferSeconds)}
            onChange={(v) => setTransferSeconds(Math.max(0, Number(v) || 0))}
          />
        </FieldRow>
      </SettingsCard>

      <SettingsCard
        title="Emergency escalation"
        description="Calls tagged EMERGENCY by the AI ring this number when you opt-in."
      >
        <FieldRow
          label="Escalation phone"
          htmlFor="ai-escalation"
          description="Your cell or after-hours dispatcher. Leave empty to silence escalations."
        >
          <TextInput
            id="ai-escalation"
            type="tel"
            value={escalationPhone}
            onChange={setEscalationPhone}
            placeholder="+1 (555) 987-6543"
          />
        </FieldRow>
      </SettingsCard>

      <div className="flex items-center justify-end gap-3 flex-wrap pt-1">
        {mutation.isSuccess && (
          <span className="inline-flex items-center gap-1.5 text-success text-xs font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Saved
          </span>
        )}
        {mutationErrorMessage && (
          <span className="text-danger text-xs">{mutationErrorMessage}</span>
        )}
        <button
          type="button"
          onClick={save}
          disabled={!dirty || mutation.isPending || query.isPending}
          className="btn-organic inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold shadow-sm shadow-primary/30 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Saving…
            </>
          ) : (
            'Save changes'
          )}
        </button>
      </div>
    </div>
  );
}
