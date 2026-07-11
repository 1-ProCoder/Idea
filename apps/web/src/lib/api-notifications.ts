/**
 * Typed client for `GET /api/notifications`. The bell dropdown consumes
 * this via `useQuery` + `useAuthedFetch`. Mirrors the convention used by
 * `apps/web/src/lib/api-business.ts` and `api-usage.ts` so future
 * contributors can copy-paste the pattern.
 */

export type NotificationType =
  | 'inbound_call'
  | 'emergency_call'
  | 'job_created'
  | 'job_scheduled'
  | 'job_completed'
  | 'booking_confirmed';

export type NotificationDto = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  iconKind: 'phone' | 'alert' | 'check' | 'briefcase' | 'calendar';
  colorKind: 'primary' | 'danger' | 'success' | 'warning' | 'info';
  /**
   * ISO 8601 timestamp. The bell formats relative time client-side
   * ("2 min ago") so the source-of-truth stays an absolute moment.
   * Server uses `updatedAt` for completion/scheduling events so we
   * surface the most recent state transition, not the original intake.
   */
  createdAt: string;
};

export type ActivityFeed = {
  items: NotificationDto[];
  asOf: string;
};

export class ApiError extends Error {
  status: number;
  issues: Array<{ path: string; message: string }>;
  constructor(
    status: number,
    message: string,
    issues: Array<{ path: string; message: string }> = [],
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.issues = issues;
  }
}

const API_BASE = (() => {
  const env = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';
  return env.replace(/\/$/, '');
})();

/**
 * Fetch the unified activity feed. Backend aggregates `Call`, `Job`,
 * and `Appointment` rows into a single reverse-chronological list.
 * Defaults to 15 items; pass `limit` to widen/narrow.
 */
export async function getNotifications(
  token: string,
  opts: { limit?: number } = {},
): Promise<ActivityFeed> {
  const qs = new URLSearchParams();
  if (opts.limit !== undefined) qs.set('limit', String(opts.limit));
  const url = `${API_BASE}/api/notifications${qs.size ? `?${qs.toString()}` : ''}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    let payload: { message?: string; issues?: Array<{ path: string; message: string }> } = {};
    try {
      payload = (await res.json()) as typeof payload;
    } catch {
      // body wasn't JSON — fall through with empty payload
    }
    throw new ApiError(
      res.status,
      payload.message ?? `Failed (${res.status})`,
      payload.issues ?? [],
    );
  }

  return (await res.json()) as ActivityFeed;
}
