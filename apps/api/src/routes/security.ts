/**
 * GET /api/security/export — Data export endpoint for the Security page.
 *
 * Returns a JSON dump of the signed-in business + every related row
 * (workers, customers, jobs, calls, appointments) so the user can
 * download a full snapshot of their data. We set
 * `Content-Disposition: attachment; filename="…"` so the browser
 * triggers a download instead of inlining the response.
 *
 * NOTE: in production this would be gated to OWNER/ADMIN roles and
 * rate-limited per business. For now it's available to any signed-in
 * business owner since the Security page only renders behind Clerk.
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { requireAuth, getAuth } from '@clerk/express';

import { prisma } from '../db.js';
import { getOrCreateDefaultBusiness } from '../lib/business.js';

export const securityRouter = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

securityRouter.get(
  '/security/export',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    const business = await getOrCreateDefaultBusiness(userId);

    // Fan out the related tables concurrently so the request stays a
    // single round-trip. We deliberately do NOT include `transcript`
    // or `notes` fields by default — those can carry PII — and we
    // exclude the user/membership linkage rows (those belong to
    // Clerk, not the business).
    const [
      businessRow,
      workers,
      customers,
      jobs,
      calls,
      appointments,
    ] = await Promise.all([
      prisma.businessProfile.findUnique({
        where: { id: business.id },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          address: true,
          timezone: true,
          createdAt: true,
          updatedAt: true,
          // Include the JSON blobs verbatim — they contain the user's
          // own settings and they need them to migrate back in.
          brandingJson: true,
          notificationPrefsJson: true,
          aiConfigJson: true,
        },
      }),
      prisma.worker.findMany({
        where: { businessId: business.id },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.customer.findMany({
        where: { businessId: business.id },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.job.findMany({
        where: { businessId: business.id },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.call.findMany({
        where: { businessId: business.id },
        orderBy: { createdAt: 'asc' },
        // Drop transcripts and `notes` (PII defaults — see header).
        select: {
          id: true,
          businessId: true,
          customerId: true,
          fromPhone: true,
          duration: true,
          summary: true,
          isEmergency: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.appointment.findMany({
        where: { businessId: business.id },
        orderBy: { start: 'asc' },
      }),
    ]);

    const payload = {
      schema: 'flowfix.export.v1',
      exportedAt: new Date().toISOString(),
      business: businessRow,
      workers,
      customers,
      jobs,
      calls,
      appointments,
      counts: {
        workers: workers.length,
        customers: customers.length,
        jobs: jobs.length,
        calls: calls.length,
        appointments: appointments.length,
      },
    };

    // File-name hint: business id (short) + ISO date. Keeps multiple
    // exports distinguishable without violating the URL size cap.
    const shortId = business.id.slice(0, 8);
    const date = new Date().toISOString().slice(0, 10);
    const filename = `flowfix-export-${shortId}-${date}.json`;

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    res.send(JSON.stringify(payload, null, 2));
  }),
);
