/**
 * Typed client for `POST /api/waitlist` and `GET /api/waitlist/count`.
 * No auth header is sent — both endpoints are intentionally public so
 * visitors can join the waitlist before any sign-in exists.
 */

const API_BASE = (() => {
  const env = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';
  return env.replace(/\/$/, '');
})();

export type JoinWaitlistResult = {
  ok: boolean;
  message: string;
  alreadyOnList?: boolean;
  emailDelivery?: 'deferred';
};

export type WaitlistErrorReason =
  | 'invalid_email'
  | 'rate_limited'
  | 'internal_error'
  | 'network'
  | 'unknown';

export class WaitlistApiError extends Error {
  reason: WaitlistErrorReason;
  status: number;
  retryAfter?: number;

  constructor(
    reason: WaitlistErrorReason,
    message: string,
    status = 0,
    retryAfter?: number,
  ) {
    super(message);
    this.name = 'WaitlistApiError';
    this.reason = reason;
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

export async function joinWaitlist(email: string): Promise<JoinWaitlistResult> {
  const trimmed = email.trim();
  if (!trimmed) {
    throw new WaitlistApiError('invalid_email', 'Please enter your email.', 0);
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/waitlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: trimmed }),
    });
  } catch (err) {
    throw new WaitlistApiError(
      'network',
      err instanceof Error ? err.message : 'Network error',
      0,
    );
  }

  if (res.ok) {
    const data = (await res.json()) as JoinWaitlistResult;
    return {
      ok: true,
      message: data.message,
      alreadyOnList: data.alreadyOnList,
      emailDelivery: data.emailDelivery,
    };
  }

  let payload: {
    error?: string;
    message?: string;
    retryAfter?: number;
  } = {};
  try {
    payload = (await res.json()) as typeof payload;
  } catch {
    // Body wasn't JSON — fall through with empty payload.
  }

  const reason = payload.error as WaitlistErrorReason | undefined;
  if (reason === 'invalid_email') {
    throw new WaitlistApiError(
      'invalid_email',
      payload.message ?? 'Invalid email.',
      res.status,
    );
  }
  if (reason === 'rate_limited') {
    throw new WaitlistApiError(
      'rate_limited',
      payload.message ?? 'Too many attempts.',
      res.status,
      payload.retryAfter,
    );
  }
  if (res.status >= 500) {
    throw new WaitlistApiError(
      'internal_error',
      payload.message ?? 'Server hiccup.',
      res.status,
    );
  }
  throw new WaitlistApiError(
    'unknown',
    payload.message ?? `Failed (${res.status}).`,
    res.status,
  );
}

export async function getWaitlistCount(): Promise<number> {
  try {
    const res = await fetch(`${API_BASE}/api/waitlist/count`);
    if (!res.ok) return 0;
    const data = (await res.json()) as { count: number };
    return data.count ?? 0;
  } catch {
    return 0;
  }
}
