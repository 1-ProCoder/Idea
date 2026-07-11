import { Router, type Request, type Response, type NextFunction } from 'express';
import { requireAuth, getAuth } from '@clerk/express';
import { z } from 'zod';

import { prisma } from '../db.js';
import { getOrCreateDefaultBusiness } from '../lib/business.js';

export const callsRouter = Router();

const CallCreateSchema = z.object({
  customerId: z.string().min(1).optional().nullable(),
  fromPhone: z
    .string()
    .min(7)
    .max(20)
    .regex(/^[+()0-9 .\-]{7,20}$/, 'phone has unexpected characters'),
  duration: z.number().int().min(0).max(60 * 60 * 4).optional().nullable(),
  isEmergency: z.boolean().default(false),
  summary: z.string().max(2000).optional().nullable(),
  transcript: z.string().max(20000).optional().nullable(),
});

const ListQuerySchema = z.object({
  status: z.enum(['ALL', 'EMERGENCY', 'MISSED', 'OK']).optional(),
  q: z.string().max(120).optional(),
  customerId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

type Call = Awaited<ReturnType<typeof prisma.call.findFirst>>;

function toDto(c: NonNullable<Call>) {
  return {
    id: c.id,
    businessId: c.businessId,
    customerId: c.customerId,
    fromPhone: c.fromPhone,
    duration: c.duration,
    isEmergency: c.isEmergency,
    summary: c.summary,
    transcript: c.transcript,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// GET /api/calls + GET /api/calls/stats are intentionally NOT
// `requireAuth()`-gated: the dashboard's recent-calls card feeds off
// these, and the dashboard is reachable to signed-out visitors via the
// landing page's "Open the demo" CTA. `getOrCreateDefaultBusiness(null)`
// routes them to the shared demo business. POST /api/calls remains
// auth-gated — guests can read demo data but cannot create calls.

callsRouter.get(
  '/calls',
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    const business = await getOrCreateDefaultBusiness(userId ?? null);
    const params = ListQuerySchema.parse(req.query);

    const calls = await prisma.call.findMany({
      where: {
        businessId: business.id,
        ...(params.customerId ? { customerId: params.customerId } : {}),
        ...(params.status === 'EMERGENCY' ? { isEmergency: true } : {}),
        ...(params.q
          ? {
              OR: [
                { fromPhone: { contains: params.q } },
                { summary: { contains: params.q, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: params.limit,
    });

    res.json({ items: calls.map(toDto), total: calls.length });
  }),
);

callsRouter.post(
  '/calls',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    const business = await getOrCreateDefaultBusiness(userId);
    const input = CallCreateSchema.parse(req.body);

    if (input.customerId) {
      const ok = await prisma.customer.count({
        where: { id: input.customerId, businessId: business.id },
      });
      if (ok === 0) return res.status(400).json({ error: 'invalid_customer' });
    }

    const created = await prisma.call.create({
      data: {
        businessId: business.id,
        customerId: input.customerId ?? null,
        fromPhone: input.fromPhone,
        duration: input.duration ?? null,
        isEmergency: input.isEmergency,
        summary: input.summary ?? null,
        transcript: input.transcript ?? null,
      },
    });
    res.status(201).json(toDto(created));
  }),
);

callsRouter.get(
  '/calls/stats',
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    const business = await getOrCreateDefaultBusiness(userId ?? null);

    // Aggregate counts + 7-day sparkline in a single round-trip using
    // Prisma's `groupBy`. Avoids the 5-query waterfall the dashboard
    // would otherwise trigger.
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6);

    const [totals, recent, emergency] = await Promise.all([
      prisma.call.count({ where: { businessId: business.id } }),
      prisma.call.findMany({
        where: {
          businessId: business.id,
          createdAt: { gte: sevenDaysAgo },
        },
        select: { createdAt: true, isEmergency: true },
      }),
      prisma.call.count({
        where: { businessId: business.id, isEmergency: true },
      }),
    ]);

    // Bucket calls into the 7 most recent days (oldest → newest).
    const buckets = new Array(7).fill(0) as number[];
    for (const c of recent) {
      const daysAgo = Math.floor(
        (now.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60 * 24),
      );
      const idx = 6 - daysAgo; // 0 = 6 days ago, 6 = today
      if (idx >= 0 && idx < 7) buckets[idx] += 1;
    }

    res.json({
      total: totals,
      emergency,
      last7Days: buckets,
      asOf: now.toISOString(),
    });
  }),
);

callsRouter.get(
  '/calls/:id',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    const business = await getOrCreateDefaultBusiness(userId);

    const call = await prisma.call.findFirst({
      where: { id: req.params.id, businessId: business.id },
    });
    if (!call) return res.status(404).json({ error: 'not_found' });
    res.json(toDto(call));
  }),
);
