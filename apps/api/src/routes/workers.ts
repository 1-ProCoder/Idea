import { Router, type Request, type Response, type NextFunction } from 'express';
import { requireAuth, getAuth } from '@clerk/express';
import { z } from 'zod';

import { prisma } from '../db.js';
import { getOrCreateDefaultBusiness } from '../lib/business.js';

export const workersRouter = Router();

const WorkerRoleEnum = z.enum(['OWNER', 'ADMIN', 'DISPATCHER', 'TECHNICIAN']);

const WorkerCreateSchema = z.object({
  name: z.string().min(1).max(120),
  role: WorkerRoleEnum.default('TECHNICIAN'),
  phone: z
    .string()
    .max(20)
    .regex(/^[+()0-9 .\-]{7,20}$/, 'phone has unexpected characters')
    .optional()
    .nullable(),
  email: z.string().email().max(120).optional().nullable(),
  active: z.boolean().default(true),
});

const WorkerUpdateSchema = WorkerCreateSchema.partial();

const ListQuerySchema = z.object({
  q: z.string().max(120).optional(),
  active: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  role: WorkerRoleEnum.optional(),
});

type Worker = Awaited<ReturnType<typeof prisma.worker.findFirst>>;

function toDto(w: NonNullable<Worker>) {
  return {
    id: w.id,
    businessId: w.businessId,
    name: w.name,
    role: w.role,
    phone: w.phone,
    email: w.email,
    active: w.active,
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
  };
}

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

workersRouter.get(
  '/workers',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    const business = await getOrCreateDefaultBusiness(userId);
    const params = ListQuerySchema.parse(req.query);

    const workers = await prisma.worker.findMany({
      where: {
        businessId: business.id,
        ...(params.active !== undefined ? { active: params.active } : {}),
        ...(params.role ? { role: params.role } : {}),
        ...(params.q
          ? {
              OR: [
                { name: { contains: params.q, mode: 'insensitive' as const } },
                { phone: { contains: params.q } },
                { email: { contains: params.q, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      orderBy: { name: 'asc' },
    });

    res.json({ items: workers.map(toDto), total: workers.length });
  }),
);

workersRouter.post(
  '/workers',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    const business = await getOrCreateDefaultBusiness(userId);
    const input = WorkerCreateSchema.parse(req.body);

    const worker = await prisma.worker.create({
      data: {
        businessId: business.id,
        name: input.name,
        role: input.role,
        phone: input.phone ?? null,
        email: input.email ?? null,
        active: input.active,
      },
    });
    res.status(201).json(toDto(worker));
  }),
);

workersRouter.get(
  '/workers/:id',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    const business = await getOrCreateDefaultBusiness(userId);

    const worker = await prisma.worker.findFirst({
      where: { id: req.params.id, businessId: business.id },
    });
    if (!worker) return res.status(404).json({ error: 'not_found' });
    res.json(toDto(worker));
  }),
);

workersRouter.patch(
  '/workers/:id',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    const business = await getOrCreateDefaultBusiness(userId);
    const id = req.params.id;

    const existing = await prisma.worker.findFirst({
      where: { id, businessId: business.id },
      select: { id: true },
    });
    if (!existing) return res.status(404).json({ error: 'not_found' });

    const input = WorkerUpdateSchema.parse(req.body);

    const worker = await prisma.worker.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.role !== undefined ? { role: input.role } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
      },
    });
    res.json(toDto(worker));
  }),
);

workersRouter.delete(
  '/workers/:id',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    const business = await getOrCreateDefaultBusiness(userId);
    const id = req.params.id;

    const existing = await prisma.worker.findFirst({
      where: { id, businessId: business.id },
      select: { id: true },
    });
    if (!existing) return res.status(404).json({ error: 'not_found' });

    // Soft-delete: deactivate rather than destroy, because jobs/appointments
    // may reference this worker and historical data is valuable.
    await prisma.worker.update({ where: { id }, data: { active: false } });
    res.status(204).send();
  }),
);
