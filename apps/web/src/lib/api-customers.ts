// Typed API client for /api/customers.
//
// All requests must include a Clerk session JWT in the Authorization header.
// The `useAuthedFetch` hook resolves the JWT and threads it through.

export type CustomerDto = {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CustomerInput = {
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
};

export type CustomerListResponse = {
  items: CustomerDto[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type ApiError = {
  status: number;
  message: string;
  error?: string;
  issues?: Array<{ path: string; message: string }>;
};

async function authedFetch<T>(
  path: string,
  init: RequestInit & { token: string | null },
): Promise<T> {
  const { token, headers, ...rest } = init;
  const res = await fetch(path, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      // Only attach the Authorization header when we actually have a
      // Clerk session token. When `token` is `null` the request goes
      // out anonymous, and the backend routes it to the shared demo
      // business. The mutations (createCustomer/updateCustomer/
      // deleteCustomer) pass a real token; the public list endpoint
      // accepts either.
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers as Record<string, string> | undefined),
    },
  });
  if (!res.ok) {
    let body: ApiError | null = null;
    try {
      body = (await res.json()) as ApiError;
    } catch {
      // ignore parse errors
    }
    const err: ApiError = {
      status: res.status,
      message: body?.message ?? body?.error ?? res.statusText,
      ...(body?.issues ? { issues: body.issues } : {}),
    };
    throw err;
  }
  if (res.status === 204) {
    return undefined as unknown as T;
  }
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

export function listCustomers(
  token: string | null,
  params: { q?: string; page?: number; pageSize?: number },
): Promise<CustomerListResponse> {
  return authedFetch<CustomerListResponse>(
    withQuery('/api/customers', {
      q: params.q,
      page: params.page,
      pageSize: params.pageSize,
    }),
    { method: 'GET', token },
  );
}

export function createCustomer(
  token: string | null,
  input: CustomerInput,
): Promise<CustomerDto> {
  return authedFetch<CustomerDto>('/api/customers', {
    method: 'POST',
    token,
    body: JSON.stringify(input),
  });
}

export function updateCustomer(
  token: string | null,
  id: string,
  input: Partial<CustomerInput>,
): Promise<CustomerDto> {
  return authedFetch<CustomerDto>(`/api/customers/${id}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(input),
  });
}

export function deleteCustomer(
  token: string | null,
  id: string,
): Promise<void> {
  return authedFetch<void>(`/api/customers/${id}`, {
    method: 'DELETE',
    token,
  });
}
