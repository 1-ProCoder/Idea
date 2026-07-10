import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, UserPlus, Users } from 'lucide-react';

import { useAuthedFetch } from '../hooks/useAuthedFetch';
import {
  listCustomers,
  type ApiError,
  type CustomerDto,
} from '../lib/api-customers';
import CustomerModal from '../components/CustomerModal';

const PAGE_SIZE = 20;

function CustomerCardSkeleton(): JSX.Element {
  return (
    <div
      className="rounded-lg border border-border bg-card/60 p-4 animate-pulse"
      aria-hidden="true"
    >
      <div className="h-4 w-3/5 rounded bg-muted" />
      <div className="mt-2 h-3 w-2/5 rounded bg-muted" />
      <div className="mt-3 h-2 w-4/5 rounded bg-muted" />
      <div className="mt-1 h-2 w-3/5 rounded bg-muted" />
    </div>
  );
}

function CustomersSkeletonGrid(): JSX.Element {
  return (
    <div
      className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3"
      role="status"
      aria-label="Loading customers"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <CustomerCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default function CustomersPage() {
  const fetch = useAuthedFetch();
  const [rawSearch, setRawSearch] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerDto | null>(null);

  // Debounce search input 250ms and reset to page 1 when it changes.
  useEffect(() => {
    const id = window.setTimeout(() => {
      setSearch(rawSearch.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(id);
  }, [rawSearch]);

  const queryKey = useMemo(
    () => ['customers', { q: search, page }] as const,
    [search, page],
  );

  const query = useQuery({
    queryKey,
    queryFn: () =>
      fetch((token) =>
        listCustomers(token, {
          q: search || undefined,
          page,
          pageSize: PAGE_SIZE,
        }),
      ),
    placeholderData: (prev) => prev,
  });

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(c: CustomerDto) {
    setEditing(c);
    setModalOpen(true);
  }
  function closeModal() {
    setModalOpen(false);
    setEditing(null);
  }

  const data = query.data;
  const startIndex =
    data && data.items.length > 0 ? (data.page - 1) * data.pageSize + 1 : 0;
  const endIndex = data ? Math.min(data.page * data.pageSize, data.total) : 0;
  const totalLabel = data
    ? `${data.total.toLocaleString()} ${data.total === 1 ? 'customer' : 'customers'}`
    : '';

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Customers
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{totalLabel}</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="px-4 py-2 rounded-md font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm shadow-primary/30 inline-flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          New customer
        </button>
      </header>

      <div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            placeholder="Search by name, phone, or email…"
            value={rawSearch}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setRawSearch(e.target.value)
            }
            aria-label="Search customers"
            className="w-full rounded-md border border-border bg-card/60 pl-9 pr-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
          />
        </div>
      </div>

      {query.isPending && <CustomersSkeletonGrid />}

      {query.isError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 p-4"
        >
          <p className="font-medium text-destructive">Couldn't load customers</p>
          <p className="text-sm text-destructive/80 mt-1">
            {(() => {
              const err = query.error as unknown;
              if (err && typeof err === 'object' && 'message' in err) {
                return (err as { message: string }).message;
              }
              return query.error ? String(query.error) : 'Unknown error';
            })()}
          </p>
        </div>
      )}

      {data && data.items.length === 0 && !query.isPending && (
        <div className="rounded-lg border border-dashed border-border bg-card/40 p-12 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/15 text-primary flex items-center justify-center mb-4 ring-1 ring-primary/20">
            {search ? (
              <Search className="w-7 h-7" />
            ) : (
              <Users className="w-7 h-7" />
            )}
          </div>
          <p className="text-foreground font-semibold text-lg">
            {search
              ? `No matches for “${search}”`
              : 'Your customer list is empty'}
          </p>
          <p className="text-muted-foreground mt-2 text-sm max-w-md mx-auto leading-relaxed">
            {search
              ? 'Try a different name or phone, or clear the search to see all customers.'
              : 'Add your first customer to start tracking callers, jobs, and notes in one place.'}
          </p>
          {!search && (
            <button
              type="button"
              onClick={openCreate}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-md font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30"
            >
              <UserPlus className="w-4 h-4" />
              Add your first customer
            </button>
          )}
        </div>
      )}

      {data && data.items.length > 0 && (
        <>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.items.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => openEdit(c)}
                  className="w-full text-left rounded-lg border border-border bg-card/60 p-4 hover:border-primary/40 hover:bg-card transition cursor-pointer"
                >
                  <p className="font-semibold text-foreground">{c.name}</p>
                  <p className="text-sm text-foreground/90 font-mono mt-0.5">
                    {c.phone}
                  </p>
                  {c.email && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {c.email}
                    </p>
                  )}
                  {c.address && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {c.address}
                    </p>
                  )}
                </button>
              </li>
            ))}
          </ul>

          <nav
            className="flex items-center justify-between gap-2 pt-2"
            aria-label="Pagination"
          >
            <p className="text-sm text-muted-foreground">
              {startIndex > 0 ? `${startIndex}–${endIndex} of ${data.total}` : ''}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || query.isFetching}
                className="px-3 py-1.5 rounded-md text-sm text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Previous
              </button>
              <span className="text-sm text-foreground">
                Page {data.page} of {data.totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPage((p) => Math.min(data.totalPages, p + 1))
                }
                disabled={page >= data.totalPages || query.isFetching}
                className="px-3 py-1.5 rounded-md text-sm text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          </nav>
        </>
      )}

      <CustomerModal
        open={modalOpen}
        onClose={closeModal}
        editing={editing}
      />
    </div>
  );
}
