import type { ReactNode } from 'react';

type Props = {
  eyebrow?: string;
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
          <p className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-card text-[10px] font-bold uppercase tracking-wider text-foreground/80 mb-2">
            {eyebrow}
          </p>
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
