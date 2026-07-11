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
  Toggle,
} from '../../components/settings/SettingsPrimitives';
import { useAuthedFetch } from '../../hooks/useAuthedFetch';
import {
  getBusiness,
  updateBusiness,
  type ApiError as ApiErrorT,
  type BusinessPatchInput,
  type BusinessProfileDto,
} from '../../lib/api-business';

const TIMEZONES = [
  { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
  { value: 'America/New_York', label: 'Eastern Time (New York)' },
  { value: 'America/Chicago', label: 'Central Time (Chicago)' },
  { value: 'America/Denver', label: 'Mountain Time (Denver)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (Los Angeles)' },
  { value: 'America/Anchorage', label: 'Alaska (Anchorage)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii (Honolulu)' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Berlin', label: 'Berlin / Paris / Madrid' },
  { value: 'Europe/Athens', label: 'Athens / Helsinki' },
  { value: 'Asia/Dubai', label: 'Dubai' },
  { value: 'Asia/Kolkata', label: 'India Standard Time' },
  { value: 'Asia/Singapore', label: 'Singapore' },
  { value: 'Asia/Tokyo', label: 'Tokyo / Seoul' },
  { value: 'Australia/Sydney', label: 'Sydney' },
];

const LANGUAGES = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'es-ES', label: 'Spanish (Spain)' },
  { value: 'es-MX', label: 'Spanish (Mexico)' },
  { value: 'fr-FR', label: 'French (France)' },
  { value: 'de-DE', label: 'German' },
  { value: 'pt-BR', label: 'Portuguese (Brazil)' },
];

type BrandPrefs = {
  language?: string;
  theme?: 'dark' | 'system';
};

function readBrandPrefs(b: BusinessProfileDto): BrandPrefs {
  const raw = b.branding as Partial<BrandPrefs>;
  return {
    language: typeof raw.language === 'string' ? raw.language : 'en-US',
    theme: raw.theme === 'system' ? 'system' : 'dark',
  };
}

export default function GeneralSettings(): JSX.Element {
  const { isLoaded } = useUser();
  const fetch = useAuthedFetch();
  const qc = useQueryClient();

  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [language, setLanguage] = useState('en-US');
  const [followSystem, setFollowSystem] = useState(false);

  // Track which fields have changed since the last successful save so
  // we only PATCH what the user edited.
  const initial = useMemo(() => {
    return { name: '', timezone: 'UTC' };
  }, []);

  const query = useQuery<BusinessProfileDto>({
    queryKey: ['business'],
    queryFn: () => fetch((token) => getBusiness(token)),
    enabled: isLoaded,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!query.data) return;
    setName(query.data.name);
    setTimezone(query.data.timezone || 'UTC');
    const prefs = readBrandPrefs(query.data);
    setLanguage(prefs.language ?? 'en-US');
    setFollowSystem(prefs.theme === 'system');
    initial.name = query.data.name;
    initial.timezone = query.data.timezone || 'UTC';
  }, [query.data, initial]);

  const mutation = useMutation({
    mutationFn: (input: BusinessPatchInput) =>
      fetch((token) => updateBusiness(token, input)),
    onSuccess: (next) => {
      qc.setQueryData(['business'], next);
    },
  });

  const dirty =
    name !== initial.name ||
    timezone !== initial.timezone ||
    (query.data
      ? (readBrandPrefs(query.data).language ?? 'en-US') !==
        (language ?? 'en-US')
      : false) ||
    (query.data
      ? readBrandPrefs(query.data).theme === 'system' !==
        followSystem
      : false);

  function save() {
    if (!dirty || mutation.isPending) return;
    const next: BusinessPatchInput = {
      name,
      timezone,
      branding: {
        ...(query.data?.branding ?? {}),
        language,
        theme: followSystem ? 'system' : 'dark',
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
        eyebrow="Settings · General"
        title="General"
        subtitle="Company identity, timezone, language, and theme."
      />

      <SettingsCard
        title="Company identity"
        description="Used across every email, invoice, and AI greeting."
      >
        <FieldRow
          label="Company name"
          description="Display name shown to customers and on calls."
          htmlFor="general-name"
        >
          <TextInput
            id="general-name"
            value={name}
            onChange={setName}
            placeholder="Voss & Sons Plumbing"
          />
        </FieldRow>
      </SettingsCard>

      <SettingsCard
        title="Region & language"
        description="Affects how times are rendered and which voice the AI uses."
      >
        <FieldRow
          label="Timezone"
          description="All scheduled jobs are interpreted in this timezone."
          htmlFor="general-tz"
        >
          <Select
            id="general-tz"
            value={timezone}
            onChange={setTimezone}
            options={TIMEZONES}
          />
        </FieldRow>
        <FieldRow
          label="Language"
          description="Language the AI receptionist greets callers in."
          htmlFor="general-lang"
        >
          <Select
            id="general-lang"
            value={language}
            onChange={setLanguage}
            options={LANGUAGES}
          />
        </FieldRow>
      </SettingsCard>

      <SettingsCard
        title="Appearance"
        description="Theme follows your OS until you opt in."
      >
        <FieldRow
          label="Match system theme"
          description="Switch between light and dark automatically."
        >
          <Toggle
            checked={followSystem}
            onChange={setFollowSystem}
            label={followSystem ? 'Enabled' : 'Always dark'}
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
