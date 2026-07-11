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
 * Sentinel name for the shared demo business that anonymous (signed-out)
 * visitors browse. If you want a different label on the demo, change it
 * here — the lookup is by `name`, not by id.
 */
const DEMO_BUSINESS_NAME = 'FlowFix Demo';

/**
 * Synthetic Clerk user id used to satisfy the
 * BusinessProfile.ownerUserId → User.id FK when the database is empty
 * and we have to create a fresh demo business from scratch. We upsert
 * the User row idempotently so the demo is reproducible on a fresh DB.
 */
const DEMO_SYNTHETIC_USER_ID = 'user_flowfix_demo_singleton';

/**
 * Resolve the shared demo business for anonymous (signed-out) visitors.
 *
 * Lookup order:
 *   1. A business whose `name === DEMO_BUSINESS_NAME` (explicitly seeded
 *      by the operator as the demo).
 *   2. The first business in the DB (oldest by `createdAt`). This is the
 *      business the operator has been actively using, so it already has
 *      realistic seed data — no need to populate a separate one.
 *   3. If the DB is completely empty, create the demo business under a
 *      synthetic user so the schema is satisfied.
 *
 * Always returns a real `BusinessProfile` row, never null.
 */
export async function getDemoBusiness(): Promise<BusinessProfile> {
  const named = await prisma.businessProfile.findFirst({
    where: { name: DEMO_BUSINESS_NAME },
  });
  if (named) return named;

  const first = await prisma.businessProfile.findFirst({
    orderBy: { createdAt: 'asc' },
  });
  if (first) {
    // Throttled: a hot demo session hits this code path on every
    // request. Warn once per process so the operator sees the message
    // at the top of the dev log, not 100×/second.
    if (!demoFallbackWarned.has(first.id)) {
      demoFallbackWarned.add(first.id);
      console.warn(
        `[demo] no business named "${DEMO_BUSINESS_NAME}" found — falling back to oldest business "${first.name}" (id=${first.id}). Anonymous visitors will see this business's data.`,
      );
    }
    return first;
  }

  if (!syntheticDemoWarned) {
    syntheticDemoWarned = true;
    console.warn(
      `[demo] database has no businesses; creating synthetic demo business under synthetic user "${DEMO_SYNTHETIC_USER_ID}". Sign in and create a real business to start saving data.`,
    );
  }
  await prisma.user.upsert({
    where: { id: DEMO_SYNTHETIC_USER_ID },
    create: {
      id: DEMO_SYNTHETIC_USER_ID,
      email: 'demo@flowfix.local',
    },
    update: {},
  });
  return prisma.businessProfile.create({
    data: {
      name: DEMO_BUSINESS_NAME,
      ownerUserId: DEMO_SYNTHETIC_USER_ID,
    },
  });
}

/**
 * Per-process throttle for the demo-fallback warnings. A single Set
 * keyed by business id is enough — if the operator ever rotates the
 * fallback target (e.g. deletes one business and the next-oldest
 * takes over), the new id will warn once.
 */
const demoFallbackWarned = new Set<string>();
let syntheticDemoWarned = false;

/**
 * Resolve the user's primary BusinessProfile.
 *
 * - For a signed-in user (Clerk userId present): looks up via Membership
 *   first (so users with shared multi-business access land on the same
 *   business). If the user has no memberships yet, creates a default
 *   BusinessProfile with the user as OWNER.
 * - For an anonymous request (userId === null): falls through to
 *   `getDemoBusiness()` so signed-out visitors browsing the demo land
 *   on a stable, shared seeded business.
 */
export async function getOrCreateDefaultBusiness(
  userId: string | null,
): Promise<BusinessProfile> {
  if (!userId) return getDemoBusiness();

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
