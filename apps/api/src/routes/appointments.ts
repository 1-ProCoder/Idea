import { Router, type Request, type Response, type NextFunction } from 'express';
import { requireAuth, getAuth } from '@clerk/express';
import { z } from 'zod';

import { prisma } from '../db.js';
import { getOrCreateDefaultBusiness } from '../lib/business.js';

export const appointmentsRouter = Router();

// Appointments are 1:1 with Jobs (see schema). They are NEVER created
// directly via this route — they're created implicitly when a Job is
// created with `appointment: {...}` payload (see /api/jobs POST). This
// module exposes list / get / patch / delete so the schedule UI can
// reschedule, complete, or cancel them.

const AppointmentStatusEnum = z.enum([
  'SCHEDULED',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
]);

const AppointmentPatchSchema = z.object({
  start: z
    .string()
    .min(1)
    .transform((v) => new Date(v))
    .optional(),
  end: z
    .string()
    .min(1)
    .transform((v) => new Date(v))
    .optional(),
  status: AppointmentStatusEnum.optional(),
  notes: z.string().max(2000).optional().nullable(),
  workerId: z.string().min(1).optional(),
});

const ListQuerySchema = z.object({
  // ISO datetime range — optional upper/lower bounds, inclusive.
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  workerId: z.string().optional(),
  status: AppointmentStatusEnum.optional(),
  limit: z.coerce.number().int().min(1).max(500).default(200),
});

type Appointment = Awaited<ReturnType<typeof prisma.appointment.findFirst>>;

function toDto(a: NonNullable<Appointment>) {
  return {
    id: a.id,
    businessId: a.businessId,
    jobId: a.jobId,
    workerId: a.workerId,
    start: a.start.toISOString(),
    end: a.end.toISOString(),
    status: a.status,
    notes: a.notes,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

appointmentsRouter.get(
  '/appointments',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    const business = await getOrCreateDefaultBusiness(userId);
    const params = ListQuerySchema.parse(req.query);

    const appts = await prisma.appointment.findMany({
      where: {
        businessId: business.id,
        ...(params.from || params.to
          ? {
              start: {
                ...(params.from ? { gte: new Date(params.from) } : {}),
                ...(params.to ? { lte: new Date(params.to) } : {}),
              },
            }
          : {}),
        ...(params.workerId ? { workerId: params.workerId } : {}),
        ...(params.status ? { status: params.status } : {}),
      },
      orderBy: { start: 'asc' },
      take: params.limit,
    });

    res.json({ items: appts.map(toDto), total: appts.length });
  }),
);

appointmentsRouter.get(
  '/appointments/:id',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    const business = await getOrCreateDefaultBusiness(userId);

    const appt = await prisma.appointment.findFirst({
      where: { id: req.params.id, businessId: business.id },
    });
    if (!appt) return res.status(404).json({ error: 'not_found' });
    res.json(toDto(appt));
  }),
);

appointmentsRouter.patch(
  '/appointments/:id',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    const business = await getOrCreateDefaultBusiness(userId);
    const id = req.params.id;

    const existing = await prisma.appointment.findFirst({
      where: { id, businessId: business.id },
      select: { id: true, jobId: true },
    });
    if (!existing) return res.status(404).json({ error: 'not_found' });

    const input = AppointmentPatchSchema.parse(req.body);

    if (input.workerId) {
      const ok = await prisma.worker.count({
        where: { id: input.workerId, businessId: business.id },
      });
      if (ok === 0) return res.status(400).json({ error: 'invalid_worker' });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        ...(input.start !== undefined ? { start: input.start } : {}),
        ...(input.end !== undefined ? { end: input.end } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(input.workerId !== undefined ? { workerId: input.workerId } : {}),
      },
    });
    res.json(toDto(updated));
  }),
);

appointmentsRouter.delete(
  '/appointments/:id',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    const business = await getOrCreateDefaultBusiness(userId);
    const id = req.params.id;

    const existing = await prisma.appointment.findFirst({
      where: { id, businessId: business.id },
      select: { id: true },
    });
    if (!existing) return res.status(404).json({ error: 'not_found' });

    await prisma.appointment.delete({ where: { id } });
    res.status(204).send();
  }),
);
