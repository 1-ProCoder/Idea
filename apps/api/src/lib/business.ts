import type { BusinessProfile } from '@prisma/client';
import { prisma } from '../db.js';

/**
 * Ensure a User row exists for the given Clerk user id. Idempotent.
 *
 * The Clerk `user.created` webhook normally populates this, but in dev a
 * user may hit a customer endpoint before the webhook has fired. Without
 * this row, the FK from BusinessProfile.ownerUserId → User.id would fail.
 */
export async function ensureUser(userId: string): Promise<void> {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (existing) return;

  await prisma.user.create({
    data: { id: userId },
  });
}

/**
 * Resolve the user's primary BusinessProfile.
 *
 * Looks up via Membership first (so users with shared multi-business access
 * land on the same business). If the user has no memberships yet, creates a
 * default BusinessProfile with the user as OWNER.
 */
export async function getOrCreateDefaultBusiness(
  userId: string,
): Promise<BusinessProfile> {
  const existing = await prisma.membership.findFirst({
    where: { userId },
    include: { business: true },
    orderBy: { createdAt: 'asc' },
  });
  if (existing) return existing.business;

  await ensureUser(userId);

  return prisma.businessProfile.create({
    data: {
      name: 'My Business',
      ownerUserId: userId,
      memberships: {
        create: {
          userId,
          role: 'OWNER',
        },
      },
    },
  });
}
