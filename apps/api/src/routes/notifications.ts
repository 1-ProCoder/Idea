import { Router, type Request, type Response, type NextFunction } from 'express';
import { requireAuth, getAuth } from '@clerk/express';
import { z } from 'zod';

import { prisma } from '../db.js';
import { getOrCreateDefaultBusiness } from '../lib/business.js';

export const notificationsRouter = Router();

const ListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(15),
});

type NotificationType =
  | 'inbound_call'
  | 'emergency_call'
  | 'job_created'
  | 'job_scheduled'
  | 'job_completed'
  | 'booking_confirmed';

type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  iconKind: 'phone' | 'alert' | 'check' | 'briefcase' | 'calendar';
  colorKind: 'primary' | 'danger' | 'success' | 'warning' | 'info';
  createdAt: string;
};

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// `HH:mm` formatted in en-US 12-hour so the bell shows things like
// "James M. assigned to job at 2:30 PM" deterministically regardless of
// the Node process's CLDR settings on the server host.
function fmtTime(d: Date): string {
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

notificationsRouter.get(
  '/notifications',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    const business = await getOrCreateDefaultBusiness(userId);
    const { limit } = ListQuerySchema.parse(req.query);

    // Overshoot: pull 2x the requested limit per source so the global
    // reverse-chronological merge has enough rows from each kind to
    // produce a meaningful top-N. Capped at 40 to keep round-trips cheap.
    const perKind = Math.min(limit * 2, 40);

    const [recentCalls, recentJobs, recentAppointments] = await Promise.all([
      prisma.call.findMany({
        where: { businessId: business.id },
        orderBy: { createdAt: 'desc' },
        take: perKind,
        include: { customer: { select: { name: true } } },
      }),
      prisma.job.findMany({
        where: { businessId: business.id },
        orderBy: { createdAt: 'desc' },
        take: perKind,
        include: {
          customer: { select: { name: true } },
          worker: { select: { name: true } },
        },
      }),
      prisma.appointment.findMany({
        where: { businessId: business.id },
        orderBy: { createdAt: 'desc' },
        take: perKind,
        include: {
          job: {
            select: {
              issue: true,
              customer: { select: { name: true } },
            },
          },
          worker: { select: { name: true } },
        },
      }),
    ]);

    const items: NotificationItem[] = [];

    for (const c of recentCalls) {
      const who = c.customer?.name ?? c.fromPhone;
      const isEmerg = c.isEmergency === true;
      items.push({
        id: `call_${c.id}`,
        type: isEmerg ? 'emergency_call' : 'inbound_call',
        title: isEmerg ? 'New emergency call' : 'New incoming call',
        body: c.summary ? `${who} \u2014 ${c.summary}` : who,
        iconKind: isEmerg ? 'alert' : 'phone',
        colorKind: isEmerg ? 'danger' : 'primary',
        createdAt: c.createdAt.toISOString(),
      });
    }

    for (const j of recentJobs) {
      const customer = j.customer.name;
      const worker = j.worker?.name ?? null;
      const truncIssue =
        j.issue.length > 80 ? `${j.issue.slice(0, 77)}\u2026` : j.issue;

      if (j.status === 'COMPLETED') {
        items.push({
          id: `job_${j.id}`,
          type: 'job_completed',
          title: 'Job completed',
          body: worker
            ? `${customer} \u2014 closed by ${worker}`
            : `${customer} \u2014 closed`,
          iconKind: 'check',
          colorKind: 'success',
          createdAt: j.updatedAt.toISOString(),
        });
        continue;
      }

      if (j.status === 'SCHEDULED') {
        items.push({
          id: `job_${j.id}`,
          type: 'job_scheduled',
          title: 'Job scheduled',
          body: worker
            ? `${customer} \u2014 ${truncIssue} (${worker})`
            : `${customer} \u2014 ${truncIssue}`,
          iconKind: 'briefcase',
          colorKind: 'primary',
          createdAt: j.updatedAt.toISOString(),
        });
        continue;
      }

      if (j.priority === 'EMERGENCY') {
        items.push({
          id: `job_${j.id}`,
          type: 'emergency_call',
          title: 'Emergency job created',
          body: `${customer} \u2014 ${truncIssue}`,
          iconKind: 'alert',
          colorKind: 'danger',
          createdAt: j.createdAt.toISOString(),
        });
        continue;
      }

      items.push({
        id: `job_${j.id}`,
        type: 'job_created',
        title: 'New job created',
        body: worker
          ? `${customer} \u2014 ${truncIssue} (assigned to ${worker})`
          : `${customer} \u2014 ${truncIssue}`,
        iconKind: 'briefcase',
        colorKind: 'primary',
        createdAt: j.createdAt.toISOString(),
      });
    }

    for (const a of recentAppointments) {
      const customer = a.job.customer.name;
      const worker = a.worker.name;
      const when = fmtTime(a.start);
      items.push({
        id: `appt_${a.id}`,
        type: 'booking_confirmed',
        title: 'Booking confirmed',
        body: `${worker} assigned to ${customer} at ${when}`,
        iconKind: 'calendar',
        colorKind: 'success',
        createdAt: a.createdAt.toISOString(),
      });
    }

    // Global reverse-chronological merge. ISO strings sort correctly
    // with plain `localeCompare` (no Date parsing needed).
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    items.length = Math.min(items.length, limit);

    res.json({
      items,
      asOf: new Date().toISOString(),
    });
  }),
);

// Note: a future `/api/notifications/read` or `/api/notifications/dismiss`
// endpoint will land once we add a "Mark all read" affordance to the bell.
// Not stubbing it now — empty endpoints accumulate as dead code.
