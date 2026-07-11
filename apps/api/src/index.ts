import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import express, { type ErrorRequestHandler } from 'express';

// `import 'dotenv/config'` reads .env from process.cwd(), but our
// `start-dev.sh` launches the api from the monorepo root, so bare
// dotenv was reading the wrong directory and CLERK_SECRET_KEY came
// back undefined. Resolve .env relative to THIS source file so the
// api picks up apps/api/.env regardless of cwd. Works in `tsx watch`
// (resolves to apps/api/src/) and in `node dist/index.js` (resolves
// to apps/api/dist/, which `../.env` climbs back to apps/api/.env).
loadEnv({
  path: path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../.env',
  ),
});
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

import { meRouter } from './routes/me.js';
import { webhookRouter } from './routes/webhooks.js';
import { customersRouter } from './routes/customers.js';
import { workersRouter } from './routes/workers.js';
import { jobsRouter } from './routes/jobs.js';
import { callsRouter } from './routes/calls.js';
import { appointmentsRouter } from './routes/appointments.js';
import { businessRouter } from './routes/business.js';
import { dashboardRouter } from './routes/dashboard.js';
import { publicRouter } from './routes/public.js';
import { usageRouter } from './routes/usage.js';
import { securityRouter } from './routes/security.js';
import { notificationsRouter } from './routes/notifications.js';
import { waitlistRouter } from './routes/waitlist.js';

const PORT = Number(process.env.PORT ?? 4000);
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? 'http://localhost:5173';

const app = express();

app.use(cors({ origin: WEB_ORIGIN, credentials: true }));

// Public liveness probe — mounted BEFORE clerkMiddleware so load balancers
// can ask "is the process alive?" without an auth context, and so it stays
// green even when CLERK_SECRET_KEY is a placeholder during dev.
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// IMPORTANT: Mount /webhooks BEFORE clerkMiddleware + express.json() so the
// raw body survives intact for Svix signature verification.
app.use('/webhooks', webhookRouter);

// Public marketing-site showcase endpoint — used by the home page's
// `<SignedOut>` "see FlowFix in action" block. Unauthenticated by
// design; returns scrubbed/masked PII only. Mounted BEFORE
// `requireAuth()` so the no-token path resolves cleanly.
app.use('/api', publicRouter);

app.use(clerkMiddleware());
app.use(express.json());

// Authenticated API routes
app.use('/api', meRouter);
app.use('/api', customersRouter);
app.use('/api', workersRouter);
app.use('/api', jobsRouter);
app.use('/api', callsRouter);
app.use('/api', appointmentsRouter);
app.use('/api', businessRouter);
app.use('/api', dashboardRouter);
app.use('/api', usageRouter);
app.use('/api', securityRouter);
app.use('/api', notificationsRouter);
app.use('/api', waitlistRouter);

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ error: 'not_found' });
});

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // Validation errors → 400 with per-field details.
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'invalid_input',
      message: 'Validation failed',
      issues: err.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      })),
    });
    return;
  }

  // Prisma errors → 409 / 404 for known client-side cases.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({
        error: 'conflict',
        message: 'A record with these values already exists.',
      });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'not_found' });
      return;
    }
  }

  // Prisma init-time failures (DB unreachable, bad URL, ECONNREFUSED,
  // ENOTFOUND, EAI_AGAIN) → 503 database_unavailable so the dashboard
  // correctly renders the "database cannot be reached" EmptyState
  // instead of falling through to a generic 500 internal_error. Uses
  // duck-typing + a stringified regex rather than
  // `err instanceof Prisma.PrismaClient...` because in workspaces with
  // hoisted dependencies, the runtime error instance may originate
  // from a different copy of @prisma/client than the one imported
  // here, and `instanceof` checks can fail across module realms.
  const errStr = err instanceof Error ? err.message : String(err);
  const errCtorName =
    typeof err === 'object' && err !== null && 'constructor' in err
      ? (err as { constructor: { name?: string } }).constructor?.name ?? ''
      : '';
  if (
    errCtorName.includes('Prisma') ||
    /Can't reach database server|connection refused|ENOTFOUND|EAI_AGAIN|ECONNREFUSED|prisma|database/i.test(errStr)
  ) {
    res.status(503).json({
      error: 'database_unavailable',
      message:
        'The database cannot be reached. Check apps/api/.env DATABASE_URL and confirm a Postgres is running.',
    });
    return;
  }

  // Clerk *misconfiguration* (missing publishable / secret / front URL)
  // → 503 backend_misconfigured so the dashboard can render a clean
  // "Backend unavailable" empty state instead of leaking Clerk's raw
  // error string into the UI. Tight regex so this branch does NOT
  // swallow legitimate runtime errors like "Clerk: Invalid JWT" or
  // "Clerk: Network request failed" — those fall through to the
  // generic 500 below.
  if (
    err instanceof Error &&
    /publishable key|secret key|frontend api url/i.test(err.message)
  ) {
    console.warn(
      '[api] backend_misconfigured (Clerk):',
      err.message,
    );
    res.status(503).json({
      error: 'backend_misconfigured',
      message: 'Backend authentication is misconfigured.',
    });
    return;
  }

  console.error('[api error]', err);
  res.status(500).json({
    error: 'internal_error',
    message: err instanceof Error ? err.message : String(err),
  });
};
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT}`);
  console.log(`[api] CORS origin: ${WEB_ORIGIN}`);
  if (!process.env.DATABASE_URL) {
    console.warn(
      `[api] \u26a0\ufe0f  DATABASE_URL is not set. All /api routes that hit Postgres will return 503 until you configure it.`,
    );
  } else {
    console.log(`[api] DATABASE_URL: configured`);
  }
  if (!process.env.RESEND_API_KEY) {
    console.warn(
      `[api] ⚠️  RESEND_API_KEY is not set. POST /api/waitlist persists signups but the operator email will print to stderr instead of being delivered.`,
    );
  } else {
    console.log(`[api] RESEND_API_KEY: configured`);
  }
  console.log(
    `[api] WAITLIST_FORWARD_TO: ${process.env.WAITLIST_FORWARD_TO ?? 'princenauman101@gmail.com (fallback)'}`,
  );
  // Log which business the public demo resolves to on first call.
  // This is lazy: we only resolve when the first public GET hits the
  // API, so we don't slow down startup. Operators can see it by
  // visiting /dashboard in a private window.
  console.log(
    `[api] public demo mode: enabled. GET /api/dashboard/stats, /api/business, /api/calls, /api/calls/stats are reachable without a Clerk session and resolve to the shared demo business.`,
  );
});

