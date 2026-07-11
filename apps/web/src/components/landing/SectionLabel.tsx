import type { JSX } from 'react';

interface SectionLabelProps {
  number: string;
  title: string;
  className?: string;
}

/**
 * Premium micro-copy label rendered above each landing-page section: literally
 * `[ 02 / CAPABILITIES ]`. The bracket characters are kept; the slash acts as
 * a quiet separator and the title inverts on hover.
 */
export function SectionLabel({
  number,
  title,
  className = '',
}: SectionLabelProps): JSX.Element {
  return (
    <div
      className={`inline-flex items-center gap-1.5 font-mono uppercase text-[11px] tracking-[0.22em] text-muted-foreground group ${className}`}
    >
      <span className="text-muted-foreground/50">[</span>
      <span className="text-primary/90 group-hover:text-primary transition-colors duration-300">
        {number}
      </span>
      <span className="text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors duration-300">
        /
      </span>
      <span className="group-hover:text-foreground transition-colors duration-300">
        {title}
      </span>
      <span className="text-muted-foreground/50">]</span>
    </div>
  );
}
