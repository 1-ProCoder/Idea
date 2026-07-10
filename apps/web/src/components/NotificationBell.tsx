import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CheckCircle2, PhoneCall, Sparkles, X } from 'lucide-react';

type Alert = {
  id: string;
  type: 'call' | 'success' | 'info';
  title: string;
  body: string;
  time: string;
};

const MOCK_ALERTS: Alert[] = [
  {
    id: '1',
    type: 'call',
    title: 'New emergency call',
    body: 'Sarah Mitchell — burst pipe, kitchen flooding',
    time: '2 min ago',
  },
  {
    id: '2',
    type: 'success',
    title: 'Booking confirmed',
    body: 'James M. assigned to job at 14:30',
    time: '8 min ago',
  },
  {
    id: '3',
    type: 'info',
    title: 'AI receptionist updated',
    body: 'Voice model v2.3 deployed',
    time: '1 h ago',
  },
];

export function NotificationBell(): JSX.Element {
  const [open, setOpen] = useState(false);
  const unread = MOCK_ALERTS.length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
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
            <ul className="max-h-80 overflow-y-auto scrollbar-thin divide-y divide-white/[0.04]">
              {MOCK_ALERTS.map((a) => {
                const Icon =
                  a.type === 'call'
                    ? PhoneCall
                    : a.type === 'success'
                      ? CheckCircle2
                      : Sparkles;
                return (
                  <li
                    key={a.id}
                    className="px-4 py-3 hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={[
                          'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ring-1',
                          a.type === 'call'
                            ? 'bg-rose-500/15 text-rose-300 ring-rose-500/30'
                            : a.type === 'success'
                              ? 'bg-success/15 text-success ring-success/30'
                              : 'bg-primary/15 text-primary ring-primary/30',
                        ].join(' ')}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {a.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {a.body}
                        </p>
                        <p className="text-[10px] text-muted-foreground/70 mt-1 font-mono">
                          {a.time}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="px-4 py-2 border-t border-white/[0.06] bg-white/[0.02]">
              <button
                type="button"
                className="w-full text-center text-xs font-semibold text-primary hover:text-primary/80 transition-colors py-1"
              >
                View all
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
