import { Navigate } from 'react-router-dom';

/**
 * `/sign-in` is now just an alias for `/waitlist`. There is no
 * Credential auth flow in this build \u2014 prospective users sign up via
 * `POST /api/waitlist` and the operator approves them manually.
 * Keeping the route mounted preserves old marketing links and
 * browser bookmarks; the page body is a single redirect.
 */
export default function SignInPage() {
  return <Navigate to="/waitlist" replace />;
}
