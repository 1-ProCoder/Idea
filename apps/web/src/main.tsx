import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider } from '@clerk/clerk-react';

import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

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
        <li>Restart <code>npm run dev</code> from the project root.</li>
      </ol>
      <p style={{ color: '#78716c', marginTop: '1.5rem', fontSize: '0.875rem' }}>
        See the project <code>README.md</code> for full setup steps, including getting a
        free Clerk dev account.
      </p>
    </main>
  );
}

function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
}

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('#root element not found');

createRoot(rootEl).render(
  <StrictMode>
    {clerkPublishableKey ? (
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
