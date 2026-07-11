import { useEffect } from 'react';
import type { JSX, ReactNode } from 'react';
import { motion, useAnimationControls } from 'framer-motion';

interface MarqueeProps {
  children: ReactNode;
  /** Seconds for one full cycle. */
  duration?: number;
  /** Pause the scroll animation while the cursor is over the marquee. */
  pauseOnHover?: boolean;
  className?: string;
}

/**
 * Continuous infinite horizontal scroller. Renders the children twice
 * (each copy wrapped in its own flex div, scoping React keys) and drives
 * the motion.div via `useAnimationControls` so we can pause / resume the
 * scroll cleanly on hover — framer-motion's loop doesn't honor
 * `animation-play-state`, so pause-on-hover must use the controls API.
 */
export function Marquee({
  children,
  duration = 40,
  pauseOnHover = true,
  className = '',
}: MarqueeProps): JSX.Element {
  const controls = useAnimationControls();

  useEffect(() => {
    void controls.start({
      x: ['0%', '-50%'],
      transition: { duration, ease: 'linear', repeat: Infinity },
    });
  }, [controls, duration]);

  return (
    <div
      className={`relative w-full overflow-hidden mask-fade-x ${
        pauseOnHover ? 'group' : ''
      } ${className}`}
      onMouseEnter={
        pauseOnHover
          ? () => controls.stop()
          : undefined
      }
      onMouseLeave={
        pauseOnHover
          ? () => {
              void controls.start({
                x: ['0%', '-50%'],
                transition: { duration, ease: 'linear', repeat: Infinity },
              });
            }
          : undefined
      }
    >
      <motion.div
        className="flex w-max will-change-transform"
        animate={controls}
      >
        <div className="flex gap-4 shrink-0 pr-4">{children}</div>
        <div className="flex gap-4 shrink-0 pr-4" aria-hidden>
          {children}
        </div>
      </motion.div>
    </div>
  );
}
