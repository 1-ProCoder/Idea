import type { JSX, ReactNode } from 'react';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  /** Render the 1px aurora-gradient border on top of the ultra backdrop. */
  aurora?: boolean;
}

/**
 * Premium glassmorphism wrapper used for every feature tile, testimonial
 * card, and the final CTA. Combines `.glass-aurora` (1px gradient border
 * via mask-composite) with `.glass-ultra` (deep backdrop blur + soft
 * internal highlight + outer drop shadow).
 */
export function GlassPanel({
  children,
  className = '',
  innerClassName = '',
  aurora = true,
}: GlassPanelProps): JSX.Element {
  return (
    <div
      className={`relative rounded-2xl ${aurora ? 'glass-aurora' : ''} ${className}`}
    >
      <div className={`glass-ultra rounded-2xl ${innerClassName}`}>{children}</div>
    </div>
  );
}
