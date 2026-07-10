import { Navigate } from 'react-router-dom';

/**
 * `/settings` is just a lander — the real shell lives at `SettingsLayout`
 * which renders the sidebar + Outlet, and `/settings/general` is the
 * default landing page inside it.
 */
export default function SettingsPage(): JSX.Element {
  return <Navigate to="/settings/general" replace />;
}
