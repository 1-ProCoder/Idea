import { useEffect, useMemo, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';
import { Inbox } from 'lucide-react';
import type { JSX } from 'react';

import { PageHeader } from '../components/layout/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { UnifiedListBoard } from '../components/list/UnifiedListBoard';
import { useAuthedFetch } from '../hooks/useAuthedFetch';
import {
  fetchUnifiedItems,
  type UnifiedListResponse,
  type UnifiedListTab,
} from '../lib/api-items';

/**
 * Protected `/list` page.
 *
 * Pipelines 4 backend endpoints (customers, jobs, calls, appointments)
 * into a single chronological stream of `UnifiedItem`s. The merged
 * result is rendered by `<UnifiedListBoard>`, which also drives the
 * type filter tabs and global search.
 *
 * Search is debounced 250ms so we don't re-fire 4 round-trips on
 * every keystroke.
 */
export default function ListPage(): JSX.Element {
  const { isLoaded } = useUser();
  const fetch = useAuthedFetch();
  const [rawSearch, setRawSearch] = useState('');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<UnifiedListTab>('all');

  useEffect(() => {
    const id = window.setTimeout(() => {
      setSearch(rawSearch.trim());
    }, 250);
    return () => window.clearTimeout(id);
  }, [rawSearch]);

  const queryKey = useMemo(
    () => ['unified-list', { search }] as const,
    [search],
  );

  const query = useQuery<UnifiedListResponse>({
    queryKey,
    queryFn: () => fetch((token) => fetchUnifiedItems(token, { q: search })),
    enabled: isLoaded,
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });

  const allItems = query.data?.items ?? [];
  const total = query.data?.total ?? 0;

  // Tab slicing lives INSIDE <UnifiedListBoard> (it owns the
  // itemsAll prop and filters there). Keeping tab state at the page
  // level here is intentional — it's the controlled input the Board
  // needs to know which slice to render.

  // Stat cards summarising the merged stream.
  const counts = useMemo(() => {
    const c = { customers: 0, jobs: 0, calls: 0, appointments: 0 };
    for (const i of allItems) {
      if (i.type === 'customer') c.customers += 1;
      else if (i.type === 'job') c.jobs += 1;
      else if (i.type === 'call') c.calls += 1;
      else if (i.type === 'appt') c.appointments += 1;
    }
    return c;
  }, [allItems]);

  const errorMessage =
    query.isError && query.error
      ? (query.error as { message?: string })?.message ?? 'Unknown error'
      : null;

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8 pb-32 space-y-8">
      <PageHeader
        eyebrow="Workspace"
        title="All activity"
        subtitle="One stream across customers, jobs, calls, and appointments. Filter by type or search everything."
        actions={null}
      />

      <section
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
        aria-label="Activity counts"
      >
        <StatCard
          label="Customers"
          value={String(counts.customers)}
          icon={Inbox}
        />
        <StatCard
          label="Jobs"
          value={String(counts.jobs)}
          icon={Inbox}
          accent="accent"
        />
        <StatCard
          label="Calls"
          value={String(counts.calls)}
          icon={Inbox}
          accent="warning"
        />
        <StatCard
          label="Appointments"
          value={String(counts.appointments)}
          icon={Inbox}
          accent="success"
        />
      </section>

      <UnifiedListBoard
        itemsAll={allItems}
        total={total}
        loading={query.isPending || query.isFetching}
        error={errorMessage}
        q={rawSearch}
        tab={tab}
        onQChange={setRawSearch}
        onTabChange={setTab}
        newHref="/list/new"
        newLabel="New customer"
        pageSize={20}
        onRetry={() => query.refetch()}
      />
    </div>
  );
}
