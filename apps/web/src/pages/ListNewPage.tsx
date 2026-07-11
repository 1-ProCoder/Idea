import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-react';
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Plus,
  Save,
  type LucideIcon,
} from 'lucide-react';
import type { JSX } from 'react';

import { PageHeader } from '../components/layout/PageHeader';
import { useAuthedFetch } from '../hooks/useAuthedFetch';
import {
  createCustomer,
  type ApiError as ApiErrorT,
  type CustomerInput,
} from '../lib/api-customers';

type FieldDef = {
  key: keyof CustomerInput;
  label: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'tel' | 'url';
  required?: boolean;
  optional?: boolean;
  helper?: string;
  icon?: LucideIcon;
};

const FIELDS: FieldDef[] = [
  {
    key: 'name',
    label: 'Customer name',
    placeholder: 'Jane Smith',
    required: true,
    helper: 'Used on jobs, calls, and invoices.',
  },
  {
    key: 'phone',
    label: 'Phone',
    placeholder: '+1 (555) 123-4567',
    type: 'tel',
    required: true,
    helper: 'Strongest dedupe key — must match the format you store as.',
  },
  {
    key: 'email',
    label: 'Email',
    placeholder: 'jane@example.com',
    type: 'email',
    optional: true,
  },
  {
    key: 'address',
    label: 'Service address',
    placeholder: '742 Evergreen Terrace, Springfield',
    optional: true,
    helper: 'Where the work will be done — pre-fills job dispatch.',
  },
  {
    key: 'notes',
    label: 'Notes',
    placeholder: 'Gate code #4421; dog on premises; emergency jobs.',
    optional: true,
    helper: 'Anything dispatch needs to know before they arrive.',
  },
];

const inputClass =
  'w-full h-10 px-3 rounded-lg glass-blend text-sm text-foreground placeholder:text-muted-foreground ' +
  'focus:outline-none focus:ring-1 focus:ring-primary/40 transition-colors';

/**
 * Protected `/list/new` — full-page form for adding a customer
 * back into the unified list. Mirrors `CustomerModal` visually but
 * uses generous page-level spacing instead of a dialog.
 *
 * The only `POST /api/...` endpoint exposed publicly without
 * onboarding is `POST /api/customers`. Jobs/calls/appointments
 * require an existing business + worker + customer context, so
 * "New" on `/list` is intentionally customer-only for now.
 */
export default function ListNewPage(): JSX.Element {
  const { isLoaded } = useUser();
  const fetch = useAuthedFetch();
  const navigate = useNavigate();

  const [values, setValues] = useState<CustomerInput>({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });

  const [inlineError, setInlineError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (input: CustomerInput) =>
      fetch((token) => createCustomer(token, input)),
    onSuccess: () => {
      navigate('/list', { replace: true });
    },
  });

  function update<K extends keyof CustomerInput>(
    key: K,
    v: CustomerInput[K],
  ) {
    setValues((cur) => ({ ...cur, [key]: v }));
    if (key === 'phone' && inlineError) setInlineError(null);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!values.name?.trim() || !values.phone?.trim()) return;
    setInlineError(null);

    const input: CustomerInput = {
      name: values.name.trim(),
      phone: values.phone.trim(),
    };
    if (values.email?.trim()) input.email = values.email.trim();
    if (values.address?.trim()) input.address = values.address.trim();
    if (values.notes?.trim()) input.notes = values.notes.trim();

    mutation.mutate(input, {
      onError: (err: unknown) => {
        // useMutation types the error as `Error | null`, but the API
        // throws an `ApiError` (extends `Error` and adds `status`).
        // Cast through `unknown` so TS doesn't reject the structural
        // mismatch under strict typing.
        const e = err as unknown as ApiErrorT | null;
        if (e?.status === 409) {
          setInlineError(
            'A customer with this phone already exists. Use a different number.',
          );
          return;
        }
        if (e?.status === 400 && Array.isArray(e.issues) && e.issues.length) {
          setInlineError(
            `${e.issues[0].path}: ${e.issues[0].message}`,
          );
          return;
        }
        setInlineError(e?.message ?? String(err));
      },
    });
  }

  // Only surface the bottom-of-form alert for failures that AREN'T
  // already shown inline next to the offending field (e.g. 409 next
  // to phone, 400 Zod). The inline surface wins so the user doesn't
  // read the same message twice for the same failure.
  const mutationErrorMessage = mutation.isError
    ? ((mutation.error as unknown as ApiErrorT | null)?.message ??
      String(mutation.error))
    : null;
  const rootError = inlineError ? null : mutationErrorMessage;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-32 space-y-8">
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-1.5">
            <Link
              to="/list"
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to list
            </Link>
            <span className="text-muted-foreground/60">·</span>
            <span>New customer</span>
          </span>
        }
        title="Add a customer"
        subtitle="Drop into the unified activity stream the moment they're saved."
      />

      <form
        onSubmit={handleSubmit}
        className="glass-card rounded-2xl p-5 sm:p-6 space-y-5"
        noValidate
      >
        {FIELDS.map((f, idx) => {
          const Icon = f.icon;
          return (
            <div key={f.key} className="space-y-1.5">
              <label htmlFor={`fld-${f.key}`} className="flex items-center gap-2">
                {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground" />}
                <span className="text-sm font-semibold text-foreground">
                  {f.label}
                </span>
                {f.required ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-primary/15 text-primary ring-1 ring-primary/30">
                    Required
                  </span>
                ) : (
                  f.optional && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-white/[0.04] text-muted-foreground ring-1 ring-white/[0.06]">
                      Optional
                    </span>
                  )
                )}
              </label>
              <input
                id={`fld-${f.key}`}
                type={f.type ?? 'text'}
                value={(values[f.key] as string | undefined) ?? ''}
                onChange={(e) => update(f.key, e.target.value)}
                placeholder={f.placeholder}
                aria-invalid={f.key === 'phone' && inlineError ? true : undefined}
                aria-describedby={
                  f.helper ? `fld-${f.key}-help` : undefined
                }
                autoFocus={idx === 0}
                className={[
                  inputClass,
                  f.key === 'phone' && inlineError
                    ? 'ring-1 ring-danger/50'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              />
              {f.helper && (
                <p
                  id={`fld-${f.key}-help`}
                  className="text-xs text-muted-foreground"
                >
                  {f.helper}
                </p>
              )}
            </div>
          );
        })}

        <div className="pt-2 border-t border-white/[0.06]" />

        {rootError && (
          <div
            role="alert"
            className="rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger"
          >
            {rootError}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 flex-wrap">
          <Link
            to="/list"
            className="btn-organic px-4 py-2 rounded-lg glass-blend text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={
              mutation.isPending ||
              !isLoaded ||
              !values.name?.trim() ||
              !values.phone?.trim()
            }
            className="btn-organic inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold shadow-sm shadow-primary/30 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save customer
              </>
            )}
          </button>
        </div>

        {mutation.isSuccess && (
          <div className="flex items-center gap-2 text-success text-sm font-medium pt-1">
            <CheckCircle2 className="w-4 h-4" />
            Saved — taking you back to the list…
          </div>
        )}
      </form>

      <div className="text-xs text-muted-foreground leading-relaxed max-w-xl">
        <Plus className="w-3 h-3 inline -mt-0.5 mr-1" />
        Customers live alongside jobs, calls, and appointments in the unified
        list. Future iterations will let you create jobs and appointments
        inline from this same page once a customer exists.
      </div>
    </div>
  );
}
