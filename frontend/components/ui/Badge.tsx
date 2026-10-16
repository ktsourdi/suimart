import { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

export type BadgeVariant =
  | 'neutral'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  // Dark frosted pill for use on top of artwork.
  | 'overlay'
  // Legacy names, mapped onto the ones above.
  | 'default'
  | 'primary'
  | 'secondary'
  | 'error';

export type BadgeSize = 'sm' | 'md' | 'lg';

const variants: Record<BadgeVariant, string> = {
  neutral: 'border-line-strong bg-surface-2 text-fg-muted',
  accent: 'border-accent/25 bg-accent/10 text-accent',
  success: 'border-success/25 bg-success/10 text-success',
  warning: 'border-warning/25 bg-warning/10 text-warning',
  danger: 'border-danger/25 bg-danger/10 text-danger',
  overlay: 'border-line-strong bg-bg/65 text-fg backdrop-blur-md',
  default: 'border-line-strong bg-surface-2 text-fg-muted',
  primary: 'border-accent/25 bg-accent/10 text-accent',
  secondary: 'border-line-strong bg-surface-2 text-fg-muted',
  error: 'border-danger/25 bg-danger/10 text-danger',
};

const dotColours: Record<BadgeVariant, string> = {
  neutral: 'bg-fg-subtle',
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  overlay: 'bg-fg',
  default: 'bg-fg-subtle',
  primary: 'bg-accent',
  secondary: 'bg-fg-subtle',
  error: 'bg-danger',
};

const sizes: Record<BadgeSize, string> = {
  sm: 'h-5 gap-1 px-2 text-[11px]',
  md: 'h-6 gap-1.5 px-2.5 text-xs',
  lg: 'h-7 gap-1.5 px-3 text-[13px]',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** A small status dot before the label. */
  dot?: boolean;
  /** Slowly pulse the dot (live auctions). Respects reduced motion. */
  pulse?: boolean;
}

const Badge = ({ children, variant = 'neutral', size = 'md', dot = false, pulse = false, className, ...props }: BadgeProps) => {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center whitespace-nowrap rounded-full border font-medium leading-none tabular-nums [&_svg]:h-3.5 [&_svg]:w-3.5',
        variants[variant] ?? variants.neutral,
        sizes[size] ?? sizes.md,
        className
      )}
      {...props}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dotColours[variant] ?? dotColours.neutral, pulse && 'motion-safe:animate-pulse-dot')}
        />
      )}
      {children}
    </span>
  );
};

export { Badge };
export default Badge;
