import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

type Variant = 'card' | 'plain' | 'spotlight';

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  variant?: Variant;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = 'card',
}: Props): JSX.Element {
  // Spotlight variant: no outer container, no icon background — the icon
  // sits on a radial-gradient halo (`.spotlight-glow`) and the text +
  // action float directly on the dashboard canvas. Used for "Dashboard
  // unavailable" and "No technicians yet" so the empty state feels
  // integrated with the page, not boxed on top of it.
  if (variant === 'spotlight') {
    return (
      <div className="text-center py-20 px-6">
        <div className="relative inline-flex mb-8 spotlight-glow">
          <div className="w-16 h-16 rounded-2xl glass-blend flex items-center justify-center text-primary relative z-10">
            <Icon className="w-8 h-8" />
          </div>
        </div>
        <h3 className="text-2xl font-semibold text-foreground text-display">
          {title}
        </h3>
        <p className="mt-3 text-[14.5px] text-muted-foreground max-w-md mx-auto leading-relaxed">
          {description}
        </p>
        {action && <div className="mt-8">{action}</div>}
      </div>
    );
  }

  return (
    <div
      className={
        variant === 'card'
          ? 'glass-card rounded-2xl py-16 px-6 text-center'
          : 'text-center py-16 px-6'
      }
    >
      <div className="mx-auto w-14 h-14 rounded-2xl glass-card flex items-center justify-center mb-5 text-muted-foreground">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
