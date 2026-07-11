import { Router, type Request, type Response, type NextFunction } from 'express';
import { requireAuth, getAuth } from '@clerk/express';
import { z } from 'zod';
import { Prisma, type Customer } from '@prisma/client';

import { prisma } from '../db.js';
import { getOrCreateDefaultBusiness } from '../lib/business.js';

export const customersRouter = Router();

const PhoneRegex = /^[+()0-9 .\-]{7,20}$/;

const CustomerCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  phone: z
    .string()
    .min(7)
    .max(20)
    .refine((v) => PhoneRegex.test(v), 'phone has unexpected characters'),
  email: z.string().email('Not a valid email').max(120).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

const CustomerUpdateSchema = CustomerCreateSchema.partial();

const ListQuerySchema = z.object({
  q: z.string().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

function toDto(c: Customer) {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    address: c.address,
    notes: c.notes,
    businessId: c.businessId,
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

customersRouter.get(
  '/customers',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    const business = await getOrCreateDefaultBusiness(userId);
    const params = ListQuerySchema.parse(req.query);

    const where: Prisma.CustomerWhereInput = {
      businessId: business.id,
      ...(params.q
        ? {
            OR: [
              { name: { contains: params.q, mode: 'insensitive' } },
              { phone: { contains: params.q } },
              { email: { contains: params.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        orderBy: [{ name: 'asc' }, { createdAt: 'desc' }],
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
    ]);

    res.json({
      items: items.map(toDto),
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
    });
  }),
);

customersRouter.post(
  '/customers',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    const business = await getOrCreateDefaultBusiness(userId);
    const input = CustomerCreateSchema.parse(req.body);

    try {
      const created = await prisma.customer.create({
        data: {
          name: input.name,
          phone: input.phone,
          email: input.email ?? null,
          address: input.address ?? null,
          notes: input.notes ?? null,
          businessId: business.id,
        },
      });
      return res.status(201).json(toDto(created));
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        return res.status(409).json({
          error: 'duplicate_customer',
          message: 'A customer with this phone already exists for your business.',
        });
      }
      throw err;
    }
  }),
);

customersRouter.get(
  '/customers/:id',
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    const business = await getOrCreateDefaultBusiness(userId ?? null);

    const customer = await prisma.customer.findFirst({
      where: { id: req.params.id, businessId: business.id },
    });
    if (!customer) {
      return res.status(404).json({ error: 'not_found' });
    }
    return res.json(toDto(customer));
  }),
);

customersRouter.patch(
  '/customers/:id',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    const business = await getOrCreateDefaultBusiness(userId);
    const id = req.params.id;

    const existing = await prisma.customer.findFirst({
      where: { id, businessId: business.id },
      select: { id: true },
    });
    if (!existing) {
      return res.status(404).json({ error: 'not_found' });
    }

    const input = CustomerUpdateSchema.parse(req.body);
    if (Object.keys(input).length === 0) {
      const cur = await prisma.customer.findUnique({ where: { id } });
      return res.json(toDto(cur!));
    }

    try {
      const updated = await prisma.customer.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.phone !== undefined ? { phone: input.phone } : {}),
          ...(input.email !== undefined ? { email: input.email } : {}),
          ...(input.address !== undefined ? { address: input.address } : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
        },
      });
      return res.json(toDto(updated));
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        return res.status(409).json({
          error: 'duplicate_customer',
          message: 'A customer with this phone already exists for your business.',
        });
      }
      throw err;
    }
  }),
);

customersRouter.delete(
  '/customers/:id',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    const business = await getOrCreateDefaultBusiness(userId);
    const id = req.params.id;

    const existing = await prisma.customer.findFirst({
      where: { id, businessId: business.id },
      select: { id: true },
    });
    if (!existing) {
      return res.status(404).json({ error: 'not_found' });
    }

    await prisma.customer.delete({ where: { id } });
    return res.status(204).send();
  }),
);
