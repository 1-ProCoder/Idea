import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2 } from 'lucide-react';
import type { JSX } from 'react';

import { PageHeader } from '../../components/layout/PageHeader';
import {
  FieldRow,
  SettingsCard,
  TextInput,
} from '../../components/settings/SettingsPrimitives';
import { useOptionalFetch } from '../../hooks/useAuthedFetch';
import {
  getBusiness,
  updateBusiness,
  type ApiError as ApiErrorT,
  type BusinessPatchInput,
  type BusinessProfileDto,
} from '../../lib/api-business';

type BrandingExtras = {
  logoUrl?: string;
  tagline?: string;
};

function readBranding(b: BusinessProfileDto): BrandingExtras {
  const raw = b.branding as Partial<BrandingExtras>;
  return {
    logoUrl: typeof raw.logoUrl === 'string' ? raw.logoUrl : '',
    tagline: typeof raw.tagline === 'string' ? raw.tagline : '',
  };
}

export default function CompanySettings(): JSX.Element {
  const fetch = useOptionalFetch();
  const qc = useQueryClient();

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [tagline, setTagline] = useState('');

  const initial = useMemo(
    () => ({ email: '', phone: '', address: '', logoUrl: '', tagline: '' }),
    [],
  );

  const query = useQuery<BusinessProfileDto>({
    queryKey: ['business'],
    queryFn: () => fetch((token) => getBusiness(token)),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!query.data) return;
    setEmail(query.data.email ?? '');
    setPhone(query.data.phone ?? '');
    setAddress(query.data.address ?? '');
    const br = readBranding(query.data);
    setLogoUrl(br.logoUrl ?? '');
    setTagline(br.tagline ?? '');
    initial.email = query.data.email ?? '';
    initial.phone = query.data.phone ?? '';
    initial.address = query.data.address ?? '';
    initial.logoUrl = br.logoUrl ?? '';
    initial.tagline = br.tagline ?? '';
  }, [query.data, initial]);

  const mutation = useMutation({
    mutationFn: (input: BusinessPatchInput) =>
      fetch((token) => updateBusiness(token, input)),
    onSuccess: (next) => {
      qc.setQueryData(['business'], next);
    },
  });

  const dirty =
    email !== initial.email ||
    phone !== initial.phone ||
    address !== initial.address ||
    logoUrl !== initial.logoUrl ||
    tagline !== initial.tagline;

  function save() {
    if (!dirty || mutation.isPending) return;
    const input: BusinessPatchInput = { email, phone, address };
    const branding = {
      ...(query.data?.branding ?? {}),
      logoUrl,
      tagline,
    };
    input.branding = branding;
    mutation.mutate(input);
  }

  // Curly quotes via \u201c / \u201d inside JSX attribute strings — they
  // don't terminate the attribute the way ASCII " would, which
  // previously cascaded TS parse errors through the whole file.
  const taglineHelper =
    'The one-line \u201celevator pitch\u201d sentence used on the dashboard hero chip.';

  const mutationErrorMessage = mutation.isError
    ? ((mutation.error as unknown as ApiErrorT | null)?.message ??
      String(mutation.error))
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings · Company"
        title="Company"
        subtitle="Contact info and brand assets that ride along on every customer touchpoint."
      />

      <SettingsCard
        title="Contact info"
        description="Where customers and AI escalations reach you."
      >
        <FieldRow label="Email" htmlFor="company-email">
          <TextInput
            id="company-email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="dispatch@vossplumbing.com"
          />
        </FieldRow>
        <FieldRow label="Phone" htmlFor="company-phone">
          <TextInput
            id="company-phone"
            type="tel"
            value={phone}
            onChange={setPhone}
            placeholder="+1 (555) 123-4567"
          />
        </FieldRow>
        <FieldRow
          label="Service address"
          htmlFor="company-address"
          description="Default for invoices. Per-job addresses stay on the job."
        >
          <TextInput
            id="company-address"
            value={address}
            onChange={setAddress}
            placeholder="742 Evergreen Terrace, Springfield"
          />
        </FieldRow>
      </SettingsCard>

      <SettingsCard
        title="Brand assets"
        description="Logo and tagline render on invoice headers, the dashboard, and the AI greeting scaffold."
      >
        <FieldRow
          label="Logo URL"
          htmlFor="company-logo"
          description="HTTPS-hosted image. We render it at 128 by 128 on invoices."
        >
          <TextInput
            id="company-logo"
            type="url"
            value={logoUrl}
            onChange={setLogoUrl}
            placeholder="https://assets.vossplumbing.com/logo.png"
          />
        </FieldRow>
        <FieldRow
          label="Tagline"
          htmlFor="company-tagline"
          description={taglineHelper}
        >
          <TextInput
            id="company-tagline"
            value={tagline}
            onChange={setTagline}
            placeholder="Honest work, since 1973."
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
