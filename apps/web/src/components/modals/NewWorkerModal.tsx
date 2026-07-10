import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';

import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { useAuthedFetch } from '../../hooks/useAuthedFetch';
import {
  createWorker,
  type ApiError,
  type WorkerInput,
  type WorkerRole,
} from '../../lib/api-workers';

type Props = {
  open: boolean;
  onClose: () => void;
};

type FormState = {
  name: string;
  role: WorkerRole;
  phone: string;
  email: string;
};

const inputClass =
  'mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground ' +
  'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring ' +
  'disabled:opacity-50 transition-colors';

const PhoneRegex = /^[+()0-9 .\-]{7,20}$/;

export default function NewWorkerModal({ open, onClose }: Props) {
  const fetch = useAuthedFetch();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState<FormState>({
    name: '',
    role: 'TECHNICIAN',
    phone: '',
    email: '',
  });
  const [error, setError] = useState<string | null>(null);

  const submit = useMutation({
    mutationFn: (input: WorkerInput) => fetch((t) => createWorker(t, input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Technician added');
      onClose();
      setForm({ name: '', role: 'TECHNICIAN', phone: '', email: '' });
    },
    onError: (err: ApiError) => setError(err.message ?? 'Could not save'),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    if (form.phone && !PhoneRegex.test(form.phone.trim())) {
      setError('Phone format looks off.');
      return;
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError('Email does not look valid.');
      return;
    }
    submit.mutate({
      name: form.name.trim(),
      role: form.role,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invite technician"
      description="Add a new engineer to your dispatch pool."
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="nw-name">
            Full name
          </label>
          <input
            id="nw-name"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Marcus Wells"
            disabled={submit.isPending}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="nw-role">
            Role
          </label>
          <select
            id="nw-role"
            value={form.role}
            onChange={(e) =>
              setForm((f) => ({ ...f, role: e.target.value as WorkerRole }))
            }
            disabled={submit.isPending}
            className={inputClass}
          >
            <option value="TECHNICIAN">Technician</option>
            <option value="DISPATCHER">Dispatcher</option>
            <option value="ADMIN">Admin</option>
            <option value="OWNER">Owner</option>
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="nw-phone">
              Phone
            </label>
            <input
              id="nw-phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="(555) 220-1016"
              disabled={submit.isPending}
              className={`${inputClass} font-mono`}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="nw-email">
              Email
            </label>
            <input
              id="nw-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="marcus@flowfix.demo"
              disabled={submit.isPending}
              className={inputClass}
            />
          </div>
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-2">
            {error}
          </p>
        )}
        <div className="flex justify-end items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submit.isPending}
            className="px-3 py-1.5 rounded-md text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submit.isPending}
            className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground transition-colors inline-flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            {submit.isPending ? 'Saving…' : 'Add technician'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
