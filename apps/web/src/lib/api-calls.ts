// Typed API client for /api/calls.
// Includes list + create (used by "Test call" demo button) + stats sparkline.

export type CallDto = {
  id: string;
  businessId: string;
  customerId: string | null;
  fromPhone: string;
  duration: number | null;
  isEmergency: boolean;
  summary: string | null;
  transcript: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CallInput = {
  customerId?: string | null;
  fromPhone: string;
  duration?: number | null;
  isEmergency?: boolean;
  summary?: string | null;
  transcript?: string | null;
};

export type CallListResponse = {
  items: CallDto[];
  total: number;
};

export type CallStatsResponse = {
  total: number;
  emergency: number;
  /** 7-bucket array (oldest → most recent). */
  last7Days: number[];
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

export function listCalls(
  token: string,
  params: {
    status?: 'ALL' | 'EMERGENCY' | 'MISSED' | 'OK';
    q?: string;
    customerId?: string;
    limit?: number;
  } = {},
): Promise<CallListResponse> {
  return authedFetch<CallListResponse>(
    withQuery('/api/calls', {
      status: params.status,
      q: params.q,
      customerId: params.customerId,
      limit: params.limit,
    }),
    { method: 'GET', token },
  );
}

export function getCall(token: string, id: string): Promise<CallDto> {
  return authedFetch<CallDto>(`/api/calls/${id}`, { method: 'GET', token });
}

export function createCall(token: string, input: CallInput): Promise<CallDto> {
  return authedFetch<CallDto>('/api/calls', {
    method: 'POST',
    token,
    body: JSON.stringify(input),
  });
}

export function getCallStats(token: string): Promise<CallStatsResponse> {
  return authedFetch<CallStatsResponse>('/api/calls/stats', {
    method: 'GET',
    token,
  });
}
