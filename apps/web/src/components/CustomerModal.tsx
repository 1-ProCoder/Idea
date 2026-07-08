import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthedFetch } from '../hooks/useAuthedFetch';
import {
  createCustomer,
  updateCustomer,
  deleteCustomer,
  type ApiError,
  type CustomerDto,
  type CustomerInput,
} from '../lib/api-customers';

type Props = {
  open: boolean;
  onClose: () => void;
  editing: CustomerDto | null;
};

type FormState = {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
};

const EMPTY: FormState = {
  name: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
};

const PhoneRegex = /^[+()0-9 .\-]{7,20}$/;

export default function CustomerModal({ open, onClose, editing }: Props) {
  const fetch = useAuthedFetch();
  const queryClient = useQueryClient();
  const isEditing = editing !== null;

  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        name: editing.name,
        phone: editing.phone,
        email: editing.email ?? '',
        address: editing.address ?? '',
        notes: editing.notes ?? '',
      });
    } else {
      setForm(EMPTY);
    }
    setError(null);
    setConfirmingDelete(false);
  }, [open, editing]);

  const createMutation = useMutation({
    mutationFn: (input: CustomerInput) =>
      fetch((token) => createCustomer(token, input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      onClose();
    },
    onError: (err: ApiError) =>
      setError(err.message ?? 'Could not create customer'),
  });

  const updateMutation = useMutation({
    mutationFn: (input: Partial<CustomerInput>) =>
      fetch((token) => updateCustomer(token, editing!.id, input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      onClose();
    },
    onError: (err: ApiError) =>
      setError(err.message ?? 'Could not save changes'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => fetch((token) => deleteCustomer(token, editing!.id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      onClose();
    },
    onError: (err: ApiError) =>
      setError(err.message ?? 'Could not delete customer'),
  });

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  const canCreate =
    form.name.trim().length > 0 &&
    form.phone.trim().length > 0 &&
    PhoneRegex.test(form.phone.trim());

  function buildPayload(): Partial<CustomerInput> {
    const payload: Partial<CustomerInput> = {};
    if (form.name.trim()) payload.name = form.name.trim();
    if (form.phone.trim()) payload.phone = form.phone.trim();
    payload.email = form.email.trim() ? form.email.trim() : null;
    payload.address = form.address.trim() ? form.address.trim() : null;
    payload.notes = form.notes.trim() ? form.notes.trim() : null;
    return payload;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!isEditing && (!form.name.trim() || !form.phone.trim())) {
      setError('Name and phone are required.');
      return;
    }
    if (!isEditing && !PhoneRegex.test(form.phone.trim())) {
      setError('Phone format looks off — use digits, spaces, +, ( ) and dashes only.');
      return;
    }

    const payload = buildPayload();
    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload as CustomerInput);
    }
  }

  function handleDelete() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    deleteMutation.mutate();
  }

  if (!open) return null;

  const fieldLabel = (children: React.ReactNode, htmlFor: string, required = false) => (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium text-stone-700"
    >
      {children}
      {required && <span className="text-rose-700"> *</span>}
    </label>
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm cursor-default"
      />

      <div className="relative bg-white rounded-xl border border-stone-200 shadow-xl w-full max-w-lg p-6">
        <header className="flex items-center justify-between mb-4">
          <h2
            id="customer-modal-title"
            className="text-xl font-semibold text-stone-900"
          >
            {isEditing ? 'Edit customer' : 'New customer'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-stone-500 hover:text-stone-900 rounded p-1"
          >
            ✕
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            {fieldLabel('Name', 'cust-name', true)}
            <input
              id="cust-name"
              autoFocus
              required
              maxLength={120}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              disabled={isPending}
              className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          <div>
            {fieldLabel('Phone', 'cust-phone', true)}
            <input
              id="cust-phone"
              required
              maxLength={20}
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              disabled={isPending}
              placeholder="(555) 123-4567"
              className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 font-mono"
            />
            <p className="text-xs text-stone-500 mt-1">
              Phone is the dedupe key — same phone twice for the same business is rejected.
            </p>
          </div>

          <div>
            {fieldLabel('Email', 'cust-email')}
            <input
              id="cust-email"
              type="email"
              maxLength={120}
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              disabled={isPending}
              className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          <div>
            {fieldLabel('Address', 'cust-address')}
            <input
              id="cust-address"
              maxLength={255}
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              disabled={isPending}
              className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          <div>
            {fieldLabel('Notes', 'cust-notes')}
            <textarea
              id="cust-notes"
              rows={3}
              maxLength={2000}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              disabled={isPending}
              className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-md p-2"
            >
              {error}
            </p>
          )}

          <footer className="flex items-center justify-between gap-2 pt-2">
            <div>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending}
                  className={[
                    'text-sm font-medium rounded-md px-3 py-1.5 transition-colors',
                    confirmingDelete
                      ? 'bg-rose-600 text-white hover:bg-rose-700'
                      : 'text-rose-700 hover:bg-rose-50',
                  ].join(' ')}
                >
                  {confirmingDelete ? 'Tap again to confirm delete' : 'Delete'}
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="px-3 py-1.5 rounded-md text-sm font-medium text-stone-700 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || (!isEditing && !canCreate)}
                className="px-3 py-1.5 rounded-md text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:bg-stone-400"
              >
                {isPending
                  ? 'Saving…'
                  : isEditing
                    ? 'Save changes'
                    : 'Create customer'}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}
