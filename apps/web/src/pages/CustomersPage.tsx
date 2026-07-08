import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useAuthedFetch } from '../hooks/useAuthedFetch';
import {
  listCustomers,
  type ApiError,
  type CustomerDto,
} from '../lib/api-customers';
import CustomerModal from '../components/CustomerModal';

const PAGE_SIZE = 20;

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
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">
            Customers
          </h1>
          <p className="text-stone-500 text-sm mt-1">{totalLabel}</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="px-4 py-2 rounded-md font-medium text-white bg-brand-600 hover:bg-brand-700 transition-colors shadow-sm"
        >
          + New customer
        </button>
      </header>

      <div>
        <input
          type="search"
          placeholder="Search by name, phone, or email…"
          value={rawSearch}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setRawSearch(e.target.value)
          }
          aria-label="Search customers"
          className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
        />
      </div>

      {query.isPending && (
        <p className="text-stone-500">Loading customers…</p>
      )}

      {query.isError && (
        <div
          role="alert"
          className="rounded-md border border-rose-200 bg-rose-50 p-4"
        >
          <p className="font-medium text-rose-800">Couldn't load customers</p>
          <p className="text-sm text-rose-700 mt-1">
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

      {data && data.items.length === 0 && (
        <div className="rounded-md border border-stone-200 bg-white p-10 text-center">
          <p className="text-stone-700 font-medium">No customers yet</p>
          <p className="text-stone-500 text-sm mt-1">
            {search
              ? `No matches for "${search}".`
              : 'Click "+ New customer" to add your first one.'}
          </p>
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
                  className="w-full text-left rounded-lg border border-stone-200 bg-white p-4 hover:border-stone-300 hover:shadow-sm transition cursor-pointer"
                >
                  <p className="font-semibold text-stone-900">{c.name}</p>
                  <p className="text-sm text-stone-700 font-mono mt-0.5">
                    {c.phone}
                  </p>
                  {c.email && (
                    <p className="text-xs text-stone-500 mt-1 truncate">
                      {c.email}
                    </p>
                  )}
                  {c.address && (
                    <p className="text-xs text-stone-500 mt-1 line-clamp-1">
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
            <p className="text-sm text-stone-500">
              {startIndex > 0 ? `${startIndex}–${endIndex} of ${data.total}` : ''}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || query.isFetching}
                className="px-3 py-1.5 rounded-md text-sm text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <span className="text-sm text-stone-700">
                Page {data.page} of {data.totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPage((p) => Math.min(data.totalPages, p + 1))
                }
                disabled={page >= data.totalPages || query.isFetching}
                className="px-3 py-1.5 rounded-md text-sm text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed"
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
