import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2 } from 'lucide-react';
import type { JSX } from 'react';

import { PageHeader } from '../../components/layout/PageHeader';
import { FieldRow, SettingsCard, Toggle } from '../../components/settings/SettingsPrimitives';
import { useOptionalFetch } from '../../hooks/useAuthedFetch';
import {
  getBusiness,
  updateBusiness,
  type ApiError as ApiErrorT,
  type BusinessPatchInput,
  type BusinessProfileDto,
} from '../../lib/api-business';

type NotificationPrefs = {
  smsAlerts?: boolean;
  emailAlerts?: boolean;
  pushAlerts?: boolean;
  missedCallAlerts?: boolean;
  emergencyEscalation?: boolean;
  weeklyDigest?: boolean;
};

const DEFAULTS: NotificationPrefs = {
  smsAlerts: true,
  emailAlerts: true,
  pushAlerts: true,
  missedCallAlerts: true,
  emergencyEscalation: true,
  weeklyDigest: false,
};

function readPrefs(b: BusinessProfileDto): NotificationPrefs {
  const raw = b.notificationPrefs as Partial<NotificationPrefs>;
  return { ...DEFAULTS, ...raw };
}

export default function NotificationsSettings(): JSX.Element {
  const fetch = useOptionalFetch();
  const qc = useQueryClient();

  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULTS);
  const initial = useMemo<NotificationPrefs>(
    () => ({ ...DEFAULTS }),
    [],
  );

  const query = useQuery<BusinessProfileDto>({
    queryKey: ['business'],
    queryFn: () => fetch((token) => getBusiness(token)),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!query.data) return;
    const p = readPrefs(query.data);
    setPrefs(p);
    Object.assign(initial, p);
  }, [query.data, initial]);

  const mutation = useMutation({
    mutationFn: (input: BusinessPatchInput) =>
      fetch((token) => updateBusiness(token, input)),
    onSuccess: (next) => {
      qc.setQueryData(['business'], next);
    },
  });

  const dirty = (
    Object.keys(prefs) as Array<keyof NotificationPrefs>
  ).some((key) => prefs[key] !== initial[key]);

  function setPref<K extends keyof NotificationPrefs>(
    key: K,
    v: NotificationPrefs[K],
  ) {
    setPrefs((cur) => ({ ...cur, [key]: v }));
  }

  function save() {
    if (!dirty || mutation.isPending) return;
    const input: BusinessPatchInput = {
      notificationPrefs: {
        ...(query.data?.notificationPrefs ?? {}),
        ...prefs,
      },
    };
    mutation.mutate(input);
  }

  const mutationErrorMessage = mutation.isError
    ? ((mutation.error as unknown as ApiErrorT | null)?.message ??
      String(mutation.error))
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings · Notifications"
        title="Notifications"
        subtitle="When and how you want to hear about calls, jobs, and emergencies."
      />

      <SettingsCard
        title="Channels"
        description="Where alerts show up. Each is independent — toggle them all."
      >
        <FieldRow
          label="SMS alerts"
          description="Texts to your escalation phone on key events."
        >
          <Toggle
            checked={!!prefs.smsAlerts}
            onChange={(v) => setPref('smsAlerts', v)}
          />
        </FieldRow>
        <FieldRow
          label="Email alerts"
          description="Digest and per-event emails to your business address."
        >
          <Toggle
            checked={!!prefs.emailAlerts}
            onChange={(v) => setPref('emailAlerts', v)}
          />
        </FieldRow>
        <FieldRow
          label="Push notifications"
          description="Browser push while the dashboard tab is open."
        >
          <Toggle
            checked={!!prefs.pushAlerts}
            onChange={(v) => setPref('pushAlerts', v)}
          />
        </FieldRow>
      </SettingsCard>

      <SettingsCard
        title="Events"
        description="Pick which moments warrant a ping."
      >
        <FieldRow
          label="Missed-call alerts"
          description="Notify after a missed inbound call so someone can call back fast."
        >
          <Toggle
            checked={!!prefs.missedCallAlerts}
            onChange={(v) => setPref('missedCallAlerts', v)}
          />
        </FieldRow>
        <FieldRow
          label="Emergency escalation"
          description="Page you AND ring your escalation phone when the AI tags a call EMERGENCY."
        >
          <Toggle
            checked={!!prefs.emergencyEscalation}
            onChange={(v) => setPref('emergencyEscalation', v)}
          />
        </FieldRow>
        <FieldRow
          label="Weekly digest"
          description="A summary of calls, jobs completed, and bookings. Mondays at 9am."
        >
          <Toggle
            checked={!!prefs.weeklyDigest}
            onChange={(v) => setPref('weeklyDigest', v)}
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
