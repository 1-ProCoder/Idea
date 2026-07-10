import 'dotenv/config';
import express, { type ErrorRequestHandler } from 'express';
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

  // Prisma init-time failures (DB unreachable, bad URL, etc.) → 503 with
  // a loud, actionable message instead of a generic 500. This lets the
  // frontend render a 'database unavailable' state instead of crashing.
  if (
    err instanceof Prisma.PrismaClientInitializationError ||
    err instanceof Prisma.PrismaClientRustPanicError ||
    (err instanceof Error &&
      /Can't reach database server|prisma|database/i.test(err.message))
  ) {
    res.status(503).json({
      error: 'database_unavailable',
      message:
        'The database cannot be reached. Check apps/api/.env DATABASE_URL and confirm a Postgres is running.',
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
});

