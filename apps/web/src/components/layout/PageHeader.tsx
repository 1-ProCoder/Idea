import type { ReactNode } from 'react';

type Props = {
  /**
   * Eyebrow chip above the title. Accepts a plain string OR a JSX node
   * (e.g. a breadcrumb with links). When JSX is passed, the chip will
   * render that node directly without the default glass-card pill — the
   * caller controls the visual treatment.
   */
  eyebrow?: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  className = '',
}: Props): JSX.Element {
  return (
    <header
      className={`flex items-end justify-between flex-wrap gap-4 ${className}`}
    >
      <div>
        {eyebrow && (
          typeof eyebrow === 'string' ? (
            <p className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-card text-[10px] font-bold uppercase tracking-wider text-foreground/80 mb-2">
              {eyebrow}
            </p>
          ) : (
            <div className="mb-2 text-[11px] tracking-wider text-muted-foreground">
              {eyebrow}
            </div>
          )
        )}
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="text-muted-foreground mt-1.5 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap">{actions}</div>
      )}
    </header>
  );
}
