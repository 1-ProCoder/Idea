import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';

import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { useAuthedFetch } from '../../hooks/useAuthedFetch';
import {
  createJob,
  type ApiError,
  type JobInput,
} from '../../lib/api-jobs';
import {
  listCustomers,
  createCustomer,
  type CustomerDto,
  type CustomerInput,
} from '../../lib/api-customers';
import {
  listWorkers,
  type WorkerDto,
} from '../../lib/api-workers';

type Props = {
  open: boolean;
  onClose: () => void;
};

type FormState = {
  customerMode: 'existing' | 'new';
  customerId: string;
  newCustomerName: string;
  newCustomerPhone: string;
  newCustomerAddress: string;
  workerId: string;
  issue: string;
  priority: 'NORMAL' | 'URGENT' | 'EMERGENCY';
};

const inputClass =
  'mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground ' +
  'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring ' +
  'disabled:opacity-50 transition-colors';

const PhoneRegex = /^[+()0-9 .\-]{7,20}$/;

export default function NewJobModal({ open, onClose }: Props) {
  const fetch = useAuthedFetch();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [workers, setWorkers] = useState<WorkerDto[]>([]);
  const [form, setForm] = useState<FormState>({
    customerMode: 'existing',
    customerId: '',
    newCustomerName: '',
    newCustomerPhone: '',
    newCustomerAddress: '',
    workerId: '',
    issue: '',
    priority: 'NORMAL',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setLoading(true);
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
      .catch((err: ApiError) => setError(err.message ?? 'Could not load'))
      .finally(() => setLoading(false));
  }, [open, fetch]);

  const submit = useMutation({
    mutationFn: async () => {
      let customerId = form.customerId;
      if (form.customerMode === 'new') {
        if (
          !form.newCustomerName.trim() ||
          !PhoneRegex.test(form.newCustomerPhone.trim())
        ) {
          throw {
            status: 400,
            message:
              'Customer name and a valid phone are required when adding a new customer.',
          } satisfies ApiError;
        }
        const created: CustomerDto = await fetch((t) =>
          createCustomer(t, {
            name: form.newCustomerName.trim(),
            phone: form.newCustomerPhone.trim(),
            address: form.newCustomerAddress.trim() || null,
          } satisfies CustomerInput),
        );
        customerId = created.id;
      }
      if (!customerId || !form.workerId || !form.issue.trim()) {
        throw {
          status: 400,
          message: 'Pick a customer, technician, and describe the job.',
        } satisfies ApiError;
      }
      const jobInput: JobInput = {
        customerId,
        workerId: form.workerId,
        issue: form.issue.trim(),
        priority: form.priority,
        status: 'PENDING',
        address:
          form.customerMode === 'new'
            ? form.newCustomerAddress.trim() || null
            : null,
      };
      return fetch((t) => createJob(t, jobInput));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Job created');
      onClose();
    },
    onError: (err: ApiError) => setError(err.message ?? 'Could not save'),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    submit.mutate();
  }

  const busy = submit.isPending || loading;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New job"
      description="Add a job to a customer. Auto-creates the customer if needed."
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="flex items-center gap-2 p-0.5 rounded-lg glass-card self-start w-fit">
          {(['existing', 'new'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setForm((f) => ({ ...f, customerMode: m }))}
              className={[
                'px-3 py-1 text-xs font-semibold rounded-md transition-colors',
                form.customerMode === m
                  ? 'bg-white/[0.06] text-foreground ring-1 ring-white/[0.08]'
                  : 'text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              {m === 'existing' ? 'Existing customer' : 'New customer'}
            </button>
          ))}
        </div>

        {form.customerMode === 'existing' ? (
          <div>
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="nj-customer"
            >
              Customer
            </label>
            <select
              id="nj-customer"
              value={form.customerId}
              onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))}
              disabled={busy}
              className={inputClass}
            >
              {customers.length === 0 && (
                <option value="">No customers — switch to "New customer"</option>
              )}
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.phone}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  className="text-sm font-medium text-foreground"
                  htmlFor="nj-cname"
                >
                  Name
                </label>
                <input
                  id="nj-cname"
                  required
                  value={form.newCustomerName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, newCustomerName: e.target.value }))
                  }
                  placeholder="Sarah Mitchell"
                  disabled={busy}
                  className={inputClass}
                />
              </div>
              <div>
                <label
                  className="text-sm font-medium text-foreground"
                  htmlFor="nj-cphone"
                >
                  Phone
                </label>
                <input
                  id="nj-cphone"
                  required
                  value={form.newCustomerPhone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, newCustomerPhone: e.target.value }))
                  }
                  placeholder="(555) 234-8910"
                  disabled={busy}
                  className={`${inputClass} font-mono`}
                />
              </div>
            </div>
            <div>
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="nj-caddr"
              >
                Address <span className="text-muted-foreground text-xs">(optional)</span>
              </label>
              <input
                id="nj-caddr"
                value={form.newCustomerAddress}
                onChange={(e) =>
                  setForm((f) => ({ ...f, newCustomerAddress: e.target.value }))
                }
                placeholder="128 Birch Ln, Brighton"
                disabled={busy}
                className={inputClass}
              />
            </div>
          </div>
        )}

        <div>
          <label
            className="text-sm font-medium text-foreground"
            htmlFor="nj-issue"
          >
            Issue
          </label>
          <input
            id="nj-issue"
            required
            maxLength={500}
            value={form.issue}
            onChange={(e) => setForm((f) => ({ ...f, issue: e.target.value }))}
            placeholder="e.g. Bathroom faucet install"
            disabled={busy}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="nj-worker"
            >
              Technician
            </label>
            <select
              id="nj-worker"
              value={form.workerId}
              onChange={(e) => setForm((f) => ({ ...f, workerId: e.target.value }))}
              disabled={busy}
              className={inputClass}
            >
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} · {w.role}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="nj-priority"
            >
              Priority
            </label>
            <select
              id="nj-priority"
              value={form.priority}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  priority: e.target.value as FormState['priority'],
                }))
              }
              disabled={busy}
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
            disabled={busy}
            className="px-3 py-1.5 rounded-md text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {submit.isPending ? 'Saving…' : 'Create job'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
