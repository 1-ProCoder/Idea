import { Router, type Request, type Response, type NextFunction } from 'express';
import { requireAuth, getAuth } from '@clerk/express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

import { prisma } from '../db.js';
import { getOrCreateDefaultBusiness } from '../lib/business.js';

// GET /api/business is intentionally NOT `requireAuth()`-gated: signed-out
// visitors hitting the landing page's "Open the demo" CTA land on
// /dashboard, which fetches /api/business for the shared demo profile.
// PATCH remains auth-gated — guests can read the demo's identity, name,
// and timezone, but cannot mutate it.

export const businessRouter = Router();

// PATCH accepts any subset of these top-level fields + the optional
// JSON settings blobs (each is replaced as a whole on update).
const BusinessPatchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  phone: z.string().max(20).nullable().optional(),
  email: z.string().email().max(120).nullable().optional(),
  address: z.string().max(255).nullable().optional(),
  timezone: z.string().max(64).optional(),
  branding: z.record(z.unknown()).optional(),
  notificationPrefs: z.record(z.unknown()).optional(),
  aiConfig: z.record(z.unknown()).optional(),
});

type BusinessProfile = Awaited<
  ReturnType<typeof prisma.businessProfile.findFirst>
>;

function toDto(b: NonNullable<BusinessProfile>) {
  return {
    id: b.id,
    name: b.name,
    phone: b.phone,
    email: b.email,
    address: b.address,
    timezone: b.timezone,
    branding: b.brandingJson ?? {},
    notificationPrefs: b.notificationPrefsJson ?? {},
    aiConfig: b.aiConfigJson ?? {},
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  };
}

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

businessRouter.get(
  '/business',
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    const business = await getOrCreateDefaultBusiness(userId ?? null);
    res.json(toDto(business));
  }),
);

businessRouter.patch(
  '/business',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    const business = await getOrCreateDefaultBusiness(userId);
    const input = BusinessPatchSchema.parse(req.body);

    const updated = await prisma.businessProfile.update({
      where: { id: business.id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.address !== undefined ? { address: input.address } : {}),
        ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
        ...(input.branding !== undefined
          ? { brandingJson: input.branding as Prisma.InputJsonValue }
          : {}),
        ...(input.notificationPrefs !== undefined
          ? { notificationPrefsJson: input.notificationPrefs as Prisma.InputJsonValue }
          : {}),
        ...(input.aiConfig !== undefined
          ? { aiConfigJson: input.aiConfig as Prisma.InputJsonValue }
          : {}),
      },
    });
    res.json(toDto(updated));
  }),
);
