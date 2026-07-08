import { Router } from 'express';
import { requireAuth, getAuth } from '@clerk/express';

export const meRouter = Router();

meRouter.get('/me', requireAuth(), (req, res) => {
  // `requireAuth()` ensures the session is valid; `getAuth()` reads it.
  const { userId, sessionId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  return res.json({
    userId,
    sessionId: sessionId ?? null,
  });
});
