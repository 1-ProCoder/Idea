// Typed API client for /api/business.
// Mirrors BusinessProfile in the Prisma schema, including the three
// JSON-shaped settings blobs (branding, notificationPrefs, aiConfig).

export type BusinessProfileDto = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  timezone: string;
  branding: Record<string, unknown>;
  notificationPrefs: Record<string, unknown>;
  aiConfig: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type BusinessPatchInput = Partial<{
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  timezone: string;
  branding: Record<string, unknown>;
  notificationPrefs: Record<string, unknown>;
  aiConfig: Record<string, unknown>;
}>;

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
      // business. The PATCH endpoint remains auth-gated, so a null
      // token there returns 401 — which is the intended behavior
      // for guests trying to mutate.
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

export function getBusiness(token: string | null): Promise<BusinessProfileDto> {
  return authedFetch<BusinessProfileDto>('/api/business', {
    method: 'GET',
    token,
  });
}

export function updateBusiness(
  token: string | null,
  input: BusinessPatchInput,
): Promise<BusinessProfileDto> {
  return authedFetch<BusinessProfileDto>('/api/business', {
    method: 'PATCH',
    token,
    body: JSON.stringify(input),
  });
}
