import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  variant?: 'card' | 'plain';
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = 'card',
}: Props): JSX.Element {
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
