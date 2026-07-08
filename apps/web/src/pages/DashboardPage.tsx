import { useAuth, useUser } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';

type MeResponse = {
  userId: string;
  sessionId: string | null;
};

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  const {
    data: me,
    isLoading,
    isError,
    error,
  } = useQuery<MeResponse>({
    queryKey: ['me'],
    queryFn: async () => {
      // Clerk uses bearer JWTs (not same-origin cookies) by default, so the
      // Express backend needs the session token in the Authorization header.
      const token = await getToken({ skipCache: true });
      const res = await fetch('/api/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Backend returned ${res.status}: ${text || res.statusText}`);
      }
      return res.json() as Promise<MeResponse>;
    },
    enabled: isLoaded,
  });

  if (!isLoaded) {
    return <p className="p-6 text-stone-500">Loading…</p>;
  }

  const firstName = user?.firstName ?? user?.username ?? 'there';

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {firstName}</h1>
        <p className="text-stone-600 mt-1">
          Backend handshake:{' '}
          {isLoading && <span className="text-stone-500">checking…</span>}
          {me && <span className="text-emerald-700">✓ Clerk JWT verified</span>}
          {isError && (
            <span className="text-rose-700">✗ {String((error as Error).message)}</span>
          )}
        </p>
      </header>

      <section>
        <h2 className="text-lg font-semibold">Today</h2>
        <ul className="mt-3 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Calls today', milestone: 'M7' },
            { label: 'Jobs today', milestone: 'M3' },
            { label: 'Emergency jobs', milestone: 'M5' },
            { label: 'Revenue (week)', milestone: 'M7' },
          ].map(({ label, milestone }) => (
            <li
              key={label}
              className="border border-stone-200 rounded-lg p-4 bg-white"
            >
              <p className="font-medium text-stone-900">{label}</p>
              <p className="text-xs text-stone-500 mt-1">
                Coming in milestone {milestone}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Roadmap</h2>
        <ul className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
          {[
            { id: 'M2', label: 'Customer management (CRUD + dedupe)', done: false },
            { id: 'M3', label: 'Job management (statuses, priority)', done: false },
            { id: 'M4', label: 'Calendar + scheduling (no double-booking)', done: false },
            { id: 'M5', label: 'AI receptionist (Twilio + Claude)', done: false },
            { id: 'M6', label: 'Notifications (SMS + email)', done: false },
            { id: 'M7', label: 'Dashboard charts + analytics', done: false },
          ].map((m) => (
            <li
              key={m.id}
              className={[
                'border rounded-lg p-4 flex items-center justify-between gap-3',
                m.done
                  ? 'border-emerald-200 bg-emerald-50/50'
                  : 'border-stone-200 bg-white',
              ].join(' ')}
            >
              <span>{m.label}</span>
              <span
                className={[
                  'text-xs font-mono px-2 py-0.5 rounded-md',
                  m.done
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-stone-100 text-stone-700',
                ].join(' ')}
              >
                {m.id}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
