/**
 * GET /api/usage — single-shot usage aggregation for the Billing page.
 *
 * Counts the signed-in business's row counts across Customers, Jobs,
 * Calls, and Appointments, all in one parallel batch. Used to power the
 * "Current usage" cards under the Billing settings panel so the user
 * sees real numbers (not a hardcoded quote) — even on the FREE plan
 * with zero rows, every count returns 0.
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { requireAuth, getAuth } from '@clerk/express';

import { prisma } from '../db.js';
import { getOrCreateDefaultBusiness } from '../lib/business.js';

export const usageRouter = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// GET /api/usage is intentionally NOT `requireAuth()`-gated: the
// demo /settings/billing page renders the demo business's usage for
// signed-out visitors so they can see real numbers (not a hardcoded
// quote) on the Billing page.

usageRouter.get(
  '/usage',
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    const business = await getOrCreateDefaultBusiness(userId ?? null);

    // Start-of-today in the business's timezone, fall back to UTC.
    const tz = business.timezone || 'UTC';
    const now = new Date();
    const startOfTodayIso = new Date(
      now.toLocaleString('en-US', { timeZone: tz }),
    );
    startOfTodayIso.setHours(0, 0, 0, 0);

    // Parallel fan-out so this stays a single round-trip from the
    // dashboard's perspective. Each `count` is its own indexed query;
    // Postgres handles them concurrently.
    const [
      customers,
      jobsTotal,
      jobsPending,
      jobsScheduled,
      jobsCompleted,
      jobsEmergency,
      callsTotal,
      callsEmergency,
      apptsTotal,
      apptsToday,
    ] = await Promise.all([
      prisma.customer.count({ where: { businessId: business.id } }),
      prisma.job.count({ where: { businessId: business.id } }),
      prisma.job.count({
        where: { businessId: business.id, status: 'PENDING' },
      }),
      prisma.job.count({
        where: { businessId: business.id, status: 'SCHEDULED' },
      }),
      prisma.job.count({
        where: { businessId: business.id, status: 'COMPLETED' },
      }),
      prisma.job.count({
        where: { businessId: business.id, priority: 'EMERGENCY' },
      }),
      prisma.call.count({ where: { businessId: business.id } }),
      prisma.call.count({
        where: { businessId: business.id, isEmergency: true },
      }),
      prisma.appointment.count({ where: { businessId: business.id } }),
      prisma.appointment.count({
        where: {
          businessId: business.id,
          start: { gte: startOfTodayIso },
        },
      }),
    ]);

    res.json({
      customers,
      jobs: {
        total: jobsTotal,
        pending: jobsPending,
        scheduled: jobsScheduled,
        completed: jobsCompleted,
        emergency: jobsEmergency,
      },
      calls: {
        total: callsTotal,
        emergency: callsEmergency,
      },
      appointments: {
        total: apptsTotal,
        today: apptsToday,
      },
      asOf: now.toISOString(),
    });
  }),
);
