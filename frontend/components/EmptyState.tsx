import { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from './ui/cn';

export interface EmptyStateProps {
  /** A lucide icon component, e.g. icon={Wallet}. */
  icon?: LucideIcon;
  title: ReactNode;
  /** Supporting sentence. `description` is accepted as an alias. */
  text?: ReactNode;
  description?: ReactNode;
  /** Buttons or links under the text. */
  action?: ReactNode;
  /** Draw the bordered panel (default) or sit flush in a parent card. */
  bordered?: boolean;
  size?: 'md' | 'lg';
  className?: string;
}

/** Icon in a soft ring, a title, one sentence and an optional action. */
export default function EmptyState({
  icon: Icon,
  title,
  text,
  description,
  action,
  bordered = true,
  size = 'md',
  className,
}: EmptyStateProps) {
  const body = text ?? description;
  return (
    <div
      className={cn(
        'flex flex-col items-center text-center',
        size === 'lg' ? 'px-6 py-20' : 'px-6 py-14',
        bordered && 'rounded-2xl border border-dashed border-line-strong bg-surface/40',
        className
      )}
    >
      {Icon && (
        <div className="relative mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent ring-1 ring-inset ring-accent/20">
          <span aria-hidden="true" className="absolute -inset-2 rounded-full border border-accent/10" />
          <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} />
        </div>
      )}
      <h3 className="font-display text-h3 font-semibold text-fg">{title}</h3>
      {body && <p className="mt-1.5 max-w-sm text-sm leading-6 text-fg-muted">{body}</p>}
      {action && <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{action}</div>}
    </div>
  );
}

export { EmptyState };
