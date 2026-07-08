import { Link, NavLink } from 'react-router-dom';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/clerk-react';

const navLinks: Array<{ to: string; label: string }> = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/customers', label: 'Customers' },
  { to: '/jobs', label: 'Jobs' },
  { to: '/calendar', label: 'Calendar' },
];

export default function Navbar() {
  return (
    <header className="border-b border-stone-200 bg-white sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="font-semibold text-lg text-brand-700 flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block w-6 h-6 rounded-md bg-gradient-to-br from-brand-500 to-brand-700"
          />
          FlowFix AI
        </Link>

        <SignedIn>
          <nav className="hidden sm:flex gap-1 text-sm">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [
                    'px-3 py-1.5 rounded-md transition-colors',
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100',
                  ].join(' ')
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </SignedIn>

        <div className="flex items-center gap-2">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-3 py-1.5 rounded-md text-sm font-medium text-stone-700 hover:bg-stone-100">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="px-3 py-1.5 rounded-md text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 transition-colors">
                Sign up
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
