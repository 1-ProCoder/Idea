import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider } from '@clerk/clerk-react';

import App from './App';
import './index.css';
import { ToastProvider } from './components/ui/Toast';

// Vendor-noise filter — `@clerk/clerk-react` v4 prints
// `[DEFAULT]: WARN : Using DEFAULT root logger` once on first mount when
// no logger is configured for the SDK. It's a benign dev-only warning
// that doesn't affect functionality but shows in every browser console.
// Filter at the source while preserving every other warning so real
// issues stay visible. Remove this block once Clerk ships a fix (or
// you start configuring a real logger).
if (typeof console !== 'undefined' && typeof console.warn === 'function') {
  const originalWarn = console.warn.bind(console);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  console.warn = function filterClerkDefaultLogger(...args: any[]): void {
    const first = args[0];
    if (
      typeof first === 'string' &&
      first.toLowerCase().includes('using default root logger')
    ) {
      return;
    }
    originalWarn(...args);
  };
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as
  | string
  | undefined;

function isValidClerkPublishableKey(key: string | undefined): key is string {
  if (!key) return false;
  return /^pk_(test|live)_[A-Za-z0-9_-]{20,}$/.test(key);
}

function MissingEnvScreen() {
  return (
    <main
      style={{
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        maxWidth: '40rem',
        margin: '4rem auto',
        padding: '2rem',
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid #e7e5e4',
      }}
    >
      <h1 style={{ fontSize: '1.75rem', fontWeight: 600 }}>FlowFix AI</h1>
      <h2 style={{ fontSize: '1.1rem', marginTop: '1.5rem' }}>
        Set up your environment to continue
      </h2>
      <p style={{ color: '#57534e', marginTop: '0.75rem' }}>
        The web app couldn't find <code>VITE_CLERK_PUBLISHABLE_KEY</code>.
      </p>
      <ol style={{ marginTop: '1rem', paddingLeft: '1.25rem', color: '#57534e' }}>
        <li style={{ marginBottom: '0.5rem' }}>
          Copy <code>apps/web/.env.example</code> to <code>apps/web/.env</code>.
        </li>
        <li style={{ marginBottom: '0.5rem' }}>
          Paste your Clerk <em>Publishable Key</em> (starts with{' '}
          <code>pk_test_…</code>).
        </li>
        <li>
          Restart <code>npm run dev</code> from the project root.
        </li>
      </ol>
      <p style={{ color: '#78716c', marginTop: '1.5rem', fontSize: '0.875rem' }}>
        See the project <code>README.md</code> for full setup steps, including
        getting a free Clerk dev account.
      </p>
    </main>
  );
}

/**
 * `Providers` mounts everything that should be available to the entire
 * app, in dependency order:
 *   1. ToastProvider — global toast bus (mounted high so toast stack
 *      portals on top of routes).
 *   2. QueryClientProvider — React Query cache.
 *   3. BrowserRouter — react-router.
 *
 * Demo mode was removed entirely; signed-out users land on the marketing
 * homepage and are routed through `<RedirectToSignIn>` when they try to
 * enter any dashboard route. All dashboard pages fetch from the live API
 * via Clerk-authenticated `useAuthedFetch` and render `<EmptyState>` when
 * the account has no data.
 */
function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    </ToastProvider>
  );
}

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('#root element not found');

createRoot(rootEl).render(
  <StrictMode>
    {isValidClerkPublishableKey(clerkPublishableKey) ? (
      <ClerkProvider publishableKey={clerkPublishableKey}>
        <Providers>
          <App />
        </Providers>
      </ClerkProvider>
    ) : (
      <Providers>
        <MissingEnvScreen />
      </Providers>
    )}
  </StrictMode>,
);
