import type { ReactNode } from 'react';
import { Routes, Route } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';

import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import JobsPage from './pages/JobsPage';
import CalendarPage from './pages/CalendarPage';

function Protected({ children }: { children: ReactNode }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
          <Route
            path="/dashboard"
            element={
              <Protected>
                <DashboardPage />
              </Protected>
            }
          />
          <Route
            path="/customers"
            element={
              <Protected>
                <CustomersPage />
              </Protected>
            }
          />
          <Route
            path="/jobs"
            element={
              <Protected>
                <JobsPage />
              </Protected>
            }
          />
          <Route
            path="/calendar"
            element={
              <Protected>
                <CalendarPage />
              </Protected>
            }
          />
          <Route
            path="*"
            element={
              <div className="max-w-xl mx-auto px-6 py-20 text-center">
                <h1 className="text-3xl font-bold">404</h1>
                <p className="text-stone-500 mt-2">Page not found.</p>
              </div>
            }
          />
        </Routes>
      </main>
      <footer className="border-t border-stone-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 text-sm text-stone-500 flex flex-wrap justify-between gap-2">
          <span>FlowFix AI · Milestone 1</span>
          <a
            href="https://github.com/1-ProCoder/Idea"
            target="_blank"
            rel="noreferrer"
            className="hover:text-stone-700"
          >
            github.com/1-ProCoder/Idea
          </a>
        </div>
      </footer>
    </div>
  );
}
