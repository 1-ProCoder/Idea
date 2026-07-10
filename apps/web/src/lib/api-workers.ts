// Typed API client for /api/workers.
// All requests must include a Clerk session JWT — wire via useAuthedFetch.

export type WorkerRole = 'OWNER' | 'ADMIN' | 'DISPATCHER' | 'TECHNICIAN';

export type WorkerDto = {
  id: string;
  businessId: string;
  name: string;
  role: WorkerRole;
  phone: string | null;
  email: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WorkerInput = {
  name: string;
  role?: WorkerRole;
  phone?: string | null;
  email?: string | null;
  active?: boolean;
};

export type WorkerListResponse = {
  items: WorkerDto[];
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
  params: Record<string, string | number | boolean | undefined>,
): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '') continue;
    qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `${path}?${s}` : path;
}

export function listWorkers(
  token: string,
  params: { q?: string; active?: boolean; role?: WorkerRole } = {},
): Promise<WorkerListResponse> {
  return authedFetch<WorkerListResponse>(
    withQuery('/api/workers', { q: params.q, active: params.active, role: params.role }),
    { method: 'GET', token },
  );
}

export function createWorker(
  token: string,
  input: WorkerInput,
): Promise<WorkerDto> {
  return authedFetch<WorkerDto>('/api/workers', {
    method: 'POST',
    token,
    body: JSON.stringify(input),
  });
}

export function updateWorker(
  token: string,
  id: string,
  input: Partial<WorkerInput>,
): Promise<WorkerDto> {
  return authedFetch<WorkerDto>(`/api/workers/${id}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(input),
  });
}

export function deleteWorker(token: string, id: string): Promise<void> {
  return authedFetch<void>(`/api/workers/${id}`, {
    method: 'DELETE',
    token,
  });
}
