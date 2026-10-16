import { HTMLAttributes, forwardRef } from 'react';
import { cn } from './cn';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'interactive' | 'glass';

const variants: Record<CardVariant, string> = {
  // Flat panel on the page background.
  default: 'border border-line bg-surface',
  // Slightly lifted: top highlight and a soft shadow. No hover motion.
  elevated: 'border border-line bg-surface shadow-[inset_0_1px_0_0_rgb(255_255_255/0.05),0_16px_40px_-24px_rgb(0_0_0/0.7)]',
  // Transparent with a stronger border, for secondary groupings.
  outlined: 'border border-line-strong bg-transparent',
  // Clickable card: lifts on hover. Use with a stretched link inside.
  interactive:
    'border border-line bg-surface transition-[border-color,box-shadow,transform] duration-300 ease-out-expo hover:border-line-strong hover:shadow-card-hover motion-safe:hover:-translate-y-0.5',
  // Frosted panel for overlays on artwork.
  glass: 'glass shadow-popover',
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const Card = forwardRef<HTMLDivElement, CardProps>(({ className, variant = 'default', children, ...props }, ref) => (
  <div ref={ref} className={cn('relative rounded-2xl text-fg', variants[variant] ?? variants.default, className)} {...props}>
    {children}
  </div>
));
Card.displayName = 'Card';

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col gap-1.5 p-6 pb-0', className)} {...props}>
    {children}
  </div>
));
CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(({ className, children, ...props }, ref) => (
  <h3 ref={ref} className={cn('font-display text-h3 font-semibold text-fg', className)} {...props}>
    {children}
  </h3>
));
CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => (
    <p ref={ref} className={cn('text-small text-fg-muted', className)} {...props}>
      {children}
    </p>
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn('p-6', className)} {...props}>
    {children}
  </div>
));
CardContent.displayName = 'CardContent';

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds a hairline above the footer and even vertical padding. */
  bordered?: boolean;
}

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(({ className, bordered = false, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center gap-3', bordered ? 'border-t border-line px-6 py-4' : 'p-6 pt-0', className)}
    {...props}
  >
    {children}
  </div>
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
export default Card;
