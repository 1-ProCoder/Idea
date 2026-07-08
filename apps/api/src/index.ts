import 'dotenv/config';
import express, { type ErrorRequestHandler } from 'express';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

import { healthRouter } from './routes/health.js';
import { meRouter } from './routes/me.js';
import { webhookRouter } from './routes/webhooks.js';
import { customersRouter } from './routes/customers.js';

const PORT = Number(process.env.PORT ?? 4000);
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? 'http://localhost:5173';

const app = express();

app.use(cors({ origin: WEB_ORIGIN, credentials: true }));

// IMPORTANT: Mount /webhooks BEFORE clerkMiddleware + express.json() so the
// raw body survives intact for Svix signature verification.
app.use('/webhooks', webhookRouter);

app.use(clerkMiddleware());
app.use(express.json());

// API routes
app.use('/api', healthRouter);
app.use('/api', meRouter);
app.use('/api', customersRouter);

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
});
