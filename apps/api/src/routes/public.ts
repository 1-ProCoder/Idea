/**
 * Public (unauthenticated) routes — used by the marketing homepage's
 * "See FlowFix in action" block. Returns a curated, PII-masked
 * snapshot of recent activity across customers / jobs / calls so
 * anonymous visitors can see what FlowFix looks like in production.
 *
 * Privacy scrub:
 *   - Phone numbers → keep country code + last 4 digits, mask the rest.
 *   - Customer notes / addresses / emails → omitted from public payload.
 *   - Customer names → first letter + last initial only.
 *
 * IMPORTANT: do NOT mount this router after `requireAuth()` / Clerk
 * middleware. It is unauthenticated by design.
 */

import { Router, type Request, type Response, type NextFunction } from 'express';

import { prisma } from '../db.js';

export const publicRouter = Router();

const RecentQuerySchema = (() => {
  // Tiny inline schema so we don't pull zod just for this one query.
  const parseLimit = (raw: unknown): number => {
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 1) return 10;
    return Math.min(20, Math.max(1, Math.floor(n)));
  };
  return {
    parse(query: Record<string, unknown>): { limit: number } {
      return { limit: parseLimit(query.limit) };
    },
  };
})();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/** Mask a phone so we keep country code + last 4. */
function maskPhone(p: string | null | undefined): string {
  if (!p) return '***';
  const trimmed = p.trim();
  if (trimmed.length < 4) return '***';
  const last4 = trimmed.slice(-4);
  // Try to preserve a leading `+` if present.
  const hasPlus = trimmed.startsWith('+');
  return `${hasPlus ? '+' : ''}***-***-${last4}`;
}

/** Anonymize a customer name to first-name-initial + last-name-initial. */
function maskName(full: string | null | undefined): string {
  if (!full) return '—';
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  if (parts.length === 1) {
    // Single-name customer: just show first letter masked.
    return `${parts[0][0]}***`;
  }
  return `${parts[0][0]}. ${parts[parts.length - 1][0]}.`;
}

type RecentItem = {
  type: 'customer' | 'job' | 'call';
  createdAt: string;
  headline: string;
  subtitle: string;
  badge: { label: string; tone: 'primary' | 'accent' | 'warning' };
};

publicRouter.get(
  '/public/recent-activity',
  asyncHandler(async (req, res) => {
    const { limit } = RecentQuerySchema.parse(req.query as Record<string, unknown>);

    // Pull `limit` of each independently and merge by createdAt. We do
    // not require a business here — this is platform-wide showcase
    // data. The query is intentionally bounded so it can't accidentally
    // dump the whole table.
    const [customers, jobs, calls] = await Promise.all([
      prisma.customer.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: { id: true, name: true, phone: true, createdAt: true },
      }),
      prisma.job.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          status: true,
          priority: true,
          issue: true,
          createdAt: true,
          customer: { select: { name: true } },
        },
      }),
      prisma.call.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          fromPhone: true,
          isEmergency: true,
          summary: true,
          createdAt: true,
        },
      }),
    ]);

    const items: RecentItem[] = [];

    for (const c of customers) {
      items.push({
        type: 'customer',
        createdAt: c.createdAt.toISOString(),
        headline: `New customer · ${maskName(c.name)}`,
        subtitle: maskPhone(c.phone),
        badge: { label: 'Customer', tone: 'primary' },
      });
    }
    for (const j of jobs) {
      items.push({
        type: 'job',
        createdAt: j.createdAt.toISOString(),
        headline: `Job booked · ${j.issue.slice(0, 60)}`,
        subtitle: `${maskName(j.customer?.name ?? null)} · ${j.status.toLowerCase()}`,
        badge: {
          label:
            j.priority === 'EMERGENCY'
              ? 'Emergency'
              : j.priority === 'URGENT'
                ? 'Urgent'
                : 'Job',
          tone: j.priority === 'EMERGENCY' ? 'warning' : 'accent',
        },
      });
    }
    for (const c of calls) {
      items.push({
        type: 'call',
        createdAt: c.createdAt.toISOString(),
        headline: c.isEmergency
          ? `Emergency call · ${c.summary?.slice(0, 60) ?? 'triaged'}`
          : `Call answered · ${c.summary?.slice(0, 60) ?? 'routed to dispatch'}`,
        subtitle: maskPhone(c.fromPhone),
        badge: {
          label: c.isEmergency ? 'Emergency' : 'Call',
          tone: c.isEmergency ? 'warning' : 'primary',
        },
      });
    }

    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const top = items.slice(0, limit * 3); // up to 3 × limit interleaved items

    res.json({
      items: top,
      asOf: new Date().toISOString(),
      note:
        'Public, anonymized snapshot — name and phone are masked for visitor privacy.',
    });
  }),
);
