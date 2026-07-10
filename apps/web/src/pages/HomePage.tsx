import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarClock,
  Check,
  Lock,
  MapPin,
  Mic,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Wrench,
  Zap,
} from 'lucide-react';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
} from '@clerk/clerk-react';

import Logo from '../components/brand/Logo';

// Inline icon used in the hero — short, premium.

const HERO_BADGE = ['AI Receptionist', '24/7'];

const FEATURES = [
  {
    icon: PhoneCall,
    title: 'Auto-answer every call',
    body: 'A trained AI receptionist picks up in under 2 rings, captures the customer, and triages the issue.',
  },
  {
    icon: CalendarClock,
    title: 'Book jobs in seconds',
    body: 'Real-time availability, customer history, and technician specialism — booked before the call ends.',
  },
  {
    icon: MapPin,
    title: 'Dispatch the right tech',
    body: 'Distance, specialism, and current load factored in. Optimal routing with one tap.',
  },
  {
    icon: ShieldCheck,
    title: 'No double-bookings',
    body: 'Concurrent bookings and last-minute changes handled gracefully. Customers always get a single source of truth.',
  },
];

const STEPS = [
  {
    title: 'Connect your number',
    body: 'Forward your calls to FlowFix in 30 seconds — keep your existing number.',
  },
  {
    title: 'Train it on your business',
    body: 'Services, hours, specialities, pricing. The AI already knows plumbing, electrical, and HVAC by default.',
  },
  {
    title: 'Take back your evenings',
    body: 'The AI handles intake, dispatch, and reminders — you handle the work.',
  },
];

const SERVED_TRADES = ['Plumbing', 'Electrical', 'HVAC', 'Heating', 'Boiler service', 'Drainage'];

export default function HomePage(): JSX.Element {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background — radial gradient + grid + soft glows */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[#030712]"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage:
            'radial-gradient(circle at 50% 30%, black 0%, black 60%, transparent 85%)',
          WebkitMaskImage:
            'radial-gradient(circle at 50% 30%, black 0%, black 60%, transparent 85%)',
        }}
      />
      <div
        aria-hidden
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[560px] -z-10 rounded-full opacity-50"
        style={{
          background:
            'radial-gradient(circle at 40% 40%, rgba(59,130,246,0.25), transparent 65%)',
          filter: 'blur(80px)',
        }}
      />
      <div
        aria-hidden
        className="absolute top-[40%] right-[-10%] w-[640px] h-[640px] -z-10 rounded-full opacity-40"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(139,92,246,0.22), transparent 60%)',
          filter: 'blur(90px)',
        }}
      />

      {/* Top header */}
      <header className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-6 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center group">
          <Logo size={36} withWordmark withSubtitle />
        </Link>
        <div className="flex items-center gap-2">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-3.5 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/30 hover:shadow-primary/50 transition-all">
                Start Free Trial
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link
              to="/dashboard"
              className="px-3.5 py-2 rounded-lg text-sm font-medium bg-primary/15 text-primary ring-1 ring-primary/30 hover:bg-primary/25 transition-colors inline-flex items-center gap-1.5"
            >
              Open dashboard
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </SignedIn>
        </div>
      </header>

      {/* Hero — single viewport */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 lg:pt-24 pb-16 lg:pb-24 min-h-[calc(100vh-72px)] flex items-center">
        <div className="grid lg:grid-cols-2 gap-10 items-center w-full">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/15 text-primary ring-1 ring-primary/30 animate-[pulse_2.4s_ease-in-out_infinite]">
              <Mic className="w-3 h-3" />
              {HERO_BADGE.join(' · ')}
            </span>
            <h1 className="mt-6 text-4xl sm:text-5xl xl:text-7xl font-extrabold tracking-tight text-foreground leading-[1.05]">
              Never miss a call.
              <br />
              <span
                className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent"
              >
                Never double-book.
              </span>
            </h1>
            <p className="mt-5 text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed">
              AI receptionist for plumbing, electrical, and HVAC companies.
              Answer every call, automatically book jobs, and dispatch
              technicians in seconds.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <SignedOut>
                <SignUpButton mode="modal">
                  <button className="inline-flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:bg-primary/95 active:translate-y-px transition-all">
                    <Sparkles className="w-4 h-4" />
                    Start Free Trial
                  </button>
                </SignUpButton>
                <a
                  href="#how-it-works"
                  className="hidden sm:inline-flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-sm text-muted-foreground hover:text-foreground glass-card transition-colors"
                >
                  Watch 90-sec demo
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </SignedOut>
              <SignedIn>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all"
                >
                  Continue to dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </SignedIn>
            </div>

            {/* Trust line */}
            <div className="mt-7 flex items-center gap-3 text-sm">
              <div className="flex items-center text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                    key={i}
                    viewBox="0 0 20 20"
                    className="w-4 h-4 fill-current"
                    aria-hidden
                  >
                    <path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.2 1.3 6L10 14.9 4.6 18l1.3-6L1.3 7.7l6.1-.6L10 1.5z" />
                  </svg>
                ))}
              </div>
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">
                  Trusted by 250+ plumbing, electrical & HVAC businesses.
                </span>{' '}
                · 12,000+ missed calls prevented this year.
              </p>
            </div>
          </div>

          {/* Right: floating product preview cards */}
          <div className="relative hidden lg:block">
            <PreviewCardStack />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="glass-card rounded-2xl p-5 hover:bg-white/[0.06] transition-colors"
            >
              <span className="inline-flex w-10 h-10 rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30 items-center justify-center">
                <f.icon className="w-5 h-5" />
              </span>
              <p className="mt-4 text-sm font-semibold text-foreground">
                {f.title}
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20"
      >
        <div className="max-w-2xl mb-12">
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-primary mb-2">
            How it works
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            From missed call to completed job in three steps.
          </h2>
        </div>
        <ol className="grid lg:grid-cols-3 gap-4">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="glass-card rounded-2xl p-6 relative"
            >
              <span className="text-5xl font-extrabold bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="mt-2 text-base font-semibold text-foreground">
                {step.title}
              </p>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* Trade chips + footer CTA */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="flex items-center justify-center gap-2 flex-wrap mb-10">
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mr-2">
            Built for:
          </span>
          {SERVED_TRADES.map((t) => (
            <span
              key={t}
              className="px-3 py-1 rounded-full text-sm glass-card text-foreground font-medium"
            >
              {t}
            </span>
          ))}
        </div>

        <div className="relative glass-card-strong rounded-2xl p-10 text-center overflow-hidden">
          <div
            aria-hidden
            className="absolute -top-20 left-1/2 -translate-x-1/2 w-[680px] h-[300px] rounded-full bg-primary/10 blur-3xl"
          />
          <Zap className="w-8 h-8 mx-auto text-primary" />
          <h3 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Stop losing calls today.
          </h3>
          <p className="mt-2 text-muted-foreground">
            No credit card. Set up in 2 minutes.
          </p>
          <div className="mt-6 inline-flex items-center gap-3 flex-wrap justify-center">
            <SignedOut>
              <SignUpButton mode="modal">
                <button className="inline-flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all">
                  <Sparkles className="w-4 h-4" />
                  Start Free Trial
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all"
              >
                Continue to dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            </SignedIn>
            <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
              <Lock className="w-3 h-3" />
              SSL · GDPR · CCPA
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

