import { ReactNode, useId } from 'react';
import { cn } from './cn';

interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  side?: 'top' | 'bottom';
  align?: 'center' | 'start' | 'end';
  className?: string;
}

/**
 * A small hover/focus tooltip (CSS only). The trigger should be focusable
 * (a button or link) so keyboard users get it too. The text stays in the
 * accessibility tree, so screen readers read it after the trigger.
 */
const Tooltip = ({ children, content, side = 'top', align = 'center', className }: TooltipProps) => {
  const id = useId();
  return (
    <span className={cn('group/tooltip relative inline-flex', className)}>
      {children}
      <span
        role="tooltip"
        id={id}
        className={cn(
          'pointer-events-none absolute z-50 w-max max-w-[16rem] rounded-lg border border-line-strong bg-surface-2 px-2.5 py-1.5 text-left text-xs font-normal normal-case leading-5 tracking-normal text-fg-muted opacity-0 shadow-popover transition-opacity duration-150',
          'group-focus-within/tooltip:opacity-100 group-hover/tooltip:opacity-100',
          side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
          align === 'center' && 'left-1/2 -translate-x-1/2',
          align === 'start' && 'left-0',
          align === 'end' && 'right-0'
        )}
      >
        {content}
      </span>
    </span>
  );
};

export { Tooltip };
export default Tooltip;
