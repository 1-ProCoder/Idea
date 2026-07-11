import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Bell,
  Briefcase,
  CalendarCheck,
  CheckCircle2,
  PhoneCall,
  X,
  type LucideIcon,
} from 'lucide-react';

import { useAuthedFetch } from '../hooks/useAuthedFetch';
import {
  getNotifications,
  type ActivityFeed,
  type NotificationDto,
} from '../lib/api-notifications';

const ICONS: Record<NotificationDto['iconKind'], LucideIcon> = {
  phone: PhoneCall,
  alert: AlertTriangle,
  check: CheckCircle2,
  briefcase: Briefcase,
  calendar: CalendarCheck,
};

const COLOR_CLASSES: Record<NotificationDto['colorKind'], string> = {
  primary:
    'bg-primary/15 text-primary ring-primary/30',
  danger:
    'bg-rose-500/15 text-rose-300 ring-rose-500/30',
  success:
    'bg-success/15 text-success ring-success/30',
  warning:
    'bg-warning/15 text-warning ring-warning/30',
  info:
    'bg-primary/15 text-primary ring-primary/30',
};

/**
 * Compact, deterministic relative-time formatter. Mirrors the
 * "2 min ago / 8 min ago / 1 h ago" cadence of the old mock so the live
 * feed looks visually identical when it lands on the same data.
 */
function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  if (diffMs < 0) return 'just now';
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return 'just now';
  const mins = Math.floor(sec / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} d ago`;
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function useNotifications() {
  const { isLoaded } = useUser();
  const fetch = useAuthedFetch();
  return useQuery<ActivityFeed>({
    queryKey: ['notifications'],
    queryFn: () => fetch((token) => getNotifications(token)),
    enabled: isLoaded,
    staleTime: 60_000,
  });
}

function LoadingSkeleton(): JSX.Element {
  return (
    <ul className="max-h-80 overflow-y-auto scrollbar-thin divide-y divide-white/[0.04]">
      {[0, 1, 2].map((i) => (
        <li key={i} className="px-4 py-3">
          <div className="flex items-start gap-3">
            <span className="w-8 h-8 rounded-lg bg-white/[0.04] ring-1 ring-white/[0.06] animate-pulse flex-shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 w-2/5 rounded bg-white/[0.04] animate-pulse" />
              <div className="h-2.5 w-4/5 rounded bg-white/[0.04] animate-pulse" />
              <div className="h-2 w-1/5 rounded bg-white/[0.04] animate-pulse" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function EmptyState(): JSX.Element {
  return (
    <div className="px-4 py-10 text-center">
      <p className="text-sm font-medium text-foreground">No new activity</p>
      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
        Calls, bookings, and job updates will show up here as they happen.
      </p>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }): JSX.Element {
  return (
    <div className="px-4 py-8 text-center">
      <p className="text-sm font-medium text-foreground">
        Couldn\u2019t load activity
      </p>
      <p className="text-xs text-muted-foreground mt-1.5">
        Check your connection and try again.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}

export function NotificationBell(): JSX.Element {
  const [open, setOpen] = useState(false);
  const query = useNotifications();
  const unread = query.data?.items.length ?? 0;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() =>
          setOpen((prev) => {
            // Refetch on opening so the dropdown always pulls fresh
            // activity — otherwise users see yesterday's items until
            // the 60 s staleTime ages out. Functional setter avoids the
            // stale-closure trap.
            if (!prev) void query.refetch();
            return !prev;
          })
        }
        aria-label={`Notifications (${unread} unread)`}
        className="relative w-10 h-10 rounded-lg glass-card flex items-center justify-center text-foreground/80 hover:text-foreground hover:bg-white/[0.06] transition-colors"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-50 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 glass-card-strong rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-40"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <span className="text-sm font-semibold text-foreground">
                Notifications
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close notifications"
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {query.isPending ? (
              <LoadingSkeleton />
            ) : query.isError ? (
              <ErrorState onRetry={() => void query.refetch()} />
            ) : unread === 0 ? (
              <EmptyState />
            ) : (
              <ul className="max-h-80 overflow-y-auto scrollbar-thin divide-y divide-white/[0.04]">
                {(query.data?.items ?? []).map((n) => {
                  const Icon = ICONS[n.iconKind];
                  return (
                    <li
                      key={n.id}
                      className="px-4 py-3 hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={[
                            'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ring-1',
                            COLOR_CLASSES[n.colorKind],
                          ].join(' ')}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {n.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {n.body}
                          </p>
                          <p className="text-[10px] text-muted-foreground/70 mt-1 font-mono">
                            {timeAgo(n.createdAt)}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="px-4 py-2 border-t border-white/[0.06] bg-white/[0.02]">
              <Link
                to="/settings/notifications"
                onClick={() => setOpen(false)}
                className="block w-full text-center text-xs font-semibold text-primary hover:text-primary/80 transition-colors py-1"
              >
                View all
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
