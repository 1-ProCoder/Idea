import { Router, type Request, type Response, type NextFunction } from 'express';
import { requireAuth, getAuth } from '@clerk/express';

import { prisma } from '../db.js';
import { getOrCreateDefaultBusiness } from '../lib/business.js';

export const dashboardRouter = Router();

// Single aggregated payload for the Dashboard page. Avoids a 5-query
// waterfall from the frontend (calls stats, jobs stats, appt stats, tech
// stats, recent-activity). Single round-trip, all counts + top-N lists.
dashboardRouter.get(
  '/dashboard/stats',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    const business = await getOrCreateDefaultBusiness(userId);

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const [
      totalCustomers,
      jobs,
      activeWorkers,
      callsLast7,
      recentJobsList,
      todayAppointments,
    ] = await Promise.all([
      prisma.customer.count({ where: { businessId: business.id } }),
      prisma.job.findMany({
        where: { businessId: business.id },
        select: {
          status: true,
          priority: true,
          createdAt: true,
        },
      }),
      prisma.worker.count({
        where: { businessId: business.id, active: true },
      }),
      prisma.call.findMany({
        where: {
          businessId: business.id,
          createdAt: { gte: sevenDaysAgo },
        },
        select: { createdAt: true, isEmergency: true, duration: true },
      }),
      prisma.job.findMany({
        where: { businessId: business.id },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: {
          customer: { select: { id: true, name: true } },
          worker: { select: { id: true, name: true } },
        },
      }),
      prisma.appointment.findMany({
        where: {
          businessId: business.id,
          start: { gte: startOfDay },
        },
        orderBy: { start: 'asc' },
        take: 8,
        include: {
          job: {
            select: {
              id: true,
              issue: true,
              priority: true,
              customer: { select: { id: true, name: true } },
            },
          },
          worker: { select: { id: true, name: true } },
        },
      }),
    ]);

    const jobsToday = jobs.filter(
      (j) => j.createdAt >= startOfDay,
    ).length;
    const emergencyJobs = jobs.filter(
      (j) => j.priority === 'EMERGENCY' && j.status !== 'COMPLETED',
    ).length;
    const jobsCompleted = jobs.filter((j) => j.status === 'COMPLETED').length;
    const completionRate =
      jobs.length === 0 ? 0 : Math.round((jobsCompleted / jobs.length) * 100);

    // 7-day call sparkline (oldest → newest).
    const buckets = new Array(7).fill(0) as number[];
    for (const c of callsLast7) {
      const daysAgo = Math.floor(
        (now.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60 * 24),
      );
      const idx = 6 - daysAgo;
      if (idx >= 0 && idx < 7) buckets[idx] += 1;
    }

    res.json({
      totals: {
        customers: totalCustomers,
        activeTechnicians: activeWorkers,
        jobsToday,
        emergencyJobs,
        completionRate,
        totalCalls: callsLast7.length,
      },
      sparklines: {
        calls: buckets,
      },
      recentJobs: recentJobsList.map((j) => ({
        id: j.id,
        issue: j.issue,
        status: j.status,
        priority: j.priority,
        customerId: j.customer.id,
        customerName: j.customer.name,
        workerId: j.worker?.id ?? null,
        workerName: j.worker?.name ?? null,
        updatedAt: j.updatedAt.toISOString(),
      })),
      todayAppointments: todayAppointments.map((a) => ({
        id: a.id,
        jobId: a.job.id,
        issue: a.job.issue,
        priority: a.job.priority,
        customerId: a.job.customer.id,
        customerName: a.job.customer.name,
        workerId: a.worker.id,
        workerName: a.worker.name,
        start: a.start.toISOString(),
        end: a.end.toISOString(),
        status: a.status,
      })),
      asOf: now.toISOString(),
    });
  }),
);

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