function PreviewCardStack(): JSX.Element {
  return (
    <div className="relative h-[420px]">
      <FloatingCard
        className="absolute top-2 left-4 w-[280px]"
        delay={0}
      >
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          Incoming call
        </p>
        <p className="mt-1 text-base font-semibold text-foreground">
          Sarah Mitchell
        </p>
        <p className="text-xs font-mono text-muted-foreground">
          (555) 234-8910
        </p>
        <p className="mt-3 text-sm text-foreground/90 leading-relaxed">
          "Burst pipe in kitchen, water leaking. Need an emergency visit today."
        </p>
        <div className="mt-3 flex items-center gap-2">
          <Wrench className="w-3.5 h-3.5 text-danger" />
          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-danger/15 text-danger ring-1 ring-danger/30">
            Emergency
          </span>
          <span className="text-[10px] text-muted-foreground ml-auto font-mono">
            02:18
          </span>
        </div>
      </FloatingCard>

      <FloatingCard
        className="absolute top-44 right-2 w-[260px]"
        delay={1.5}
      >
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Booking
          </p>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-success/15 text-success ring-1 ring-success/30">
            Scheduled
          </span>
        </div>
        <p className="mt-1 text-base font-semibold text-foreground">14:30</p>
        <p className="text-xs text-muted-foreground">Mitchell — Pipe repair</p>
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-[10px] font-bold text-primary-foreground">
            JM
          </span>
          <span className="text-foreground/90">James M. · 0.8 mi away</span>
        </div>
      </FloatingCard>

      <FloatingCard
        className="absolute bottom-2 left-12 w-[320px]"
        delay={3}
      >
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          Dispatch timeline
        </p>
        <ol className="mt-3 space-y-3">
          {[
            { label: 'Call answered', state: 'done' },
            { label: 'Customer triaged', state: 'done' },
            { label: 'Tech dispatched', state: 'active' },
            { label: 'On-site', state: 'pending' },
          ].map((step, i) => (
            <li key={step.label} className="flex items-center gap-2">
              <span
                className={
                  step.state === 'active'
                    ? 'w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.7)] animate-pulse'
                    : step.state === 'done'
                      ? 'w-2 h-2 rounded-full bg-success'
                      : 'w-2 h-2 rounded-full bg-muted-foreground/40'
                }
              />
              <span className="text-xs text-foreground/90 flex-1">
                {step.label}
              </span>
              {i === 2 && (
                <span className="text-[10px] font-mono text-muted-foreground">
                  ETA 4 min
                </span>
              )}
            </li>
          ))}
        </ol>
        <div className="mt-4 flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5 text-success" />
          <span className="text-xs text-success">AI summary ready</span>
        </div>
      </FloatingCard>
    </div>
  );
}

function FloatingCard({
  children,
  className,
  delay,
}: {
  children: React.ReactNode;
  className?: string;
  delay: number;
}): JSX.Element {
  return (
    <div
      className={[
        'glass-card-strong rounded-2xl p-4 shadow-2xl shadow-black/40',
        'animate-[float_6s_ease-in-out_infinite]',
        className ?? '',
      ].join(' ')}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}
