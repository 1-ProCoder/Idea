// Typed API client for /api/appointments.
// NO create endpoint — appointments are only created implicitly when a
// Job is POSTed with an `appointment` payload (/api/jobs).

import type {
  AppointmentStatus,
} from '@flowfix/shared';

export type AppointmentDto = {
  id: string;
  businessId: string;
  jobId: string;
  workerId: string;
  /** ISO 8601 datetime */
  start: string;
  /** ISO 8601 datetime */
  end: string;
  status: AppointmentStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AppointmentListResponse = {
  items: AppointmentDto[];
  total: number;
};

export type AppointmentPatchInput = Partial<{
  start: string;
  end: string;
  status: AppointmentStatus;
  notes: string | null;
  workerId: string;
}>;

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

export function listAppointments(
  token: string,
  params: {
    from?: string;
    to?: string;
    workerId?: string;
    status?: AppointmentStatus;
    limit?: number;
  } = {},
): Promise<AppointmentListResponse> {
  return authedFetch<AppointmentListResponse>(
    withQuery('/api/appointments', {
      from: params.from,
      to: params.to,
      workerId: params.workerId,
      status: params.status,
      limit: params.limit,
    }),
    { method: 'GET', token },
  );
}

export function getAppointment(
  token: string,
  id: string,
): Promise<AppointmentDto> {
  return authedFetch<AppointmentDto>(`/api/appointments/${id}`, {
    method: 'GET',
    token,
  });
}

export function updateAppointment(
  token: string,
  id: string,
  input: AppointmentPatchInput,
): Promise<AppointmentDto> {
  return authedFetch<AppointmentDto>(`/api/appointments/${id}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(input),
  });
}

export function deleteAppointment(token: string, id: string): Promise<void> {
  return authedFetch<void>(`/api/appointments/${id}`, { method: 'DELETE', token });
}
