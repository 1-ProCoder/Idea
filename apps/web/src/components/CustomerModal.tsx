import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
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
import { Modal } from './ui/Modal';

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

const inputClass =
  'mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground ' +
  'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring ' +
  'disabled:opacity-50 transition-colors';

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
      setError(
        'Phone format looks off — use digits, spaces, +, ( ) and dashes only.',
      );
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

  const fieldLabel = (
    children: ReactNode,
    htmlFor: string,
    required = false,
  ) => (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium text-foreground"
    >
      {children}
      {required && <span className="text-destructive"> *</span>}
    </label>
  );

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? 'Edit customer' : 'New customer'}>
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
            className={inputClass}
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
            className={`${inputClass} font-mono`}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Phone is the dedupe key — same phone twice for the same business
            is rejected.
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
            className={inputClass}
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
            className={inputClass}
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
            className={inputClass}
          />
        </div>

        {error && (
          <p
            role="alert"
            className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-2"
          >
            {error}
          </p>
        )}

        <div className="flex items-center justify-between gap-2 pt-2">
          <div>
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className={[
                  'text-sm font-medium rounded-md px-3 py-1.5 transition-colors',
                  confirmingDelete
                    ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                    : 'text-destructive hover:bg-destructive/10',
                ].join(' ')}
              >
                {confirmingDelete
                  ? 'Tap again to confirm delete'
                  : 'Delete'}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-3 py-1.5 rounded-md text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || (!isEditing && !canCreate)}
              className="px-3 py-1.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground transition-colors"
            >
              {isPending
                ? 'Saving…'
                : isEditing
                  ? 'Save changes'
                  : 'Create customer'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
