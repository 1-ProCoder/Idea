import { useEffect, useState } from 'react';
import {
  Calendar,
  Inbox,
  Loader2,
  PhoneCall,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { JSX } from 'react';

import { AmbientGlow } from './AmbientGlow';
import { SectionLabel } from './SectionLabel';
import {
  fetchPublicRecentActivity,
  type PublicActivityItem,
  type PublicActivityResponse,
} from '../../lib/api-public';

const TYPE_ICON: Record<PublicActivityItem['type'], LucideIcon> = {
  customer: Users,
  job: Wrench,
  call: PhoneCall,
};

function toneClass(tone: PublicActivityItem['badge']['tone']): string {
  switch (tone) {
    case 'primary':
      return 'bg-primary/15 text-primary ring-primary/30';
    case 'accent':
      return 'bg-accent/15 text-accent ring-accent/30';
    case 'warning':
      return 'bg-warning/15 text-warning ring-warning/30';
    default:
      return 'bg-muted text-muted-foreground ring-white/[0.08]';
  }
}

function timeAgoLabel(iso: string): string {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const s = Math.round(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  const days = Math.round(h / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

/**
 * "See FlowFix in action" block — a public, anonymized timeline of
 * recent customer / job / call activity. Mounted inside an
 * `<SignedOut>` wrapper on the marketing homepage so it only renders
 * for anonymous visitors — authed users always redirect to
 * /dashboard at `/`.
 *
 * Privacy: this fetches `/api/public/recent-activity`, which is
 * unauthenticated and returns ONLY masked PII (first-initial + last
 * initial for names, last-4 only for phones).
 */
export function PublicActivityStream(): JSX.Element {
  const [data, setData] = useState<PublicActivityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPublicRecentActivity(9)
      .then((resp) => {
        if (!cancelled) setData(resp);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message ?? String(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const items = data?.items ?? [];
  const loading = !data && !error;

  return (
    <section className="relative max-w-[88rem] mx-auto px-4 sm:px-8 py-24 lg:py-32 overflow-hidden">
      <AmbientGlow color="indigo" position="top-left" size="lg" intensity="soft" />
      <AmbientGlow color="amber" position="bottom-right" size="md" intensity="soft" />

      <div className="mb-12 max-w-2xl">
        <SectionLabel number="03.5" title="Live activity" />
        <h2 className="mt-4 text-display text-4xl lg:text-5xl text-foreground leading-[1.05]">
          See FlowFix in action.
        </h2>
        <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
          A live stream of calls answered, jobs dispatched, and customers
          captured. Names and phone numbers are masked for visitor privacy.
        </p>
      </div>

      {/* Visual rail — vertical glowing lane with pulsing dot. */}
      <div className="relative">
        <div
          aria-hidden
          className="hidden lg:block absolute left-[1.6rem] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/40 to-transparent"
        />
        <div
          aria-hidden
          className="hidden lg:flex absolute left-[1.44rem] top-2 w-[0.32rem] h-[0.32rem] rounded-full bg-primary shadow-[0_0_14px_3px_hsl(var(--primary)/0.7)]"
        />

        {loading && (
          <div
            role="status"
            aria-label="Loading live activity"
            className="flex items-center gap-2 text-sm text-muted-foreground py-6"
          >
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            Loading the most recent activity…
          </div>
        )}

        {error && !loading && (
          <div
            role="status"
            className="rounded-lg glass-blend p-4 text-sm text-muted-foreground"
          >
            <p>
              We couldn&apos;t fetch live activity right now — that&apos;s our
              problem, not yours.
            </p>
            <p className="mt-1 text-xs">
              The snippet below shows what anonymous visitors normally see:
              masked customer / job / call events rolling in real time.
            </p>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div
            role="status"
            className="rounded-2xl glass-blend p-8 text-center text-muted-foreground"
          >
            <span
              aria-hidden
              className="mx-auto w-14 h-14 rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/30 flex items-center justify-center mb-4"
            >
              <Inbox className="w-6 h-6" />
            </span>
            <p className="text-base font-semibold text-foreground">
              The stream is quiet right now.
            </p>
            <p className="text-sm mt-1 leading-relaxed">
              When trades on FlowFix start answering calls, those events
              roll in here in real time. Each row is fully anonymized until
              you sign in.
            </p>
          </div>
        )}

        {!loading && items.length > 0 && (
          <ul className="space-y-3">
            {items.slice(0, 6).map((item, i) => {
              const Icon = TYPE_ICON[item.type] ?? Calendar;
              return (
                <motion.li
                  key={`${item.type}-${item.createdAt}-${i}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  className="relative flex items-start gap-4"
                >
                  <span
                    className="hidden lg:flex w-[3.2rem] h-[3.2rem] rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.08] text-muted-foreground items-center justify-center flex-shrink-0 z-10"
                    aria-hidden
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                  <span
                    className="hidden lg:block w-3 h-3 rounded-full bg-primary mt-[1.4rem] -ml-[1.5rem] ring-4 ring-primary/20 z-0"
                    aria-hidden
                  />
                  <div className="glass-blend rounded-xl px-4 py-3 flex items-center gap-3 flex-1 min-w-0">
                    <span
                      className={[
                        'inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ring-1 flex-shrink-0',
                        toneClass(item.badge.tone),
                      ].join(' ')}
                    >
                      {item.badge.label}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground truncate">
                        {item.headline}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.subtitle}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono tabular-nums text-muted-foreground flex-shrink-0">
                      {timeAgoLabel(item.createdAt)}
                    </span>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}

        {data?.note && (
          <p className="mt-6 text-[11px] text-muted-foreground/70 leading-relaxed max-w-2xl">
            {data.note}
          </p>
        )}
      </div>
    </section>
  );
}
