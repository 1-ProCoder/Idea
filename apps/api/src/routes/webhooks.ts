import { Router, raw, type Request, type Response } from 'express';
import { Webhook } from 'svix';

export const webhookRouter = Router();

webhookRouter.post(
  '/clerk',
  raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;

    // Dev-mode escape hatch: if the signing secret isn't configured, accept
    // the event but don't write anything. This lets devs run the API without
    // setting up Clerk webhooks.
    if (!signingSecret) {
      console.warn(
        '[webhook/clerk] CLERK_WEBHOOK_SIGNING_SECRET not set; skipping verification (dev only).',
      );
      return res.status(200).json({ ok: true, note: 'signing_secret_missing' });
    }

    const svixId = req.header('svix-id') ?? '';
    const svixTimestamp = req.header('svix-timestamp') ?? '';
    const svixSignature = req.header('svix-signature') ?? '';

    if (!svixId || !svixTimestamp || !svixSignature) {
      return res.status(400).json({ error: 'missing_svix_headers' });
    }

    try {
      const wh = new Webhook(signingSecret);
      const evt = wh.verify(req.body, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as { type: string; data: { id?: string } };

      console.log('[webhook/clerk] event', evt.type, 'user', evt.data?.id);

      // TODO (M2+): upsert a User row from evt.data when DATABASE_URL is set.
      // switch (evt.type) {
      //   case 'user.created':
      //   case 'user.updated': {
      //     const primary = (evt.data.email_addresses ?? [])[0]?.email_address ?? null;
      //     await prisma.user.upsert({
      //       where: { id: evt.data.id! },
      //       create: { id: evt.data.id!, email: primary },
      //       update: { email: primary },
      //     });
      //     break;
      //   }
      //   case 'user.deleted':
      //     await prisma.user.delete({ where: { id: evt.data.id! } }).catch(() => {});
      //     break;
      // }

      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('[webhook/clerk] signature verification failed', err);
      return res.status(400).json({ error: 'invalid_signature' });
    }
  },
);
