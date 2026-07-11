import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { ArrowLeft, Compass } from 'lucide-react';

import { CanvasBackdrop } from './components/ui/CanvasBackdrop';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import WaitlistPage from './pages/WaitlistPage';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import CallsPage from './pages/CallsPage';
import TechniciansPage from './pages/TechniciansPage';
import SchedulePage from './pages/SchedulePage';
import SettingsPage from './pages/SettingsPage';
import ListPage from './pages/ListPage';
import ListNewPage from './pages/ListNewPage';
import { SettingsLayout } from './components/layout/SettingsLayout';

import GeneralSettings from './pages/settings/GeneralSettings';
import CompanySettings from './pages/settings/CompanySettings';
import TeamSettings from './pages/settings/TeamSettings';
import AIReceptionistSettings from './pages/settings/AIReceptionistSettings';
import NotificationsSettings from './pages/settings/NotificationsSettings';
import IntegrationsSettings from './pages/settings/IntegrationsSettings';
import BillingSettings from './pages/settings/BillingSettings';
import SecuritySettings from './pages/settings/SecuritySettings';

export default function App() {
  const location = useLocation();
  // Hide the global app Navbar on marketing and auth screens so the
  // homepage's own marketing header is the SOLE header for signed-out
  // users, and Clerk's sign-in/sign-up screens stay clean. The `/`
  // redirect for signed-in users (below) ensures they always land on
  // a protected route where this Navbar is the sole header.
  const isMarketingOrAuthRoute =
    location.pathname === '/' ||
    location.pathname.startsWith('/sign-in') ||
    location.pathname.startsWith('/sign-up');

  return (
    <div className="min-h-screen flex flex-col text-foreground">
      <CanvasBackdrop />
      {!isMarketingOrAuthRoute && <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <SignedIn>
                  <Navigate to="/dashboard" replace />
                </SignedIn>
                <SignedOut>
                  <HomePage />
                </SignedOut>
              </>
            }
          />
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
          <Route path="/waitlist" element={<WaitlistPage />} />
          <Route
            path="/dashboard"
            // Public for signed-out visitors — the landing page's
            // "Open the demo" CTA takes them straight here, where the
            // page renders seeded demo data from the shared demo
            // business.
            element={<DashboardPage />}
          />
          <Route path="/calls" element={<CallsPage />} />
          <Route path="/technicians" element={<TechniciansPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/list" element={<ListPage />} />
          <Route path="/list/new" element={<ListNewPage />} />
          <Route path="/settings/:section" element={<SettingsLayout />}>
            <Route index element={<GeneralSettings />} />
            <Route path="general" element={<GeneralSettings />} />
            <Route path="company" element={<CompanySettings />} />
            <Route path="team" element={<TeamSettings />} />
            <Route
              path="ai-receptionist"
              element={<AIReceptionistSettings />}
            />
            <Route
              path="notifications"
              element={<NotificationsSettings />}
            />
            <Route path="integrations" element={<IntegrationsSettings />} />
            <Route path="billing" element={<BillingSettings />} />
            <Route path="security" element={<SecuritySettings />} />
            <Route
              path="*"
              element={
                <div className="glass-card rounded-2xl p-10 text-center">
                  <p className="text-foreground font-semibold">
                    Unknown settings section
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Pick a section from the sidebar.
                  </p>
                </div>
              }
            />
          </Route>
          <Route
            path="/customers"
            // Public for signed-out visitors — the page is read-only
            // for guests. Write actions (Create / Edit / Delete) are
            // still POST/PATCH/DELETE-auth-gated on the backend, so
            // guests see the listing but the New / Edit modals
            // 401 if they try to submit.
            element={<CustomersPage />}
          />
          <Route
            path="*"
            element={
              <div className="relative max-w-xl mx-auto px-6 py-24 text-center overflow-hidden">
                <div
                  aria-hidden
                  className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-primary/5 to-transparent"
                />
                <div
                  aria-hidden
                  className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full bg-primary/10 blur-[120px] -z-10"
                />
                <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/15 text-primary flex items-center justify-center mb-6 ring-1 ring-primary/30 shadow-lg shadow-primary/20">
                  <Compass className="w-10 h-10" />
                </div>
                <p className="text-xs font-mono uppercase tracking-[0.3em] text-primary mb-2">
                  Off the map
                </p>
                <h1 className="text-6xl font-bold tracking-tight bg-gradient-to-br from-foreground via-foreground to-foreground/40 bg-clip-text text-transparent">
                  404
                </h1>
                <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
                  There's no route registered for this URL. The page may have
                  moved, or it was never built.
                </p>
                <div className="mt-8 inline-flex items-center gap-3">
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Take me home
                  </Link>
                </div>
              </div>
            }
          />
        </Routes>
      </main>
      <footer className="border-t border-white/[0.06] bg-card/40">
        <div className="max-w-6xl mx-auto px-6 py-4 text-sm text-muted-foreground flex flex-wrap justify-between gap-2">
          <span>FlowFix AI · Premium dashboard · Live data via Postgres + Prisma</span>
          <a
            href="https://github.com/1-ProCoder/Idea"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground transition-colors"
          >
            github.com/1-ProCoder/Idea
          </a>
        </div>
      </footer>
    </div>
  );
}
