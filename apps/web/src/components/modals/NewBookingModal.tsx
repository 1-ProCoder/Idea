import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, MapPin } from 'lucide-react';

import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { useAuthedFetch } from '../../hooks/useAuthedFetch';
import {
  createJob,
  type ApiError,
  type JobInput,
} from '../../lib/api-jobs';
import { listCustomers, type CustomerDto } from '../../lib/api-customers';
import { listWorkers, type WorkerDto } from '../../lib/api-workers';

type Props = {
  open: boolean;
  onClose: () => void;
};

type FormState = {
  customerId: string;
  workerId: string;
  issue: string;
  address: string;
  priority: 'NORMAL' | 'URGENT' | 'EMERGENCY';
  durationMinutes: number;
  startLocal: string; // yyyy-mm-ddThh:mm
};

function defaultStartLocal(): string {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return d.toISOString().slice(0, 16);
}

const inputClass =
  'mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground ' +
  'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring ' +
  'disabled:opacity-50 transition-colors';

export default function NewBookingModal({ open, onClose }: Props) {
  const fetch = useAuthedFetch();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [workers, setWorkers] = useState<WorkerDto[]>([]);
  const [form, setForm] = useState<FormState>({
    customerId: '',
    workerId: '',
    issue: '',
    address: '',
    priority: 'NORMAL',
    durationMinutes: 60,
    startLocal: defaultStartLocal(),
  });
  const [error, setError] = useState<string | null>(null);
  const [loadingLists, setLoadingLists] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setLoadingLists(true);
    Promise.all([
      fetch((t) => listCustomers(t, { pageSize: 100 })),
      fetch((t) => listWorkers(t, { active: true })),
    ])
      .then(([c, w]) => {
        setCustomers(c.items);
        setWorkers(w.items);
        setForm((prev) => ({
          ...prev,
          customerId: prev.customerId || c.items[0]?.id || '',
          workerId: prev.workerId || w.items[0]?.id || '',
        }));
      })
      .catch((err: ApiError) => {
        setError(err.message ?? 'Could not load customers or workers');
      })
      .finally(() => setLoadingLists(false));
  }, [open, fetch]);

  const createMutation = useMutation({
    // Single POST to /api/jobs — the server creates the linked Appointment
    // transactionally inside the same query, so the response is canonical.
    mutationFn: (input: JobInput) => fetch((t) => createJob(t, input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Booking created', 'Technician has been notified.');
      onClose();
    },
    onError: (err: ApiError) =>
      setError(err.message ?? 'Could not create booking'),
  });

  function buildPayload(): JobInput | null {
    const startIso = new Date(form.startLocal).toISOString();
    const endIso = new Date(
      new Date(startIso).getTime() + form.durationMinutes * 60_000,
    ).toISOString();
    if (!form.customerId || !form.workerId || !form.issue.trim()) return null;
    return {
      customerId: form.customerId,
      workerId: form.workerId,
      issue: form.issue.trim(),
      address: form.address.trim() || null,
      priority: form.priority,
      status: 'SCHEDULED',
      appointment: {
        workerId: form.workerId,
        start: startIso,
        end: endIso,
      },
    };
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = buildPayload();
    if (!payload) {
      setError('Pick a customer, a technician, and describe the job.');
      return;
    }
    createMutation.mutate(payload);
  }

  const isPending = createMutation.isPending || loadingLists;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New booking"
      description="Schedule a job and create a linked appointment atomically."
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="bk-customer"
            >
              Customer
            </label>
            <select
              id="bk-customer"
              value={form.customerId}
              onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))}
              disabled={isPending}
              className={inputClass}
            >
              {customers.length === 0 && (
                <option value="">No customers — add one first</option>
              )}
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.phone}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="bk-worker"
            >
              Technician
            </label>
            <select
              id="bk-worker"
              value={form.workerId}
              onChange={(e) => setForm((f) => ({ ...f, workerId: e.target.value }))}
              disabled={isPending}
              className={inputClass}
            >
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} · {w.role}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label
            className="text-sm font-medium text-foreground"
            htmlFor="bk-issue"
          >
            Job description
          </label>
          <input
            id="bk-issue"
            required
            maxLength={500}
            value={form.issue}
            onChange={(e) => setForm((f) => ({ ...f, issue: e.target.value }))}
            placeholder="e.g. Leaking pipe under bathroom sink"
            disabled={isPending}
            className={inputClass}
          />
        </div>

        <div>
          <label
            className="text-sm font-medium text-foreground"
            htmlFor="bk-address"
          >
            Address <span className="text-muted-foreground text-xs">(optional)</span>
          </label>
          <div className="relative">
            <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              id="bk-address"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="128 Birch Ln, Brighton"
              disabled={isPending}
              className={`${inputClass} pl-8`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="bk-start"
            >
              Start
            </label>
            <input
              id="bk-start"
              type="datetime-local"
              value={form.startLocal}
              onChange={(e) => setForm((f) => ({ ...f, startLocal: e.target.value }))}
              disabled={isPending}
              className={inputClass}
            />
          </div>
          <div>
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="bk-duration"
            >
              Duration (min)
            </label>
            <input
              id="bk-duration"
              type="number"
              min={15}
              max={480}
              step={15}
              value={form.durationMinutes}
              onChange={(e) =>
                setForm((f) => ({ ...f, durationMinutes: Number(e.target.value) || 60 }))
              }
              disabled={isPending}
              className={inputClass}
            />
          </div>
          <div>
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="bk-priority"
            >
              Priority
            </label>
            <select
              id="bk-priority"
              value={form.priority}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  priority: e.target.value as FormState['priority'],
                }))
              }
              disabled={isPending}
              className={inputClass}
            >
              <option value="NORMAL">Normal</option>
              <option value="URGENT">Urgent</option>
              <option value="EMERGENCY">Emergency</option>
            </select>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-2"
          >
            {error}
          </p>
        )}

        <div className="flex justify-end items-center gap-2 pt-2">
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
            disabled={isPending}
            className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground transition-colors inline-flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            {createMutation.isPending ? 'Booking…' : 'Book it'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
