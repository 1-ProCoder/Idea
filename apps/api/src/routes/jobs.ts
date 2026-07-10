import { Router, type Request, type Response, type NextFunction } from 'express';
import { requireAuth, getAuth } from '@clerk/express';
import { z } from 'zod';

import { prisma } from '../db.js';
import { getOrCreateDefaultBusiness } from '../lib/business.js';

export const jobsRouter = Router();

const JobStatusEnum = z.enum([
  'PENDING',
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
]);
const JobPriorityEnum = z.enum(['NORMAL', 'URGENT', 'EMERGENCY']);

// ISO datetime round-trip helpers. Dates from the client must be ISO strings.
const IsoDate = z
  .string()
  .datetime({ message: 'must be ISO 8601 datetime' })
  .or(z.string().min(1)); // accept freeform, validate below

const AppointmentCreateSchema = z
  .object({
    workerId: z.string().min(1),
    start: IsoDate,
    end: IsoDate,
    notes: z.string().max(2000).optional().nullable(),
  })
  .optional()
  .nullable();

const JobCreateSchema = z.object({
  customerId: z.string().min(1),
  workerId: z.string().min(1).optional().nullable(),
  issue: z.string().min(1).max(500),
  address: z.string().max(255).optional().nullable(),
  status: JobStatusEnum.default('PENDING'),
  priority: JobPriorityEnum.default('NORMAL'),
  notes: z.string().max(2000).optional().nullable(),
  appointment: AppointmentCreateSchema,
});

const JobUpdateSchema = z.object({
  workerId: z.string().min(1).optional().nullable(),
  issue: z.string().min(1).max(500).optional(),
  address: z.string().max(255).optional().nullable(),
  status: JobStatusEnum.optional(),
  priority: JobPriorityEnum.optional(),
  notes: z.string().max(2000).optional().nullable(),
});

const ListQuerySchema = z.object({
  status: JobStatusEnum.optional(),
  priority: JobPriorityEnum.optional(),
  workerId: z.string().optional(),
  customerId: z.string().optional(),
  q: z.string().max(120).optional(),
});

type Job = Awaited<ReturnType<typeof prisma.job.findFirst>>;

function toDto(j: NonNullable<Job>) {
  return {
    id: j.id,
    businessId: j.businessId,
    customerId: j.customerId,
    workerId: j.workerId,
    issue: j.issue,
    address: j.address,
    status: j.status,
    priority: j.priority,
    notes: j.notes,
    createdAt: j.createdAt.toISOString(),
    updatedAt: j.updatedAt.toISOString(),
  };
}

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// ─── Read endpoints ────────────────────────────────────────────────────────

jobsRouter.get(
  '/jobs',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    const business = await getOrCreateDefaultBusiness(userId);
    const params = ListQuerySchema.parse(req.query);

    const jobs = await prisma.job.findMany({
      where: {
        businessId: business.id,
        ...(params.status ? { status: params.status } : {}),
        ...(params.priority ? { priority: params.priority } : {}),
        ...(params.workerId ? { workerId: params.workerId } : {}),
        ...(params.customerId ? { customerId: params.customerId } : {}),
        ...(params.q
          ? { issue: { contains: params.q, mode: 'insensitive' as const } }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ items: jobs.map(toDto), total: jobs.length });
  }),
);

jobsRouter.get(
  '/jobs/:id',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    const business = await getOrCreateDefaultBusiness(userId);

    const job = await prisma.job.findFirst({
      where: { id: req.params.id, businessId: business.id },
    });
    if (!job) return res.status(404).json({ error: 'not_found' });
    res.json(toDto(job));
  }),
);

// ─── Create + Update ───────────────────────────────────────────────────────

jobsRouter.post(
  '/jobs',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    const business = await getOrCreateDefaultBusiness(userId);
    const input = JobCreateSchema.parse(req.body);

    // Verify customer belongs to this business before creating a job.
    const customer = await prisma.customer.findFirst({
      where: { id: input.customerId, businessId: business.id },
      select: { id: true },
    });
    if (!customer) return res.status(400).json({ error: 'invalid_customer' });

    // Verify worker(s) belong to this business.
    // Dedup with `Set` so an identical job-level + appointment-level
    // workerId doesn't cause a count mismatch (e.g. client posts
    // `{ workerId: X, appointment: { workerId: X } }`).
    const workerIds = Array.from(
      new Set([input.workerId, input.appointment?.workerId]),
    ).filter((x): x is string => Boolean(x));

    if (workerIds.length > 0) {
      const ok = await prisma.worker.count({
        where: { id: { in: workerIds }, businessId: business.id },
      });
      if (ok !== workerIds.length) {
        return res.status(400).json({ error: 'invalid_worker' });
      }
    }

    // Appointment is 1:1 with Job (jobId String @unique). Use Prisma
    // nested-create: Job + Appointment in one DB round-trip, atomic and
    // safe under concurrent writes.
    const aptInput = input.appointment;
    const job = await prisma.job.create({
      data: {
        businessId: business.id,
        customerId: input.customerId,
        workerId: input.workerId ?? aptInput?.workerId ?? null,
        issue: input.issue,
        address: input.address ?? null,
        status: input.status,
        priority: input.priority,
        notes: input.notes ?? null,
        ...(aptInput
          ? {
              appointment: {
                create: {
                  businessId: business.id,
                  workerId: aptInput.workerId,
                  start: new Date(aptInput.start),
                  end: new Date(aptInput.end),
                  notes: aptInput.notes ?? null,
                  status: 'SCHEDULED',
                },
              },
            }
          : {}),
      },
    });

    res.status(201).json(toDto(job));
  }),
);

jobsRouter.patch(
  '/jobs/:id',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    const business = await getOrCreateDefaultBusiness(userId);
    const id = req.params.id;

    const existing = await prisma.job.findFirst({
      where: { id, businessId: business.id },
      select: { id: true },
    });
    if (!existing) return res.status(404).json({ error: 'not_found' });

    const input = JobUpdateSchema.parse(req.body);

    if (input.workerId) {
      const ok = await prisma.worker.count({
        where: { id: input.workerId, businessId: business.id },
      });
      if (ok === 0) return res.status(400).json({ error: 'invalid_worker' });
    }

    const job = await prisma.job.update({
      where: { id },
      data: {
        ...(input.workerId !== undefined ? { workerId: input.workerId } : {}),
        ...(input.issue !== undefined ? { issue: input.issue } : {}),
        ...(input.address !== undefined ? { address: input.address } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
    });
    res.json(toDto(job));
  }),
);

jobsRouter.delete(
  '/jobs/:id',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    const business = await getOrCreateDefaultBusiness(userId);
    const id = req.params.id;

    const existing = await prisma.job.findFirst({
      where: { id, businessId: business.id },
      select: { id: true },
    });
    if (!existing) return res.status(404).json({ error: 'not_found' });

    // Cascade will drop the linked Appointment via schema onDelete: Cascade.
    await prisma.job.delete({ where: { id } });
    res.status(204).send();
  }),
);
