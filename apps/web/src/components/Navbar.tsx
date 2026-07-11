import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/clerk-react';
import {
  Calendar,
  Command as CommandIcon,
  LayoutDashboard,
  PhoneCall,
  Search,
  Settings as SettingsIcon,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react';

import { CommandMenu } from './ui/CommandMenu';
import { NotificationBell } from './NotificationBell';
import Logo from './brand/Logo';

type NavDef = {
  key: string;
  label: string;
  icon: LucideIcon;
  route: string;
  shortcut: string;
};

const NAV: NavDef[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    route: '/dashboard',
    shortcut: '⌘1',
  },
  { key: 'calls', label: 'Calls', icon: PhoneCall, route: '/calls', shortcut: '⌘2' },
  {
    key: 'technicians',
    label: 'Technicians',
    icon: Users,
    route: '/technicians',
    shortcut: '⌘3',
  },
  {
    key: 'schedule',
    label: 'Schedule',
    icon: Calendar,
    route: '/schedule',
    shortcut: '⌘4',
  },
  {
    key: 'ai-receptionist',
    label: 'AI Receptionist',
    icon: Sparkles,
    route: '/ai-receptionist',
    shortcut: '⌘5',
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: SettingsIcon,
    route: '/settings',
    shortcut: '⌘6',
  },
];

function activeKeyForPath(pathname: string): string {
  if (pathname.startsWith('/dashboard')) return 'dashboard';
  if (pathname.startsWith('/calls')) return 'calls';
  if (pathname.startsWith('/technicians')) return 'technicians';
  if (pathname.startsWith('/schedule')) return 'schedule';
  if (pathname.startsWith('/ai-receptionist')) return 'ai-receptionist';
  if (pathname.startsWith('/settings')) return 'settings';
  return '';
}

function SignedInDesktopNav({
  activeKey,
}: {
  activeKey: string;
}): JSX.Element {
  return (
    <nav
      aria-label="Primary"
      className="hidden lg:flex items-center gap-1 text-sm"
    >
      {NAV.map(({ key, label, icon: Icon, route, shortcut }) => {
        const isActive = activeKey === key;
        return (
          <NavLink
            key={key}
            to={route}
            title={`${label} (${shortcut})`}
            className={[
              'group relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-medium transition-all duration-200',
              isActive
                ? 'text-foreground bg-white/[0.04] ring-1 ring-white/[0.06] scale-[1.02]'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]',
            ].join(' ')}
          >
            <Icon
              className={[
                'w-4 h-4 transition-colors',
                isActive ? 'text-primary' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            />
            {label}
            {isActive && (
              <span
                aria-hidden
                className="absolute inset-x-3.5 -bottom-[5px] h-[2px] rounded-full bg-gradient-to-r from-primary via-accent to-primary"
              />
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}

function SignedInMobileTabBar({
  activeKey,
}: {
  activeKey: string;
}): JSX.Element {
  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden flex justify-around items-center border-t border-white/[0.08] bg-background/60 backdrop-blur-2xl backdrop-saturate-150 py-2 px-2"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      {NAV.map(({ key, label, icon: Icon, route }) => {
        const isActive = activeKey === key;
        return (
          <NavLink
            key={key}
            to={route}
            aria-label={label}
            className={[
              'flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-lg transition-colors min-w-[3.5rem]',
              isActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-semibold tracking-wider uppercase">
              {label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}

export default function Navbar(): JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const activeKey = activeKeyForPath(location.pathname);
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen(true);
        return;
      }
      if (isMeta && ['1', '2', '3', '4', '5', '6'].includes(e.key)) {
        e.preventDefault();
        const idx = Number(e.key) - 1;
        const target = NAV[idx];
        if (target) navigate(target.route);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  return (
    <>
      {/*
        Top nav: 100% transparent background + heavy backdrop blur so
        content melts underneath as the user scrolls. No border (the brief
        says "no harsh section breaks"). The active-link gradient underline
        is still rendered.
      */}
      <header
        className="sticky top-0 z-30 bg-transparent backdrop-blur-2xl backdrop-saturate-150"
        style={{ height: 72 }}
      >
        <div className="h-full max-w-[1600px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 group"
            aria-label="FlowFix AI home"
          >
            <Logo size={36} withWordmark withSubtitle />
          </Link>

          <SignedIn>
            <SignedInDesktopNav activeKey={activeKey} />
          </SignedIn>

          <div className="flex items-center gap-2">
            <SignedIn>
              <button
                type="button"
                onClick={() => setCommandOpen(true)}
                aria-label="Open command menu (⌘K)"
                className="hidden md:flex items-center gap-2 h-9 pl-2.5 pr-2 rounded-lg glass-blend text-sm text-muted-foreground hover:text-foreground transition-colors min-w-[180px] lg:min-w-[220px]"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="flex-1 text-left">Search...</span>
                <kbd className="inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded border border-white/[0.08] bg-white/[0.04]">
                  <CommandIcon className="w-2.5 h-2.5" />K
                </kbd>
              </button>
              <button
                type="button"
                onClick={() => setCommandOpen(true)}
                aria-label="Open command menu (⌘K)"
                className="md:hidden w-9 h-9 rounded-lg glass-blend flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <Search className="w-4 h-4" />
              </button>
              <NotificationBell />
            </SignedIn>

            <SignedOut>
              <SignInButton mode="modal">
                <button className="btn-organic px-3.5 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="btn-organic px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground shadow-sm shadow-primary/30">
                  Start Free Trial
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox:
                      'w-8 h-8 ring-2 ring-primary/40 hover:ring-primary/60 transition-all',
                  },
                }}
              />
            </SignedIn>
          </div>
        </div>
      </header>

      <SignedIn>
        <SignedInMobileTabBar activeKey={activeKey} />
      </SignedIn>

      <CommandMenu open={commandOpen} onClose={() => setCommandOpen(false)} />
    </>
  );
}
