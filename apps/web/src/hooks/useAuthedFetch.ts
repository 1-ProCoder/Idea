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
 * to the Express backend.
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
