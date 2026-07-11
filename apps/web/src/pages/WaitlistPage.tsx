import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { FormEvent } from 'react';
import { ArrowLeft, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

import { joinWaitlist } from '../lib/api-waitlist';

type FormState = 'idle' | 'submitting' | 'success' | 'duplicate' | 'error';
type ErrorReason = 'invalid_email' | 'rate_limited' | 'internal_error' | 'network';

const STATE_COPY: Record<FormState, string> = {
  idle: '',
  submitting: '',
  success: "You're on the waitlist.",
  duplicate: "You're already on the waitlist.",
  error: '',
};

function explainError(reason: ErrorReason | null): string {
  switch (reason) {
    case 'invalid_email':
      return 'That email looks malformed. Give it another try.';
    case 'rate_limited':
      return 'Too many signup attempts from this device. Wait a minute, then try again.';
    case 'internal_error':
      return "Couldn't reach the waitlist service. Try again in a moment.";
    case 'network':
      return 'Network hiccup. Check your connection and retry.';
    default:
      return '';
  }
}

export default function WaitlistPage(): React.JSX.Element {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<FormState>('idle');
  const [errorReason, setErrorReason] = useState<ErrorReason | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (state === 'submitting') return;
    setState('submitting');
    setErrorReason(null);
    try {
      const result = await joinWaitlist(email);
      if (result.alreadyOnList) {
        setState('duplicate');
      } else {
        setState('success');
      }
    } catch (err) {
      const e = err as { reason?: ErrorReason };
      setErrorReason(e.reason ?? 'network');
      setState('error');
    }
  }

  const isSuccess = state === 'success' || state === 'duplicate';
  const headline = STATE_COPY[state];

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <header className="relative max-w-[88rem] mx-auto px-4 sm:px-8 pt-6 flex items-center justify-between">
        <Link
          to="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to home
        </Link>
      </header>

      <main className="max-w-xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-32">
        <div className="glass-card rounded-3xl p-8 sm:p-12 text-center">
          <span className="inline-flex w-12 h-12 rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30 items-center justify-center mb-5">
            <Sparkles className="w-5 h-5" />
          </span>
          <h1 className="text-display text-3xl sm:text-4xl text-foreground leading-[1.05]">
            Join the FlowFix waitlist
          </h1>
          <p className="mt-4 text-muted-foreground text-[14.5px] leading-relaxed">
            FlowFix is in private beta. Drop your email and we&apos;ll let you
            know the moment a slot opens for your trade.
          </p>

          {isSuccess ? (
            <div className="mt-8 space-y-4">
              <p className="inline-flex items-center gap-2 text-success text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                {headline}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Reviews go out weekly from{' '}
                <code className="font-mono">princenauman101@gmail.com</code>.
                We&apos;ll be in touch the moment a slot opens.
              </p>
              <Link
                to="/dashboard"
                className="btn-organic mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/[0.05] text-foreground text-sm font-semibold ring-1 ring-white/[0.08] hover:bg-white/[0.10] transition-colors"
              >
                Explore the demo in the meantime →
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
              <label htmlFor="waitlist-email" className="sr-only">
                Email address
              </label>
              <input
                id="waitlist-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@yourcompany.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={state === 'submitting'}
                className="w-full h-12 px-4 rounded-xl glass-card text-foreground placeholder:text-muted-foreground text-[15px] focus:outline-none focus:ring-1 focus:ring-primary/40 disabled:opacity-50"
              />
              {state === 'error' && (
                <p className="text-xs text-danger leading-relaxed text-left">
                  {explainError(errorReason)}
                </p>
              )}
              <button
                type="submit"
                disabled={state === 'submitting' || email.trim().length === 0}
                className="btn-organic w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-[15px] shadow-sm shadow-primary/30 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {state === 'submitting' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding you to the waitlist…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Notify me when it&rsquo;s ready
                  </>
                )}
              </button>
              <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
                We use this email only to let you in. No marketing, no
                newsletters, no third-party sharing.
              </p>
            </form>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            Already approved?{' '}
            <Link
              to="/dashboard"
              className="text-primary hover:text-primary/80 underline-offset-4 hover:underline transition-colors"
            >
              Open the demo dashboard →
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
