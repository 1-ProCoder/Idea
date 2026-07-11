import type { JSX } from 'react';

type GlowColor = 'indigo' | 'teal' | 'amber' | 'rose';
type Position =
  | 'top'
  | 'top-left'
  | 'top-right'
  | 'center'
  | 'bottom'
  | 'bottom-left'
  | 'bottom-right';

interface AmbientGlowProps {
  color?: GlowColor;
  position?: Position;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  intensity?: 'soft' | 'normal' | 'vivid';
  drift?: boolean;
  className?: string;
}

const SIZE: Record<NonNullable<AmbientGlowProps['size']>, string> = {
  sm: 'w-[280px] h-[220px]',
  md: 'w-[480px] h-[360px]',
  lg: 'w-[680px] h-[480px]',
  xl: 'w-[900px] h-[640px]',
};

const POSITION: Record<Position, string> = {
  top: 'top-0 left-1/2 -translate-x-1/2',
  'top-left': '-top-32 -left-32',
  'top-right': '-top-32 -right-32',
  center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  bottom: '-bottom-32 left-1/2 -translate-x-1/2',
  'bottom-left': '-bottom-32 -left-32',
  'bottom-right': '-bottom-32 -right-32',
};

const COLOR: Record<GlowColor, string> = {
  indigo: 'bg-glow-indigo',
  teal: 'bg-glow-teal',
  amber: 'bg-glow-amber',
  rose: 'bg-glow-rose',
};

const INTENSITY: Record<
  NonNullable<AmbientGlowProps['intensity']>,
  string
> = {
  soft: 'opacity-20',
  normal: 'opacity-40',
  vivid: 'opacity-60',
};

/**
 * Soft, blurred orb that sits behind a section to give it depth. Layer two or
 * three of different colors and offset positions for the "premium ambient
 * lighting" effect.
 */
export function AmbientGlow({
  color = 'indigo',
  position = 'top',
  size = 'lg',
  intensity = 'normal',
  drift = true,
  className = '',
}: AmbientGlowProps): JSX.Element {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute rounded-full blur-[120px] mix-blend-screen ${
        COLOR[color]
      } ${SIZE[size]} ${POSITION[position]} ${INTENSITY[intensity]} ${
        drift ? 'animate-ambient-drift' : ''
      } ${className}`}
    />
  );
}
