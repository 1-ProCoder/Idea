import { Navigate } from 'react-router-dom';

/**
 * `/sign-up` is now an alias for `/waitlist`. See SignInPage for the
 * reasoning; both flow back to the same email-entry form.
 */
export default function SignUpPage() {
  return <Navigate to="/waitlist" replace />;
}
