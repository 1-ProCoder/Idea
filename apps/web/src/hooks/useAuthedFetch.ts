import { useAuth } from '@clerk/clerk-react';
import { useCallback } from 'react';

/**
 * Wrapper for any API call that needs a Clerk session JWT.
 *
 * Returns a stable callback that:
 *   1. resolves a fresh Clerk session token (`skipCache: true` so we never
 *      accidentally serve a stale token),
 *   2. passes it to the caller-supplied `fn(token)` so the actual fetch can
 *      stick it in the Authorization header.
 *
 * Use this wherever a TanStack Query `queryFn` or `mutationFn` needs to talk
 * to the Express backend. Throws "Not authenticated" if there is no active
 * Clerk session — i.e. this is for routes that are still auth-gated.
 */
export function useAuthedFetch() {
  const { getToken } = useAuth();
  return useCallback(
    async <T>(fn: (token: string) => Promise<T>): Promise<T> => {
      const token = await getToken({ skipCache: true });
      if (!token) {
        throw new Error('Not authenticated');
      }
      return fn(token);
    },
    [getToken],
  );
}

/**
 * Same shape as `useAuthedFetch`, but tolerates a missing Clerk session:
 * when the visitor is signed out, `fn` is invoked with `token: null` and
 * the caller is responsible for *not* sending an Authorization header.
 * Used by routes that have been intentionally opened up to demo traffic
 * (e.g. /api/dashboard/stats, /api/business, /api/calls) so signed-out
 * visitors browsing the landing page's "Open the demo" CTA land on a
 * working dashboard backed by the shared demo business.
 *
 * If the API client is called with a `null` token, the API will treat
 * the request as anonymous and resolve the shared demo business. If
 * the user *is* signed in, the resolved Clerk JWT is forwarded as
 * usual and the user sees their own business's data.
 */
export function useOptionalFetch() {
  const { getToken } = useAuth();
  return useCallback(
    async <T>(fn: (token: string | null) => Promise<T>): Promise<T> => {
      // Clerk's `getToken()` returns `null` (does not throw) when the
      // visitor has no active session. We forward `null` straight
      // through to the caller, which is responsible for *not* sending
      // an Authorization header in that case.
      const token = (await getToken({ skipCache: true })) ?? null;
      return fn(token);
    },
    [getToken],
  );
}
