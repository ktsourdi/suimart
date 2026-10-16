import { ReactNode } from 'react';
import { cn } from './ui/cn';

export interface SectionHeadingProps {
  /** Small uppercase label above the title. */
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Right-side slot (a link, a count, a button). Wraps under the text on phones. */
  action?: ReactNode;
  /** Heading level. h2 by default; use h1 for page titles. */
  as?: 'h1' | 'h2' | 'h3';
  /** md = 28px (h2), lg = 36px (h1). Defaults to lg for h1, md otherwise. */
  size?: 'md' | 'lg';
  id?: string;
  className?: string;
}

/** Eyebrow, title, optional description and a right-side action. */
export default function SectionHeading({ eyebrow, title, description, action, as = 'h2', size, id, className }: SectionHeadingProps) {
  const Heading = as;
  const resolved = size ?? (as === 'h1' ? 'lg' : 'md');
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-8', className)}>
      <div className="min-w-0 max-w-2xl">
        {eyebrow && <p className="eyebrow mb-2.5">{eyebrow}</p>}
        <Heading
          id={id}
          className={cn('font-display font-semibold text-fg', resolved === 'lg' ? 'text-[30px] leading-9 tracking-[-0.025em] sm:text-h1' : 'text-[24px] leading-8 tracking-[-0.02em] sm:text-h2')}
        >
          {title}
        </Heading>
        {description && <p className="mt-2 text-body text-fg-muted">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-3">{action}</div>}
    </div>
  );
}

export { SectionHeading };
