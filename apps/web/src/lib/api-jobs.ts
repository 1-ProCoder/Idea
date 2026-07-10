// Typed API client for /api/jobs.
// Supports inline Appointment creation (transactional on the server).

import type {
  JobStatus,
  JobPriority,
} from '@flowfix/shared';

export type JobDto = {
  id: string;
  businessId: string;
  customerId: string;
  workerId: string | null;
  issue: string;
  address: string | null;
  status: JobStatus;
  priority: JobPriority;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AppointmentInput = {
  workerId: string;
  /** ISO 8601 datetime */
  start: string;
  /** ISO 8601 datetime */
  end: string;
  notes?: string | null;
};

export type JobInput = {
  customerId: string;
  workerId?: string | null;
  issue: string;
  address?: string | null;
  status?: JobStatus;
  priority?: JobPriority;
  notes?: string | null;
  appointment?: AppointmentInput | null;
};

export type JobListResponse = {
  items: JobDto[];
  total: number;
};

export type ApiError = {
  status: number;
  message: string;
  error?: string;
  issues?: Array<{ path: string; message: string }>;
};

async function authedFetch<T>(
  path: string,
  init: RequestInit & { token: string },
): Promise<T> {
  const { token, headers, ...rest } = init;
  const res = await fetch(path, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(headers as Record<string, string> | undefined),
    },
  });
  if (!res.ok) {
    let body: ApiError | null = null;
    try {
      body = (await res.json()) as ApiError;
    } catch {
      /* ignore */
    }
    const err: ApiError = {
      status: res.status,
      message: body?.message ?? body?.error ?? res.statusText,
      ...(body?.issues ? { issues: body.issues } : {}),
    };
    throw err;
  }
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

function withQuery(
  path: string,
  params: Record<string, string | number | undefined>,
): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '') continue;
    qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `${path}?${s}` : path;
}

export function listJobs(
  token: string,
  params: {
    status?: JobStatus;
    priority?: JobPriority;
    workerId?: string;
    customerId?: string;
    q?: string;
  } = {},
): Promise<JobListResponse> {
  return authedFetch<JobListResponse>(
    withQuery('/api/jobs', {
      status: params.status,
      priority: params.priority,
      workerId: params.workerId,
      customerId: params.customerId,
      q: params.q,
    }),
    { method: 'GET', token },
  );
}

export function getJob(token: string, id: string): Promise<JobDto> {
  return authedFetch<JobDto>(`/api/jobs/${id}`, { method: 'GET', token });
}

export function createJob(token: string, input: JobInput): Promise<JobDto> {
  return authedFetch<JobDto>('/api/jobs', {
    method: 'POST',
    token,
    body: JSON.stringify(input),
  });
}

export function updateJob(
  token: string,
  id: string,
  input: Partial<JobInput>,
): Promise<JobDto> {
  return authedFetch<JobDto>(`/api/jobs/${id}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(input),
  });
}

export function deleteJob(token: string, id: string): Promise<void> {
  return authedFetch<void>(`/api/jobs/${id}`, { method: 'DELETE', token });
}
