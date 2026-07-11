// Unified "list" API helper.
//
// The `/list` page renders customers, jobs, calls, and appointments as
// one chronological stream. Rather than build a backend
// `GET /api/items?q=&types=&limit=` endpoint, we run four parallel
// fetches against the existing endpoints and reshape each entity into
// a common `UnifiedItem` shape. Sorting by `createdAt` keeps the
// timeline illusion intact.
//
// - Customers → search hits name / phone / email (`q` on /api/customers).
// - Jobs → search hits issue (`q` on /api/jobs).
// - Calls → search hits phone / summary (`q` on /api/calls).
// - Appointments → search hits notes (`q` on /api/appointments, added).

import {
  listCustomers,
  type CustomerDto,
} from './api-customers';
import {
  listJobs,
  type JobDto,
} from './api-jobs';
import {
  listCalls,
  type CallDto,
} from './api-calls';
import {
  listAppointments,
  type AppointmentDto,
} from './api-appointments';

export type UnifiedItemType =
  | 'customer'
  | 'job'
  | 'call'
  | 'appt';

export type UnifiedBadge = {
  label: string;
  /** Maps to one of the semantic tailwind tokens in the design system. */
  tone: 'primary' | 'accent' | 'warning' | 'success' | 'danger';
};

export type UnifiedItem = {
  id: string;
  type: UnifiedItemType;
  /** ISO 8601 timestamp — used for chronological sort. */
  createdAt: string;
  headline: string;
  subtitle: string;
  badges: UnifiedBadge[];
  /** Optional deep-link target. Renders an action button on the row. */
  actionUrl?: string;
  actionLabel?: string;
};

export type UnifiedListTab = 'all' | UnifiedItemType;

export type UnifiedListResponse = {
  items: UnifiedItem[];
  /** Total across all types BEFORE local pagination slicing. */
  total: number;
};

const TONE_BY_TYPE: Record<UnifiedItemType, UnifiedBadge['tone']> = {
  customer: 'primary',
  job: 'accent',
  call: 'warning',
  appt: 'success',
};

function timeAgoLabel(iso: string): string {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const s = Math.round(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  const days = Math.round(h / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function customerToItem(c: CustomerDto): UnifiedItem {
  return {
    id: c.id,
    type: 'customer',
    createdAt: c.createdAt,
    headline: c.name,
    subtitle: c.address?.trim() || c.email || c.phone,
    badges: [{ label: 'Customer', tone: TONE_BY_TYPE.customer }],
  };
}

function jobToItem(j: JobDto): UnifiedItem {
  const priorityBadge: UnifiedBadge =
    j.priority === 'EMERGENCY'
      ? { label: 'Emergency', tone: 'danger' }
      : j.priority === 'URGENT'
        ? { label: 'Urgent', tone: 'warning' }
        : { label: 'Job', tone: TONE_BY_TYPE.job };
  return {
    id: j.id,
    type: 'job',
    createdAt: j.createdAt,
    headline: j.issue,
    subtitle: j.address ?? `Job · ${j.status.toLowerCase().replace(/_/g, ' ')}`,
    badges: [priorityBadge, { label: j.status, tone: 'accent' }],
  };
}

function callToItem(c: CallDto): UnifiedItem {
  return {
    id: c.id,
    type: 'call',
    createdAt: c.createdAt,
    headline: c.summary?.trim() || `Call from ${c.fromPhone}`,
    subtitle: c.fromPhone,
    badges: [
      c.isEmergency
        ? { label: 'Emergency', tone: 'danger' }
        : { label: 'Call', tone: TONE_BY_TYPE.call },
    ],
  };
}

function appointmentToItem(a: AppointmentDto): UnifiedItem {
  const start = new Date(a.start);
  const startLabel = isNaN(start.getTime())
    ? a.start
    : start.toLocaleString([], {
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
      });
  return {
    id: a.id,
    type: 'appt',
    // Use `start` so appointment rows anchor to their scheduled time
    // rather than their database row creation time — feels more
    // intuitive in the timeline.
    createdAt: a.start,
    headline: a.notes?.trim() || `Appointment · ${startLabel}`,
    subtitle: startLabel,
    badges: [
      a.status === 'CANCELLED'
        ? { label: 'Cancelled', tone: 'danger' }
        : a.status === 'COMPLETED'
          ? { label: 'Completed', tone: 'success' }
          : a.status === 'NO_SHOW'
            ? { label: 'No show', tone: 'warning' }
            : { label: 'Scheduled', tone: TONE_BY_TYPE.appt },
    ],
  };
}

export async function fetchUnifiedItems(
  token: string,
  params: { q?: string; limit?: number } = {},
): Promise<UnifiedListResponse> {
  const q = params.q?.trim() || undefined;
  const cap = params.limit ?? 50;

  // Run four parallel awaits. If any one fails the whole page fails —
  // intentionally: partial data is harder to interpret than \"couldn't
  // load\" with a single retry button.
  const [customers, jobs, calls, appts] = await Promise.all([
    listCustomers(token, { q, page: 1, pageSize: cap }),
    listJobs(token, q ? { q } : {}),
    listCalls(token, { q, limit: cap }),
    listAppointments(token, { q, limit: cap }),
  ]);

  const items: UnifiedItem[] = [
    ...customers.items.map(customerToItem),
    ...jobs.items.map(jobToItem),
    ...calls.items.map(callToItem),
    ...appts.items.map(appointmentToItem),
  ];

  items.sort((a, b) => {
    const diff = b.createdAt.localeCompare(a.createdAt);
    if (diff !== 0) return diff;
    // Tie-break by id so the order is stable across renders.
    return a.id.localeCompare(b.id);
  });

  return { items, total: items.length };
}

export { timeAgoLabel };
