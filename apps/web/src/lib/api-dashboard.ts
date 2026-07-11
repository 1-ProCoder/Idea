// Typed API client for /api/dashboard/stats — single aggregated payload
// that powers the DashboardPage's 5 stat cards + recent-activity lists.

export type JobListItem = {
  id: string;
  issue: string;
  status:
    | 'PENDING'
    | 'SCHEDULED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'CANCELLED';
  priority: 'NORMAL' | 'URGENT' | 'EMERGENCY';
  customerId: string;
  customerName: string;
  workerId: string | null;
  workerName: string | null;
  updatedAt: string;
};

export type AppointmentListItem = {
  id: string;
  jobId: string;
  issue: string;
  priority: 'NORMAL' | 'URGENT' | 'EMERGENCY';
  customerId: string;
  customerName: string;
  workerId: string;
  workerName: string;
  /** ISO 8601 datetime */
  start: string;
  /** ISO 8601 datetime */
  end: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
};

export type DashboardStats = {
  totals: {
    customers: number;
    activeTechnicians: number;
    jobsToday: number;
    emergencyJobs: number;
    completionRate: number;
    totalCalls: number;
  };
  sparklines: {
    calls: number[];
  };
  recentJobs: JobListItem[];
  todayAppointments: AppointmentListItem[];
  asOf: string;
};

export type ApiError = {
  status: number;
  message: string;
  error?: string;
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
      // business.
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
    };
    throw err;
  }
  return (await res.json()) as T;
}

export function getDashboardStats(
  token: string | null,
): Promise<DashboardStats> {
  return authedFetch<DashboardStats>('/api/dashboard/stats', {
    method: 'GET',
    token,
  });
}
