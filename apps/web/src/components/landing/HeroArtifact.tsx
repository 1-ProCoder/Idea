import type { JSX } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, PhoneCall, MapPin, Check } from 'lucide-react';

const WAVEFORM_BARS = 28;

function WaveformBars(): JSX.Element {
  return (
    <div className="flex items-end gap-[3px] h-12 w-full">
      {Array.from({ length: WAVEFORM_BARS }, (_, i) => (
        <motion.span
          key={i}
          className="wave-bar flex-1 min-w-[3px] rounded-full bg-gradient-to-t from-primary/40 via-primary to-primary/80"
          initial={{ scaleY: 0.3 }}
          animate={{
            scaleY: [0.3, 0.95, 0.45, 0.8, 0.35, 0.7, 0.3],
          }}
          transition={{
            duration: 1.6,
            delay: (i * 0.07) % 1.4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

const TIMELINE_STEPS = [
  { id: 1, label: 'Incoming call', time: '14:18', state: 'done' as const },
  { id: 2, label: 'AI triaged', time: '14:19', state: 'done' as const },
  { id: 3, label: 'Dispatched', time: '14:20', state: 'active' as const },
  { id: 4, label: 'Confirmed', time: '14:21', state: 'pending' as const },
];

function TimelineRow(): JSX.Element {
  return (
    <ol className="relative flex flex-col gap-3">
      {TIMELINE_STEPS.map((step, idx) => (
        <li
          key={step.id}
          className="relative flex items-start gap-3 pl-7"
        >
          {idx < TIMELINE_STEPS.length - 1 && (
            <span
              aria-hidden
              className="absolute left-[10px] top-5 bottom-[-12px] w-px bg-gradient-to-b from-white/[0.12] to-white/[0.02]"
            />
          )}
          <span
            className={`absolute left-0 top-1 w-5 h-5 rounded-full flex items-center justify-center ring-1 ${
              step.state === 'done'
                ? 'bg-success/15 text-success ring-success/40'
                : step.state === 'active'
                ? 'bg-primary/20 text-primary ring-primary/50'
                : 'bg-white/[0.04] text-muted-foreground ring-white/[0.1]'
            }`}
          >
            {step.state === 'done' ? (
              <Check className="w-3 h-3" />
            ) : step.state === 'active' ? (
              <motion.span
                className="w-2 h-2 rounded-full bg-primary"
                animate={{ opacity: [0.35, 1, 0.35], scale: [0.75, 1, 0.75] }}
                transition={{
                  duration: 1.6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            ) : (
              <span className="w-2 h-2 rounded-full bg-white/[0.2]" />
            )}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <span
                className={`text-[13px] font-medium ${
                  step.state === 'pending'
                    ? 'text-muted-foreground'
                    : 'text-foreground'
                }`}
              >
                {step.label}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                {step.time}
              </span>
            </div>
            {step.state === 'active' && (
              <p className="text-[11px] text-primary/80 mt-0.5">
                Routing nearest tech…
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

/**
 * Interactive-feeling triage dashboard rendered in the right column of the
 * hero. Layers multiple framer-motion animations on top of a glass-ultra
 * panel: blinking live-call dot, animated waveform bars, a pulsing active
 * timeline node, and a floating avg-pick-up metric chip that overlaps the
 * bottom edge.
 */
export function HeroArtifact(): JSX.Element {
  return (
    <div className="relative">
      {/* Outer ambient halo */}
      <div
        aria-hidden
        className="absolute -inset-10 rounded-[2rem] bg-glow-indigo opacity-30 blur-3xl pointer-events-none animate-ambient-drift"
      />
      <div
        aria-hidden
        className="absolute -inset-6 rounded-[2rem] bg-glow-teal opacity-15 blur-3xl pointer-events-none"
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative glass-aurora"
      >
        <div
          className="glass-ultra rounded-2xl p-6 lg:p-7"
          style={{
            boxShadow:
              '0 30px 80px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          {/* Top: live call header */}
          <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] pb-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 font-mono uppercase text-[10px] tracking-[0.18em] text-muted-foreground mb-1">
                <motion.span
                  className="w-1.5 h-1.5 rounded-full bg-danger"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                />
                <span>Live · Incoming call</span>
                <span className="text-foreground/80">· 02:18</span>
              </div>
              <p className="text-lg font-display text-foreground truncate">
                Sarah Mitchell
              </p>
              <p className="text-[12px] text-muted-foreground font-mono mt-0.5">
                (555) 234-8910 — Burst pipe, kitchen
              </p>
            </div>
            <span className="shrink-0 px-2.5 py-1 rounded-md bg-danger/15 text-danger text-[10px] font-bold uppercase tracking-[0.12em] ring-1 ring-danger/30">
              Emergency
            </span>
          </div>

          {/* Mid: waveform + transcript teaser */}
          <div className="mt-4 space-y-3">
            <WaveformBars />
            <p className="text-[12.5px] leading-relaxed font-mono">
              <span className="text-foreground/85">
                &ldquo;Burst pipe in kitchen, water leaking. We had to shut
                off the main — need an emergency visit today.&rdquo;
              </span>
            </p>
          </div>

          {/* AI triage badge */}
          <div className="mt-4 flex items-center gap-3 py-3 px-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
            <div className="w-8 h-8 rounded-lg glass-card flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-mono uppercase text-[10px] tracking-[0.16em] text-primary">
                AI triage complete
              </p>
              <p className="text-[13px] font-medium text-foreground truncate">
                Priority 1 · Plumbing · Customer-tier VIP
              </p>
            </div>
          </div>

          {/* Timeline */}
          <div className="mt-5 pt-4 border-t border-white/[0.06]">
            <p className="font-mono uppercase text-[10px] tracking-[0.18em] text-muted-foreground mb-3">
              Dispatch timeline
            </p>
            <TimelineRow />
          </div>

          {/* Bottom: assigned tech */}
          <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold font-mono ring-1 ring-primary/30">
              JM
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-foreground truncate">
                James M.
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <MapPin className="w-3 h-3" />
                0.8 mi · Plumbing
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[14px] font-bold text-foreground font-display tabular-nums">
                14:30
              </p>
              <p className="font-mono uppercase text-[9px] font-bold tracking-[0.18em] text-success">
                Confirmed
              </p>
            </div>
          </div>
        </div>

        {/* Floating metric chip overlapping bottom edge */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="absolute -bottom-6 left-7 right-7 lg:left-9 lg:right-auto lg:w-[11rem]"
        >
          <div className="glass-aurora">
            <div className="glass-ultra rounded-xl p-3 flex items-center gap-2.5">
              <span className="inline-flex w-7 h-7 rounded-lg bg-primary/15 text-primary items-center justify-center ring-1 ring-primary/30">
                <PhoneCall className="w-3.5 h-3.5" />
              </span>
              <div className="min-w-0">
                <p className="font-mono uppercase text-[9px] tracking-[0.18em] text-muted-foreground">
                  Avg pick-up
                </p>
                <p className="text-[13px] font-bold font-display text-foreground tabular-nums">
                  1.4<span className="text-muted-foreground font-normal">s</span>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
