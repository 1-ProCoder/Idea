// Typed client for /api/usage.
//
// Powers the Billing page (real customer / job / call / appointment
// counts under the "Current usage" cards). Mirrors the backend
// payload built in apps/api/src/routes/usage.ts.

export type UsageDto = {
  customers: number;
  jobs: {
    total: number;
    pending: number;
    scheduled: number;
    completed: number;
    emergency: number;
  };
  calls: {
    total: number;
    emergency: number;
  };
  appointments: {
    total: number;
    today: number;
  };
  /** ISO timestamp the snapshot was taken. */
  asOf: string;
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
  return (await res.json()) as T;
}

export function getUsage(token: string): Promise<UsageDto> {
  return authedFetch<UsageDto>('/api/usage', { method: 'GET', token });
}
