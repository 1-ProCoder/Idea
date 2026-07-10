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
    };
    throw err;
  }
  return (await res.json()) as T;
}

export function getDashboardStats(token: string): Promise<DashboardStats> {
  return authedFetch<DashboardStats>('/api/dashboard/stats', {
    method: 'GET',
    token,
  });
}
