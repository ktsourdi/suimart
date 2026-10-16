import { ButtonHTMLAttributes, forwardRef } from 'react';
import { LoaderCircle } from 'lucide-react';
import { cn } from './cn';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon-sm' | 'icon';

const base =
  'relative inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-control font-medium ' +
  'transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg ' +
  'disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 ' +
  'motion-safe:active:translate-y-px';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent font-semibold text-accent-fg shadow-button hover:bg-accent-hover',
  secondary: 'border border-line-strong bg-surface-2 text-fg hover:border-fg-subtle/30 hover:bg-surface-3',
  // Kept for older markup: same look as secondary.
  outline: 'border border-line-strong bg-surface-2 text-fg hover:border-fg-subtle/30 hover:bg-surface-3',
  ghost: 'text-fg-muted hover:bg-surface-2 hover:text-fg',
  danger: 'border border-danger/25 bg-danger/10 text-danger hover:border-danger/40 hover:bg-danger/[0.16]',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 px-3 text-[13px]',
  md: 'h-10 gap-2 px-4 text-sm',
  lg: 'h-12 gap-2 px-5 text-[15px]',
  'icon-sm': 'h-8 w-8',
  icon: 'h-10 w-10',
};

export interface ButtonVariantOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

/**
 * The button classes, for links that look like buttons:
 * <Link href="/sell" className={buttonVariants({ variant: 'secondary', size: 'lg' })}>List an item</Link>
 */
export function buttonVariants({ variant = 'primary', size = 'md', className }: ButtonVariantOptions = {}): string {
  return cn(base, variants[variant] ?? variants.primary, sizes[size] ?? sizes.md, className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and disables the button. */
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, children, disabled, type = 'button', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={buttonVariants({ variant, size, className })}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && <LoaderCircle aria-hidden="true" className="h-4 w-4 motion-safe:animate-spin" strokeWidth={2} />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export default Button;
