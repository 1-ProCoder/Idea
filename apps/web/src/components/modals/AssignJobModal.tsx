import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Briefcase, User } from 'lucide-react';

import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { useAuthedFetch } from '../../hooks/useAuthedFetch';
import {
  listWorkers,
  type ApiError,
  type WorkerDto,
} from '../../lib/api-workers';
import {
  listJobs,
  updateJob,
  type JobDto,
} from '../../lib/api-jobs';

type Props = {
  open: boolean;
  onClose: () => void;
  /** Pre-selected worker (when invoked from a tech card's "Assign" button). */
  workerId?: string;
};

export default function AssignJobModal({ open, onClose, workerId }: Props) {
  const fetch = useAuthedFetch();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [workers, setWorkers] = useState<WorkerDto[]>([]);
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<string>(workerId ?? '');
  const [selectedJob, setSelectedJob] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSelectedWorker(workerId ?? '');
    setSelectedJob('');
    setLoading(true);
    Promise.all([
      fetch((t) => listWorkers(t, { active: true })),
      fetch((t) => listJobs(t, { status: 'PENDING' })),
    ])
      .then(([w, j]) => {
        setWorkers(w.items);
        setJobs(j.items);
        if (!workerId && w.items[0]) setSelectedWorker(w.items[0].id);
      })
      .catch((err: ApiError) => setError(err.message ?? 'Could not load'))
      .finally(() => setLoading(false));
  }, [open, workerId, fetch]);

  const assign = useMutation({
    mutationFn: ({ jobId, workerId }: { jobId: string; workerId: string }) =>
      fetch((t) => updateJob(t, jobId, { workerId, status: 'SCHEDULED' })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success(
        'Job assigned',
        'Schedule updated and the tech has been notified.',
      );
      onClose();
    },
    onError: (err: ApiError) => setError(err.message ?? 'Could not assign'),
  });

  const busy = assign.isPending || loading;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign job"
      description="Pick a pending job, then dispatch it to a technician."
    >
      <div className="space-y-4">
        <div>
          <label
            className="text-sm font-medium text-foreground"
            htmlFor="aj-worker"
          >
            <User className="w-3.5 h-3.5 inline mr-1 text-muted-foreground" />
            Technician
          </label>
          <select
            id="aj-worker"
            value={selectedWorker}
            onChange={(e) => setSelectedWorker(e.target.value)}
            disabled={busy}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
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
            htmlFor="aj-job"
          >
            <Briefcase className="w-3.5 h-3.5 inline mr-1 text-muted-foreground" />
            Job
          </label>
          {jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-1">
              No pending jobs. Create one first via + New Job on the dashboard
              or schedule page.
            </p>
          ) : (
            <select
              id="aj-job"
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              disabled={busy}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.issue} · {j.priority}
                </option>
              ))}
            </select>
          )}
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
            type="button"
            onClick={() =>
              assign.mutate({ jobId: selectedJob, workerId: selectedWorker })
            }
            disabled={busy || !selectedJob || !selectedWorker}
            className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground transition-colors"
          >
            {assign.isPending ? 'Assigning…' : 'Assign'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
