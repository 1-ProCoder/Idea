import 'dotenv/config';
import express, { type ErrorRequestHandler } from 'express';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';

import { healthRouter } from './routes/health.js';
import { meRouter } from './routes/me.js';
import { webhookRouter } from './routes/webhooks.js';

const PORT = Number(process.env.PORT ?? 4000);
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? 'http://localhost:5173';

const app = express();

app.use(cors({ origin: WEB_ORIGIN, credentials: true }));

// IMPORTANT: Mount /webhooks BEFORE clerkMiddleware + express.json().
// Clerk's webhook payloads must reach the Svix signature verifier as raw
// bodies, so we attach the `raw()` parser at the route level only.
app.use('/webhooks', webhookRouter);

// Clerk attaches req.auth to every downstream request.
app.use(clerkMiddleware());

app.use(express.json());

// API routes
app.use('/api', healthRouter);
app.use('/api', meRouter);

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ error: 'not_found' });
});

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error('[api error]', err);
  res.status(500).json({ error: 'internal_error', message: err.message });
};
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT}`);
  console.log(`[api] CORS origin: ${WEB_ORIGIN}`);
});
