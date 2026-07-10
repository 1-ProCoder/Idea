import { type CSSProperties } from 'react';

/**
 * FlowFix AI brand mark — a stylized waveform/pulse glyph inside a
 * rounded square frame, rendered as inline SVG so it scales cleanly
 * from a 16px favicon up to a 64px navbar logo and beyond.
 *
 * The wordmark uses the same gradient, so brand mark + word + the
 * product name line up without color seams.
 */

type Props = {
  /** Pixel size of the square mark. Default 32. */
  size?: number;
  /** Show "FlowFix AI" wordmark to the right. Default `false`. */
  withWordmark?: boolean;
  /** Show a small "·" + "AI" subtitle. Default `false`. */
  withSubtitle?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Visual style of the icon — `filled` for the gradient block, `mono`
   *  for a single-tint version used in tiny contexts (favicons). */
  variant?: 'filled' | 'mono';
  title?: string;
};

export default function Logo({
  size = 32,
  withWordmark = false,
  withSubtitle = false,
  className,
  style,
  variant = 'filled',
  title = 'FlowFix AI',
}: Props): JSX.Element {
  const gradId = `ffx-grad-${size}`;

  return (
    <span
      className={['inline-flex items-center gap-2', className]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={title}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="55%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>

        {/* Rounded square frame */}
        <rect
          x="0"
          y="0"
          width="40"
          height="40"
          rx="10"
          fill={variant === 'filled' ? `url(#${gradId})` : 'transparent'}
          stroke={variant === 'mono' ? 'currentColor' : 'none'}
          strokeWidth={variant === 'mono' ? 1.5 : 0}
        />

        {/* Waveform/pulse glyph — a 4-bar pulse that resolves into a
            dot, suggesting both "audio/transcription" and "live signal". */}
        <g
          stroke={
            variant === 'filled' ? 'rgba(255,255,255,0.95)' : 'currentColor'
          }
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        >
          <line x1="9" y1="16" x2="9" y2="24" />
          <line x1="13" y1="16" x2="13" y2="24" />
          <line x1="17" y1="12" x2="17" y2="28" />
          <line x1="21" y1="17" x2="21" y2="23" />
          <line x1="25" y1="14" x2="25" y2="26" />
        </g>
        {/* Live pulse dot */}
        <circle
          cx="30"
          cy="20"
          r="2.2"
          fill={variant === 'filled' ? 'rgba(255,255,255,0.95)' : 'currentColor'}
        />
      </svg>

      {withWordmark && (
        <span className="flex flex-col leading-none">
          <span
            className="font-bold tracking-tight text-foreground"
            style={{
              fontSize: Math.max(size * 0.55, 14),
              background:
                variant === 'filled'
                  ? 'linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%)'
                  : undefined,
              WebkitBackgroundClip: variant === 'filled' ? 'text' : undefined,
              // Firefox ignores -webkit-text-fill-color — it needs the
              // plain `color: transparent` fallback to honour the gradient.
              color: variant === 'filled' ? 'transparent' : undefined,
              WebkitTextFillColor: variant === 'filled' ? 'transparent' : undefined,
              backgroundClip: variant === 'filled' ? 'text' : undefined,
            }}
          >
            FlowFix
          </span>
          {/* Subtitle only renders alongside the wordmark — otherwise the
              bare "AI" caption floats with no anchor. */}
          {withSubtitle && (
            <span
              className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-0.5"
              style={{ fontSize: Math.max(size * 0.28, 9) }}
            >
              AI
            </span>
          )}
        </span>
      )}
    </span>
  );
}
