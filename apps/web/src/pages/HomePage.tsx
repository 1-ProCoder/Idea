import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ComponentType, JSX } from 'react';
import {
  ArrowRight,
  CalendarClock,
  ChevronDown,
  Clock,
  Lock,
  MapPin,
  PhoneCall,
  PhoneIncoming,
  ShieldCheck,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Logo from '../components/brand/Logo';
import { Hero } from '../components/landing/Hero';
import { SectionLabel } from '../components/landing/SectionLabel';
import { AmbientGlow } from '../components/landing/AmbientGlow';
import { Marquee } from '../components/landing/Marquee';
import { GlassPanel } from '../components/landing/GlassPanel';
import { PublicActivityStream } from '../components/landing/PublicActivityStream';


const SERVED_TRADES = [
  'Plumbing',
  'Electrical',
  'HVAC',
  'Heating',
  'Boiler',
  'Drainage',
];

const TRUST_ROW = [
  { icon: Sparkles, label: 'Setup in 2 minutes' },
  { icon: PhoneCall, label: 'Keep your existing number' },
  { icon: ShieldCheck, label: 'Audit log of every call' },
  { icon: Zap, label: 'Forwards from any carrier' },
];

type FeatureTile = {
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
  decoration:
    | 'waveform'
    | 'calendar'
    | 'map'
    | 'timeline'
    | 'clock'
    | 'bars';
};

const FEATURES: FeatureTile[] = [
  {
    icon: PhoneIncoming,
    title: 'Auto-answer every call',
    body: 'A trained AI receptionist picks up in under 2 rings, captures the customer, and triages the issue straight into your CRM.',
    decoration: 'waveform',
  },
  {
    icon: CalendarClock,
    title: 'Book jobs in seconds',
    body: 'Real-time availability + customer history — booked before the call ends.',
    decoration: 'calendar',
  },
  {
    icon: MapPin,
    title: 'Dispatch the nearest tech',
    body: 'Distance, specialism, and current load factored in. Optimal routing with one tap.',
    decoration: 'map',
  },
  {
    icon: ShieldCheck,
    title: 'No double-bookings',
    body: 'Concurrent jobs + last-minute changes handled gracefully.',
    decoration: 'timeline',
  },
  {
    icon: Clock,
    title: 'Always-on coverage',
    body: '24/7/365 answering — even holidays.',
    decoration: 'clock',
  },
  {
    icon: Sparkles,
    title: 'Live, full-fidelity dashboard',
    body: 'Every call transcribed. Every dispatch logged.',
    decoration: 'bars',
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

const TESTIMONIALS = [
  {
    name: 'Eleanor Voss',
    biz: 'Voss & Sons Plumbing',
    loc: 'Portland, OR',
    rating: 5,
    quote:
      'Replaced my 24/7 answering service in a week. James gets every job before lunch.',
  },
  {
    name: 'Marcus Kim',
    biz: 'Bright Circuit Electric',
    loc: 'San Jose, CA',
    rating: 4.5,
    quote: 'We stopped losing emergency calls. Period.',
  },
  {
    name: 'Ramón De La Cruz',
    biz: 'Cruz HVAC',
    loc: 'Austin, TX',
    rating: 5,
    quote:
      'Customers now book themselves at 11pm. I wake up to a full schedule.',
  },
  {
    name: 'Priya Shah',
    biz: 'Shah Heating & Boiler',
    loc: 'Boston, MA',
    rating: 4.5,
    quote:
      'The dispatch timeline alone saves us 3 hours a day in route planning.',
  },
  {
    name: 'Daniel Okafor',
    biz: 'Okafor Drainage',
    loc: 'Atlanta, GA',
    rating: 5,
    quote:
      'Setup took 8 minutes. First emergency call was triaged correctly on day one.',
  },
];

const FAQS = [
  {
    q: 'How long does setup take?',
    a: 'About 2 minutes. Forward your existing number, type your services and hours.',
  },
  {
    q: 'Does it integrate with my existing phone?',
    a: 'Yes — call-forwarding from any carrier, or we port your number entirely.',
  },
  {
    q: 'What if my techs are all busy?',
    a: 'Emergency escalations call your cell. We never drop emergencies.',
  },
  {
    q: 'Will customers know they’re talking to AI?',
    a: 'Up to you. Default is a natural-sounding greeting. Customers who ask, get told.',
  },
  {
    q: 'How does pricing work?',
    a: 'Per-call pricing. No monthly minimum. Free for the first 30 days.',
  },
];

/* ─── Decoration primitives (unchanged from previous design) ─────── */

function WaveformDeco(): JSX.Element {
  return (
    <div className="flex items-end gap-[4px] h-32">
      {Array.from({ length: 24 }, (_, i) => (
        <motion.span
          key={i}
          className="wave-bar flex-1 min-w-[4px] rounded-full bg-gradient-to-t from-primary/40 via-primary/80 to-primary"
          initial={{ scaleY: 0.3 }}
          animate={{
            scaleY: [0.3, 0.95, 0.45, 0.85, 0.4, 0.7, 0.3],
          }}
          transition={{
            duration: 1.8,
            delay: (i * 0.08) % 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

function CalendarDeco(): JSX.Element {
  return (
    <div className="grid grid-cols-7 gap-1.5 w-full">
      {Array.from({ length: 28 }, (_, i) => {
        const filled = new Set([2, 3, 8, 9, 10, 14, 15, 17, 18, 21, 22, 24, 25, 26]);
        const day = i + 1;
        const isFilled = filled.has(day);
        return (
          <div
            key={i}
            className={`aspect-square rounded-md text-[10px] font-mono flex items-center justify-center transition-colors duration-500 ${
              isFilled
                ? 'bg-primary/30 text-primary border border-primary/50'
                : 'bg-white/[0.04] text-muted-foreground/70 border border-white/[0.06]'
            }`}
          >
            {day}
          </div>
        );
      })}
    </div>
  );
}

function MapDeco(): JSX.Element {
  return (
    <div className="relative flex items-center justify-center h-48">
      <div className="absolute inset-0 rounded-xl overflow-hidden border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-white/[0.01]">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background:
              'repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 14px)',
          }}
        />
      </div>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="absolute rounded-full border border-primary/30"
          style={{
            width: 40 + i * 36,
            height: 40 + i * 36,
            opacity: 0.6 - i * 0.13,
          }}
        />
      ))}
      <span className="relative z-10 w-3 h-3 rounded-full bg-primary shadow-[0_0_22px_5px_rgba(59,130,246,0.55)]">
        <motion.span
          className="absolute inset-0 rounded-full bg-primary/70"
          animate={{ scale: [1, 2.4, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
        />
      </span>
      <span className="absolute top-2 left-2 z-10 font-mono text-[10px] uppercase tracking-wider text-muted-foreground bg-background/40 px-1.5 py-0.5 rounded">
        Voss & Sons · 0.8 mi
      </span>
      <span className="absolute bottom-2 right-2 z-10 px-2 py-0.5 rounded-md bg-primary text-primary-foreground text-[10px] font-bold font-mono">
        JM
      </span>
    </div>
  );
}

function TimelineDeco(): JSX.Element {
  return (
    <div className="space-y-2 w-full">
      {[14, 14.5, 15, 15.5, 16].map((t, idx) => {
        const held = idx === 2;
        return (
          <div
            key={t}
            className={`relative h-8 rounded-md flex items-center px-3 text-[11px] font-mono transition-all duration-500 ${
              held
                ? 'bg-success/15 border border-success/30 text-success'
                : 'bg-primary/15 border border-primary/30 text-primary'
            }`}
            style={{ width: `${65 + idx * 8}%` }}
          >
            {t.toFixed(1)}:00 — slot
            {held && (
              <span className="ml-auto uppercase tracking-wider font-bold">
                ✓ held
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ClockDeco(): JSX.Element {
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <div className="absolute inset-0 rounded-full border-2 border-primary/30" />
      <div className="absolute inset-3 rounded-full border border-primary/15" />
      {[0, 90, 180, 270].map((rot) => (
        <span
          key={rot}
          className="absolute w-0.5 h-3 bg-primary/40"
          style={{
            top: '8%',
            left: '50%',
            transformOrigin: '50% 750%',
            transform: `translateX(-50%) rotate(${rot}deg)`,
          }}
        />
      ))}
      <motion.span
        className="absolute w-0.5 h-7 bg-primary rounded-full"
        style={{ transformOrigin: 'center bottom', bottom: '50%', left: '50%' }}
        animate={{ rotate: [0, 36, 72, 108, 144, 180] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
      />
      <motion.span
        className="absolute w-px h-10 bg-primary/60 rounded-full"
        style={{ transformOrigin: 'center bottom', bottom: '50%', left: '50%' }}
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
      />
      <span className="absolute w-1.5 h-1.5 bg-primary rounded-full z-10" />
    </div>
  );
}

function BarsDeco(): JSX.Element {
  return (
    <div className="grid grid-cols-12 gap-2 items-end h-32 w-full">
      {Array.from({ length: 12 }, (_, i) => {
        const h = 30 + ((i * 17 + 7) % 50);
        return (
          <motion.span
            key={i}
            className="rounded-sm bg-gradient-to-t from-glow-teal/40 via-primary/40 to-primary"
            initial={{ height: `${h + 10}%` }}
            animate={{ height: [`${h + 10}%`, `${h + 30}%`, `${h}%`, `${h + 20}%`, `${h + 10}%`] }}
            transition={{
              duration: 3,
              delay: (i * 0.12) % 1.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        );
      })}
    </div>
  );
}

function FeatureDecoration({ kind }: { kind: FeatureTile['decoration'] }): JSX.Element {
  switch (kind) {
    case 'waveform':
      return <WaveformDeco />;
    case 'calendar':
      return <CalendarDeco />;
    case 'map':
      return <MapDeco />;
    case 'timeline':
      return <TimelineDeco />;
    case 'clock':
      return <ClockDeco />;
    case 'bars':
      return <BarsDeco />;
    default:
      return <></>;
  }
}

function StarRating({ rating }: { rating: number }): JSX.Element {
  const full = Math.floor(rating);
  const half = rating - full >= 0.25 && rating - full < 0.75;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => {
        if (i < full) {
          return (
            <Star
              key={i}
              className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400"
            />
          );
        }
        if (i === full && half) {
          return (
            <span key={i} className="relative w-3.5 h-3.5">
              <Star className="absolute inset-0 w-3.5 h-3.5 fill-transparent stroke-amber-400/40" />
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: '50%' }}
              >
                <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
              </span>
            </span>
          );
        }
        return (
          <Star
            key={i}
            className="w-3.5 h-3.5 fill-transparent stroke-amber-400/40"
          />
        );
      })}
    </div>
  );
}

export default function HomePage(): JSX.Element {
  // Active feature index drives the preview pane in the Capabilities
  // section. Default to the first feature so the preview is never empty
  // on first paint.
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Top header */}
      <header className="relative max-w-[88rem] mx-auto px-4 sm:px-8 pt-6 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center group">
          <Logo size={36} withWordmark withSubtitle />
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/dashboard"
            className="btn-organic inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-primary-foreground"
            style={{
              background:
                'linear-gradient(120deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)',
              boxShadow:
                '0 8px 22px -8px hsl(var(--primary) / 0.55), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Open the demo
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            to="/waitlist"
            className="btn-organic hidden sm:inline-flex px-3.5 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Join the waitlist
          </Link>
        </div>
      </header>

      <Hero />

      {/* Trust strip */}
      <section className="relative border-y border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
        <AmbientGlow color="teal" position="center" size="md" intensity="soft" />
        <div className="relative max-w-[88rem] mx-auto px-4 sm:px-8 py-6">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-[13px] font-medium text-muted-foreground">
            {TRUST_ROW.map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-primary" />
                <span>{label}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CAPABILITIES — list + preview, no card shapes ───
          The brief: "remove the distinct card shapes" and "hovering over
          a feature title subtly illuminates that specific interactive
          tool preview via a soft fade-in glow." Layout: two columns on
          desktop (title list left, preview pane right). Hovering a
          title sets `activeFeature` and the preview pane fades to that
          tile's decoration; the others fade out. */}
      <section className="relative max-w-[88rem] mx-auto px-4 sm:px-8 py-28 lg:py-40 overflow-hidden">
        <AmbientGlow color="indigo" position="top-left" size="lg" intensity="soft" />
        <AmbientGlow color="amber" position="bottom-right" size="md" intensity="soft" />

        <div className="mb-14 max-w-2xl">
          <SectionLabel number="02" title="Capabilities" />
          <h2 className="mt-4 text-display text-4xl lg:text-5xl text-foreground leading-[1.05]">
            Four jobs the AI does better than you.
          </h2>
          <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
            Each capability drops into your existing CRM and connects to
            every phone system — without changing how your techs work.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_1.3fr] gap-12 lg:gap-16 items-start">
          {/* Title list — each row is a hoverable target. */}
          <div>
            {FEATURES.map((f, i) => {
              const isActive = activeFeature === i;
              return (
                <button
                  key={f.title}
                  type="button"
                  onMouseEnter={() => setActiveFeature(i)}
                  onFocus={() => setActiveFeature(i)}
                  className={[
                    'group block w-full text-left py-6 border-b border-white/[0.06] transition-all duration-500',
                    isActive
                      ? 'opacity-100'
                      : 'opacity-50 hover:opacity-90',
                  ].join(' ')}
                  aria-label={`Preview ${f.title}`}
                >
                  <div className="flex items-baseline gap-4">
                    <span
                      className={[
                        'font-mono text-xs tabular-nums transition-colors duration-500',
                        isActive ? 'text-primary' : 'text-muted-foreground/60',
                      ].join(' ')}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3
                      className={[
                        'text-display text-2xl lg:text-3xl leading-tight transition-colors duration-500',
                        isActive
                          ? 'text-foreground'
                          : 'text-foreground/70 group-hover:text-foreground/90',
                      ].join(' ')}
                    >
                      {f.title}
                    </h3>
                    {isActive && (
                      <span
                        aria-hidden
                        className="ml-auto hidden sm:inline-flex items-center gap-1 text-xs font-mono uppercase tracking-[0.18em] text-primary"
                      >
                        Active
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_2px_hsl(var(--primary)/0.6)] animate-glow-pulse" />
                      </span>
                    )}
                  </div>
                  <p
                    className={[
                      'mt-2 ml-9 text-[14.5px] leading-relaxed transition-colors duration-500',
                      isActive ? 'text-muted-foreground' : 'text-muted-foreground/60',
                    ].join(' ')}
                  >
                    {f.body}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Preview pane — single, large. Active preview is fully
              visible, others fade to 0. The whole pane sits on the canvas
              with no card; the active preview's own background blur +
              accent glow acts as the visual anchor. */}
          <div className="relative lg:sticky lg:top-32">
            <div
              aria-hidden
              className="absolute -inset-8 rounded-3xl preview-halo blur-2xl -z-10"
            />
            <div className="relative min-h-[22rem] lg:min-h-[26rem] p-6 lg:p-10">
              {FEATURES.map((f, i) => {
                const isActive = activeFeature === i;
                return (
                  <div
                    key={f.title}
                    className={[
                      'absolute inset-6 lg:inset-10 flex flex-col gap-6 transition-all duration-700',
                      isActive
                        ? 'opacity-100 translate-y-0 pointer-events-auto'
                        : 'opacity-0 translate-y-2 pointer-events-none',
                    ].join(' ')}
                    aria-hidden={!isActive}
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex w-10 h-10 rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30 items-center justify-center">
                        <f.icon className="w-5 h-5" />
                      </span>
                      <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground/70">
                        {f.title}
                      </p>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <FeatureDecoration kind={f.decoration} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS — flowing steps with glowing gradient path ──
          The brief: "flow directly across the canvas without background
          cards. Use thin vertical or horizontal glowing gradient paths
          (like light traveling through a circuit) to visually connect
          the steps seamlessly." The `.how-it-works-path` class draws a
          1px horizontal line spanning the row plus a brighter 30%-wide
          highlight that slides left-to-right via the `light-travel`
          keyframe. Each step has a node circle sitting on the line. */}
      <section
        id="how-it-works"
        className="relative max-w-[88rem] mx-auto px-4 sm:px-8 py-28 lg:py-40 overflow-hidden"
      >
        <AmbientGlow color="teal" position="top" size="lg" intensity="soft" />

        <div className="mb-14 max-w-2xl">
          <SectionLabel number="03" title="How it works" />
          <h2 className="mt-4 text-display text-4xl lg:text-5xl text-foreground leading-[1.05]">
            From missed call to completed job in three steps.
          </h2>
        </div>

        <div className="how-it-works-path pt-10 grid lg:grid-cols-3 gap-10 lg:gap-12 relative">
          {STEPS.map((step, i) => (
            <div key={step.title} className="relative">
              {/* Node — sits on the horizontal glowing line. */}
              <div
                aria-hidden
                className="hidden lg:flex w-5 h-5 rounded-full bg-primary shadow-[0_0_12px_3px_hsl(var(--primary)/0.6)] items-center justify-center mb-8"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-foreground" />
              </div>
              <span className="block text-display text-7xl text-foreground/15 leading-none">
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="mt-2 text-display text-2xl text-foreground leading-tight">
                {step.title}
              </p>
              <p className="mt-2 text-[14.5px] text-muted-foreground leading-relaxed">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials — Marquee */}
      {/* Live activity showcase — only renders for signed-out visitors. */}
      <PublicActivityStream />

      <section className="relative overflow-hidden bg-white/[0.015] py-28 lg:py-40 border-y border-white/[0.06]">
        <AmbientGlow color="amber" position="center" size="md" intensity="soft" />
        <div className="relative max-w-[88rem] mx-auto px-4 sm:px-8 mb-12">
          <SectionLabel number="04" title="Testimonials" />
          <h2 className="mt-4 text-display text-4xl lg:text-5xl text-foreground leading-[1.05] max-w-2xl">
            Real trades. Real owners. Real late-night saves.
          </h2>
        </div>

        <Marquee duration={50} pauseOnHover>
          {TESTIMONIALS.map((t) => (
            <GlassPanel
              key={t.name}
              className="w-[20rem] shrink-0"
              innerClassName="p-6 flex flex-col gap-4 h-[14rem]"
              aurora
            >
              <div className="flex items-start justify-between gap-3">
                <StarRating rating={t.rating} />
                <span className="font-mono uppercase text-[9px] tracking-[0.18em] text-primary/80 px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                  Verified
                </span>
              </div>
              <p className="text-[14.5px] text-foreground/95 leading-relaxed font-medium">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="pt-4 mt-auto border-t border-white/[0.06]">
                <p className="text-[13px] font-display font-semibold text-foreground">
                  {t.name}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {t.biz} · {t.loc}
                </p>
              </div>
            </GlassPanel>
          ))}
        </Marquee>
      </section>

      {/* FAQ — Borderless glowing state */}
      <section className="relative max-w-3xl mx-auto px-4 sm:px-8 py-28 lg:py-40 overflow-hidden">
        <AmbientGlow color="indigo" position="center" size="md" intensity="soft" />
        <div className="mb-12">
          <SectionLabel number="05" title="FAQ" />
          <h2 className="mt-4 text-display text-4xl lg:text-5xl text-foreground leading-[1.05]">
            Questions trades ask before signing up.
          </h2>
        </div>
        <div className="flex flex-col">
          {FAQS.map((faq) => (
            <details
              key={faq.q}
              className="group relative border-b border-white/[0.06] [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex items-center justify-between py-7 cursor-pointer list-none text-base font-medium text-foreground hover:text-primary transition-colors duration-300">
                <span>{faq.q}</span>
                <ChevronDown className="w-5 h-5 text-muted-foreground group-open:rotate-180 group-open:text-primary transition-all duration-500" />
              </summary>
              <div className="pb-7 text-[14.5px] text-muted-foreground leading-relaxed">
                {faq.a}
              </div>
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/0 to-transparent group-hover:via-primary/60 group-open:via-primary/80 transition-all duration-500"
              />
            </details>
          ))}
        </div>
      </section>

      {/* Trade chips + footer CTA */}
      <section className="relative max-w-[88rem] mx-auto px-4 sm:px-8 pt-24 pb-32 lg:pb-40 overflow-hidden">
        <AmbientGlow color="indigo" position="center" size="xl" intensity="vivid" />

        <div className="flex items-center justify-center gap-2 flex-wrap mb-14">
          <span className="font-mono uppercase tracking-[0.2em] text-[11px] text-primary">
            Built for
          </span>
          {SERVED_TRADES.map((t) => (
            <span
              key={t}
              className="px-3 py-1 rounded-full glass-card text-sm text-foreground font-medium"
            >
              {t}
            </span>
          ))}
        </div>

        <GlassPanel
          className="relative"
          innerClassName="p-10 lg:p-16 text-center overflow-hidden"
          aurora
        >
          <div
            aria-hidden
            className="absolute -top-40 left-1/2 -translate-x-1/2 w-[680px] h-[400px] rounded-full bg-glow-indigo opacity-50 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-40 right-1/2 translate-x-1/2 w-[480px] h-[300px] rounded-full bg-glow-teal opacity-30 blur-3xl"
          />

          <div className="relative">
            <SectionLabel number="06" title="Get started" />
            <Zap className="w-10 h-10 mx-auto text-primary mt-4" />
            <h3 className="mt-3 text-display text-4xl lg:text-6xl text-foreground leading-[1.05]">
              Stop losing calls today.
            </h3>
            <p className="mt-3 text-muted-foreground text-lg">
              No credit card. Set up in 2 minutes.
            </p>
            <div className="mt-8 inline-flex items-center gap-4 flex-wrap justify-center">
              <Link
                to="/dashboard"
                className="btn-organic inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-[15px] text-primary-foreground"
                style={{
                  background:
                    'linear-gradient(120deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)',
                  boxShadow:
                    '0 14px 38px -10px hsl(var(--primary) / 0.55), inset 0 1px 0 rgba(255,255,255,0.2)',
                }}
              >
                <Sparkles className="w-4 h-4" />
                Open the demo
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/waitlist"
                className="btn-organic inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-[15px] text-foreground glass-card hover:bg-white/[0.08] transition-colors"
              >
                Join the waitlist
                <ArrowRight className="w-4 h-4" />
              </Link>
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <Lock className="w-3 h-3" />
                SSL · GDPR · CCPA
              </span>
            </div>
          </div>
        </GlassPanel>
      </section>
    </div>
  );
}
