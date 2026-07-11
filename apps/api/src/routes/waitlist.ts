import { Router, type Request, type Response, type NextFunction } from 'express';
import { createHash } from 'node:crypto';
import { z } from 'zod';

import { Prisma } from '@prisma/client';

import { prisma } from '../db.js';
import { sendWaitlistNotification } from '../lib/email.js';

export const waitlistRouter = Router();

const SignupSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(254)
    .email('Please enter a valid email address.'),
});

const HOUR_MS = 60 * 60 * 1000;
const MIN_INTERVAL_MS = 30 * 1000;
const MAX_PER_HOUR = 5;
const IP_SALT =
  process.env.WAITLIST_IP_SALT?.trim() || 'flowfix-default-waitlist-salt';

// In-memory token bucket keyed by hashed IP. Resets on process restart;
// for multi-instance production deploys, replace with Redis or similar.
// One bucket per IP keeps single-user spam contained without locking
// out unrelated visitors on a shared NAT.
type Bucket = { count: number; resetAt: number; lastAt: number };
const buckets = new Map<string, Bucket>();

function clientIp(req: Request): string {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length > 0) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  return req.socket.remoteAddress ?? 'unknown';
}

function ipHash(ip: string): string {
  return createHash('sha256')
    .update(`${IP_SALT}|${ip}`)
    .digest('hex')
    .slice(0, 16);
}

function checkRate(ip: string): { ok: boolean; retryAfter?: number } {
  const now = Date.now();
  const bucket = buckets.get(ip);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(ip, { count: 1, resetAt: now + HOUR_MS, lastAt: now });
    return { ok: true };
  }
  if (bucket.lastAt + MIN_INTERVAL_MS > now) {
    return {
      ok: false,
      retryAfter: Math.ceil((bucket.lastAt + MIN_INTERVAL_MS - now) / 1000),
    };
  }
  if (bucket.count >= MAX_PER_HOUR) {
    return {
      ok: false,
      retryAfter: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }
  bucket.count += 1;
  bucket.lastAt = now;
  return { ok: true };
}

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

waitlistRouter.post(
  '/waitlist',
  asyncHandler(async (req, res) => {
    const ip = clientIp(req);
    const rate = checkRate(ip);
    if (!rate.ok) {
      res.setHeader('Retry-After', String(rate.retryAfter ?? 60));
      return res.status(429).json({
        error: 'rate_limited',
        message: 'Too many signup attempts. Try again in a moment.',
        retryAfter: rate.retryAfter ?? 60,
      });
    }

    const parsed = SignupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'invalid_email',
        message: 'Please enter a valid email address.',
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      });
    }
    const email = parsed.data.email;

    // Idempotent: if we already have this email persisted, treat as success
    // and do not re-ping the operator. Counts on `email @unique`.
    const existing = await prisma.waitlistSignup.findUnique({
      where: { email },
    });
    if (existing) {
      return res.status(200).json({
        ok: true,
        message: "You're on the waitlist. We'll be in touch soon.",
        alreadyOnList: true,
      });
    }

    const ua = (req.headers['user-agent'] ?? '').toString().slice(0, 500);
    const referer = (req.headers['referer'] ?? '').toString().slice(0, 500);

    let row;
    try {
      row = await prisma.waitlistSignup.create({
        data: {
          email,
          ipHash: ipHash(ip),
          userAgent: ua || null,
          referer: referer || null,
          status: 'PENDING',
          sendAttempts: 0,
        },
      });
    } catch (err) {
      // Two near-simultaneous submits for the same email can race past
      // the findUnique() check above. Prisma throws P2002 on the second
      // `create` because `email` is @unique. Treat that as a successful
      // idempotent re-submission rather than letting the visitor see a
      // generic 500.
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        return res.status(200).json({
          ok: true,
          message: "You're on the waitlist. We'll be in touch soon.",
          alreadyOnList: true,
        });
      }
      console.error('[waitlist] persistence error:', err);
      return res.status(500).json({
        error: 'internal_error',
        message: 'Could not save your signup right now. Please try again.',
      });
    }

    const result = await sendWaitlistNotification({
      email,
      signupAt: row.createdAt,
      ip,
      userAgent: ua,
    });

    if (result.ok) {
      await prisma.waitlistSignup.update({
        where: { id: row.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          sendAttempts: { increment: 1 },
          lastSendError: null,
        },
      });
      return res.status(201).json({
        ok: true,
        message: "You're on the waitlist. We'll be in touch soon.",
      });
    }

    // Email send failed \u2014 still keep the row so the operator can retry
    // later. Surface a soft success to the visitor; do not leak the
    // Resend error reason.
    await prisma.waitlistSignup.update({
      where: { id: row.id },
      data: {
        status: 'FAILED',
        sendAttempts: { increment: 1 },
        lastSendError: result.error.slice(0, 500),
      },
    });
    console.warn(
      `[waitlist] email delivery deferred for ${email}: ${result.error}`,
    );
    return res.status(201).json({
      ok: true,
      message: "You're on the waitlist. We'll be in touch soon.",
      emailDelivery: 'deferred',
    });
  }),
);

// Aggregate count for the operator dashboard / marketing page if they
// want to display "X trades on the waitlist" without exposing rows.
waitlistRouter.get(
  '/waitlist/count',
  asyncHandler(async (_req, res) => {
    const count = await prisma.waitlistSignup.count();
    res.json({ count, asOf: new Date().toISOString() });
  }),
);

// Periodic cleanup so the in-memory `buckets` Map doesn't grow
// monotonically across unique IPs that never come back. Five-minute
// cadence is plenty for an anti-spam rate limit. `unref()` so the
// timer doesn't keep the Node event loop alive on shutdown.
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [ip, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(ip);
  }
}, CLEANUP_INTERVAL_MS);
cleanupTimer.unref();
