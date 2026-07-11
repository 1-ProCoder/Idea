import { useRef, useState } from 'react';
import type { JSX, ReactNode } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import { ArrowRight, Sparkles, Play } from 'lucide-react';
import { SignedIn, SignedOut, SignUpButton } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

import { HeroArtifact } from './HeroArtifact';
import { SectionLabel } from './SectionLabel';
import { AmbientGlow } from './AmbientGlow';

const TRADES = [
  'Plumbing',
  'Electrical',
  'HVAC',
  'Heating',
  'Boiler',
  'Drainage',
] as const;

/**
 * Magnetic CTA wrapper: the button follows the cursor with a damped spring
 * and the gradient background shimmers continuously. Wraps any clickable
 * child (Clerk's SignUpButton, react-router Link, etc.).
 */
function MagneticCTA({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): JSX.Element {
  const ref = useRef<HTMLDivElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 22, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 22, mass: 0.4 });
  const tx = useTransform(sx, (v) => v * 0.18);
  const ty = useTransform(sy, (v) => v * 0.18);

  return (
    <motion.div
      ref={ref}
      style={{ x: tx, y: ty }}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        x.set(e.clientX - rect.left - rect.width / 2);
        y.set(e.clientY - rect.top - rect.height / 2);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      className={`relative inline-flex ${className ?? ''}`}
    >
      {children}
    </motion.div>
  );
}

/**
 * Marketing landing hero — upgraded to a massive, premium composition with:
 *   - layered ambient indigo + teal orbs behind the section
 *   - vertical `01 / HERO` rail on the left edge (xl breakpoint)
 *   - Clash Display headline at clamp(3rem, 7vw, 6.25rem)
 *   - magnetic primary CTA (cursor-following spring) with a continuously
 *     shimmering dual-tone primary→secondary gradient
 *   - secondary CTA inside an outlined play-button badge
 *   - the interactive-feeling triage dashboard panel (`HeroArtifact`)
 *     on the right, wrapped in ambient glow.
 */
export function Hero(): JSX.Element {
  const [hoverCta, setHoverCta] = useState(false);

  return (
    <section className="relative w-full overflow-hidden bg-background">
      <AmbientGlow
        color="indigo"
        position="top-left"
        size="xl"
        intensity="soft"
      />
      <AmbientGlow
        color="teal"
        position="top-right"
        size="lg"
        intensity="soft"
      />

      {/* Vertical hero rail (xl+) */}
      <div
        className="hidden xl:flex absolute left-4 top-32 items-center gap-2 font-mono uppercase text-[10px] tracking-[0.28em] text-muted-foreground/60"
        style={{ writingMode: 'vertical-rl' }}
      >
        <span className="text-foreground/40">[</span>
        <span className="text-primary">01 / Hero</span>
        <span className="text-foreground/40">]</span>
      </div>

      <div className="relative max-w-[88rem] mx-auto px-4 sm:px-8 pt-20 pb-24 lg:pt-28 lg:pb-32">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left column — copy / CTAs */}
          <div className="lg:col-span-7 flex flex-col items-start gap-7">
            <SectionLabel number="01" title="Hero" />

            <h1 className="text-display text-[clamp(2.75rem,7vw,5.75rem)] leading-[0.95] text-foreground">
              Never miss a call.{' '}
              <span className="text-muted-foreground font-normal">
                Never double-book.
              </span>
            </h1>

            <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-2xl">
              The AI receptionist for trades. Auto-answers in two rings,
              triages the issue, books the job, and dispatches the nearest
              qualified tech — every time, even after-hours.
            </p>

            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono uppercase text-[11px] tracking-[0.2em] text-primary">
                Built for
              </span>
              {TRADES.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 rounded-full glass-card text-[12px] font-medium text-foreground/90"
                >
                  {t}
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-3">
              <SignedOut>
                <MagneticCTA>
                  <SignUpButton mode="modal">
                    <button
                      onMouseEnter={() => setHoverCta(true)}
                      onMouseLeave={() => setHoverCta(false)}
                      className="group relative overflow-hidden inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-[15px] text-primary-foreground transition-shadow duration-300"
                      style={{
                        background:
                          'linear-gradient(120deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer-text 6s linear infinite',
                        animationPlayState: hoverCta ? 'paused' : 'running',
                        boxShadow:
                          '0 14px 38px -10px hsl(var(--primary) / 0.55), inset 0 1px 0 rgba(255,255,255,0.2)',
                      }}
                    >
                      <span className="relative z-10 inline-flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Start Free Trial
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                      <span
                        aria-hidden
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{
                          background:
                            'linear-gradient(120deg, hsl(var(--primary)) 30%, hsl(var(--secondary)) 70%)',
                        }}
                      />
                      <span
                        aria-hidden
                        className="absolute -inset-px rounded-xl opacity-0 group-hover:opacity-70 transition-opacity duration-500 pointer-events-none"
                        style={{
                          background:
                            'linear-gradient(120deg, hsl(var(--primary)), hsl(var(--secondary)))',
                          filter: 'blur(22px)',
                          zIndex: -1,
                        }}
                      />
                    </button>
                  </SignUpButton>
                </MagneticCTA>

                <a
                  href="#how-it-works"
                  className="group inline-flex items-center gap-2 px-5 py-3.5 rounded-xl text-[15px] font-medium text-foreground/85 hover:text-foreground glass-card hover:bg-white/[0.06] transition-colors"
                >
                  <span className="inline-flex w-7 h-7 rounded-full bg-white/[0.08] items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Play className="w-3 h-3 fill-current" />
                  </span>
                  Watch 90-sec demo
                </a>
              </SignedOut>
              <SignedIn>
                <MagneticCTA>
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-[15px] text-primary-foreground"
                    style={{
                      background:
                        'linear-gradient(120deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)',
                      boxShadow:
                        '0 14px 38px -10px hsl(var(--primary) / 0.55), inset 0 1px 0 rgba(255,255,255,0.2)',
                    }}
                  >
                    Continue to dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </MagneticCTA>
              </SignedIn>
            </div>

            <p className="text-xs text-muted-foreground/80 font-mono tracking-wider">
              <span className="text-primary/80">NO CREDIT CARD</span>
              <span className="mx-2 text-muted-foreground/40">·</span>
              30-DAY FREE TRIAL
              <span className="mx-2 text-muted-foreground/40">·</span>
              SETUP IN 2 MINUTES
            </p>
          </div>

          {/* Right column — interactive-feeling triage dashboard */}
          <div className="lg:col-span-5 hidden lg:block w-full">
            <HeroArtifact />
          </div>
        </div>
      </div>
    </section>
  );
}
