import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Info,
  X,
  type LucideIcon,
} from 'lucide-react';

/**
 * Global light-weight toast system (no external lib).
 *
 * Usage:
 *   const toast = useToast();
 *   toast.success('Saved');
 *   toast.error('Failed to delete');
 *   toast.info('Coming soon');
 *
 * The <ToastHost> component is mounted once at app root and renders a
 * fixed-position stack on the bottom-right.
 */

export type ToastVariant = 'success' | 'error' | 'info';

type Toast = {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
};

type ToastApi = {
  push: (t: Omit<Toast, 'id'>) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    setToasts((arr) => arr.filter((t) => t.id !== id));
    const t = timersRef.current[id];
    if (t) {
      clearTimeout(t);
      delete timersRef.current[id];
    }
  }, []);

  const push = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).slice(2, 9);
      setToasts((arr) => [...arr, { ...t, id }]);
      timersRef.current[id] = setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      push,
      success: (title, description) => push({ variant: 'success', title, description }),
      error: (title, description) => push({ variant: 'error', title, description }),
      info: (title, description) => push({ variant: 'info', title, description }),
      dismiss,
    }),
    [push, dismiss],
  );

  useEffect(() => {
    return () => {
      for (const id of Object.keys(timersRef.current)) {
        clearTimeout(timersRef.current[id]);
      }
    };
  }, []);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastStack toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Defensive: if a consumer renders outside the provider, fall back to a
    // silent no-op rather than throwing. Common when a route is lazy-loaded.
    const noop = (() => undefined) as never;
    return {
      push: noop,
      success: noop,
      error: noop,
      info: noop,
      dismiss: noop,
    };
  }
  return ctx;
}

function ToastStack({
  toasts,
  dismiss,
}: {
  toasts: Toast[];
  dismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed bottom-6 right-6 z-[60] flex flex-col gap-2 max-w-sm"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

const variantStyles: Record<
  ToastVariant,
  { ring: string; icon: LucideIcon; iconClass: string }
> = {
  success: {
    ring: 'ring-success/40',
    icon: CheckCircle2,
    iconClass: 'text-success',
  },
  error: {
    ring: 'ring-danger/40',
    icon: AlertCircle,
    iconClass: 'text-danger',
  },
  info: {
    ring: 'ring-primary/40',
    icon: Info,
    iconClass: 'text-primary',
  },
};

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  const v = variantStyles[toast.variant];
  const Icon = v.icon;
  return (
    <div
      role="status"
      className={`pointer-events-auto glass-card-strong rounded-xl p-3.5 shadow-2xl shadow-black/40 ring-1 ${v.ring}`}
      style={{ animation: 'flowfix-toast-in 220ms ease-out' }}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${v.iconClass}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{toast.title}</p>
          {toast.description && (
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {toast.description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="text-muted-foreground hover:text-foreground rounded p-1 transition-colors flex-shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
