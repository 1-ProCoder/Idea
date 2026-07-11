import { Resend } from 'resend';

/**
 * Resend client. Lazy-initialized; if `RESEND_API_KEY` is unset we keep
 * `resend === null` and the waitlist route falls back to logging the
 * email body to stderr so submissions still persist to the DB and the
 * operator can replay them later.
 */
const apiKey = process.env.RESEND_API_KEY;
const resend: Resend | null = apiKey ? new Resend(apiKey) : null;

const OPERATOR_EMAIL =
  process.env.WAITLIST_FORWARD_TO?.trim() || 'princenauman101@gmail.com';

const FROM_EMAIL =
  process.env.WAITLIST_FROM?.trim() || 'FlowFix AI Waitlist <noreply@flowfix.app>';

export type WaitlistSignupNotice = {
  email: string;
  signupAt: Date;
  ip?: string | null;
  userAgent?: string | null;
};

export type EmailSendResult =
  | { ok: true; resendId: string | null }
  | { ok: false; error: string };

/**
 * Compose + send a "we have a new waitlist signup" notification email.
 * The operator can reply directly to reach the person who joined.
 *
 * Subject is intentionally short so it survives mobile email clients +
 * Slack-style email-to-channel rules.
 */
export async function sendWaitlistNotification(
  notice: WaitlistSignupNotice,
): Promise<EmailSendResult> {
  const subject = `[FlowFix] New waitlist signup \u2014 ${notice.email}`;
  const iso = notice.signupAt.toISOString();

  const lines = [
    'New waitlist signup on FlowFix AI.',
    '',
    `Email:        ${notice.email}`,
    `Signed up at: ${iso}`,
    notice.ip ? `IP:          ${notice.ip}` : null,
    notice.userAgent ? `User-Agent:  ${notice.userAgent.slice(0, 240)}` : null,
    '',
    'Reply directly to this email to reach them. Use the dashboard to',
    "push a batch invite once you've collected enough signups.",
  ].filter(Boolean);
  const text = lines.join('\n');

  if (!resend) {
    // Dev fallback \u2014 still keep the row in the DB, but warn loudly.
    console.warn(
      `[email] RESEND_API_KEY not set; logging waitlist signup to stderr.\n  to=${OPERATOR_EMAIL}\n  subject=${subject}\n------\n${text}\n------`,
    );
    return { ok: false, error: 'RESEND_API_KEY not configured' };
  }

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: OPERATOR_EMAIL,
      replyTo: notice.email,
      subject,
      text,
    });
    if (result.error) {
      return { ok: false, error: result.error.message };
    }
    return { ok: true, resendId: result.data?.id ?? null };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

