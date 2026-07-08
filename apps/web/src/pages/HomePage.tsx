import { Link } from 'react-router-dom';
import { SignedIn, SignedOut, SignUpButton } from '@clerk/clerk-react';

const features: Array<{ title: string; body: string }> = [
  {
    title: 'AI receptionist',
    body: 'Answers every call, captures customer details, and books the job — 24/7. No more missed after-hours calls.',
  },
  {
    title: 'Emergency detection',
    body: 'Flags floods, gas leaks, and other emergencies the moment your customer explains the problem.',
  },
  {
    title: 'Smart scheduling',
    body: 'Calendars that never double-book, optimised for travel time between jobs and worker availability.',
  },
  {
    title: 'Customer + jobs dashboard',
    body: 'Every customer call becomes a searchable record with full history, notes, and previous jobs.',
  },
];

const steps: Array<{ n: string; title: string; body: string }> = [
  {
    n: '01',
    title: 'Customer calls',
    body: 'The AI receptionist picks up, captures the problem, address, and timing preferences.',
  },
  {
    n: '02',
    title: 'AI extracts & books',
    body: 'The system reserves a slot, creates the customer and job records automatically.',
  },
  {
    n: '03',
    title: 'Dispatch + confirm',
    body: 'Notifications go out via SMS and email. Your dispatcher sees it in the dashboard.',
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50 via-white to-white"
        />
        <div className="px-6 py-20 md:py-28 max-w-5xl mx-auto text-center">
          <p className="inline-block px-3 py-1 text-xs font-medium tracking-wide uppercase rounded-full bg-brand-100 text-brand-800">
            For trade businesses · 1–10 workers
          </p>
          <h1 className="mt-6 text-4xl md:text-6xl font-bold tracking-tight text-stone-900">
            Never miss a call. <br className="hidden md:block" />
            Never double-book a job.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-stone-600 max-w-2xl mx-auto">
            FlowFix AI is the AI receptionist, scheduler, and operations dashboard for
            plumbing, electrical, and HVAC businesses.
          </p>

          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <SignedOut>
              <SignUpButton mode="modal">
                <button className="px-6 py-3 rounded-md font-medium text-white bg-brand-600 hover:bg-brand-700 transition-colors shadow-sm">
                  Get started
                </button>
              </SignUpButton>
              <a
                href="#how-it-works"
                className="px-6 py-3 rounded-md font-medium text-stone-700 hover:bg-stone-100 transition-colors"
              >
                How it works →
              </a>
            </SignedOut>
            <SignedIn>
              <Link
                to="/dashboard"
                className="px-6 py-3 rounded-md font-medium text-white bg-brand-600 hover:bg-brand-700 transition-colors shadow-sm"
              >
                Open dashboard
              </Link>
            </SignedIn>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-12 md:py-16 bg-white border-y border-stone-200">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold tracking-tight">What you get</h2>
          <p className="mt-2 text-stone-600 max-w-2xl">
            Everything a trade business needs to answer calls, schedule work, and keep
            customers happy — without doubling your admin.
          </p>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-5 rounded-lg border border-stone-200 bg-stone-50/60 hover:border-stone-300 hover:bg-white transition-colors"
              >
                <h3 className="font-semibold text-stone-900">{f.title}</h3>
                <p className="mt-1 text-sm text-stone-600">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-6 py-12 md:py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold tracking-tight">How a call becomes a job</h2>
          <ol className="mt-8 grid md:grid-cols-3 gap-6">
            {steps.map((s) => (
              <li
                key={s.n}
                className="rounded-lg border border-stone-200 bg-white p-6"
              >
                <span className="text-xs font-mono font-semibold text-brand-700">
                  {s.n}
                </span>
                <h3 className="mt-2 font-semibold text-stone-900">{s.title}</h3>
                <p className="mt-1 text-sm text-stone-600">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="px-6 py-12 md:py-16 bg-stone-900 text-stone-100">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Ready to stop missing calls?
          </h2>
          <p className="mt-3 text-stone-400">
            Set up takes 10 minutes. No credit card needed during development.
          </p>
          <SignedOut>
            <SignUpButton mode="modal">
              <button className="mt-6 inline-flex px-6 py-3 rounded-md font-medium text-stone-900 bg-stone-100 hover:bg-white transition-colors">
                Create your free account
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link
              to="/dashboard"
              className="mt-6 inline-flex px-6 py-3 rounded-md font-medium text-stone-900 bg-stone-100 hover:bg-white transition-colors"
            >
              Open dashboard
            </Link>
          </SignedIn>
        </div>
      </section>
    </>
  );
}
