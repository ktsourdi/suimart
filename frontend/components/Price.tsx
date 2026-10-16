import { ReactNode } from 'react';
import { formatSui } from '../lib/format';
import { cn } from './ui/cn';

export type PriceSize = 'sm' | 'md' | 'lg' | 'xl';

const sizeStyles: Record<PriceSize, { value: string; unit: string; drop: number; gap: string }> = {
  sm: { value: 'text-sm font-semibold', unit: 'text-[11px]', drop: 9, gap: 'gap-1' },
  md: { value: 'text-base font-semibold', unit: 'text-xs', drop: 10, gap: 'gap-1.5' },
  lg: { value: 'font-display text-xl font-semibold tracking-[-0.01em]', unit: 'text-[13px]', drop: 11, gap: 'gap-1.5' },
  xl: { value: 'font-display text-[28px] font-semibold leading-none tracking-[-0.02em]', unit: 'text-sm', drop: 13, gap: 'gap-2' },
};

/** The small Sui droplet mark used next to the SUI unit. */
export function SuiDrop({ size = 10, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={Math.round(size * 1.25)}
      viewBox="0 0 16 20"
      aria-hidden="true"
      className={cn('shrink-0 text-accent', className)}
    >
      <path
        fill="currentColor"
        d="M8 .6c-.3 0-.55.13-.75.36C5.2 3.4 1.2 8.5 1.2 12.4a6.8 6.8 0 0 0 13.6 0C14.8 8.5 10.8 3.4 8.75.96A.98.98 0 0 0 8 .6Z"
      />
      <path
        fill="none"
        stroke="rgb(2 16 36 / 0.55)"
        strokeWidth="1.5"
        strokeLinecap="round"
        d="M4.6 12.6a3.5 3.5 0 0 0 3.4 3.1"
      />
    </svg>
  );
}

export interface PriceProps {
  value: number | undefined | null;
  size?: PriceSize;
  /** Small caption above the value ("Price", "Current bid"). */
  label?: ReactNode;
  /** Value colour: fg (default) or accent. */
  tone?: 'default' | 'accent' | 'muted';
  /** 12,400 -> 12.4K for tight spaces. */
  compact?: boolean;
  /** Hide the droplet + SUI unit. */
  hideUnit?: boolean;
  align?: 'start' | 'end';
  className?: string;
}

/** <Price value={15.5} size="md" label="Price" /> renders "15.50" with a small droplet and "SUI". */
export default function Price({
  value,
  size = 'md',
  label,
  tone = 'default',
  compact = false,
  hideUnit = false,
  align = 'start',
  className,
}: PriceProps) {
  const s = sizeStyles[size];
  const amount = (
    <span className={cn('inline-flex items-baseline whitespace-nowrap tabular-nums', s.gap)}>
      <span
        className={cn(
          s.value,
          tone === 'accent' ? 'text-accent' : tone === 'muted' ? 'text-fg-muted' : 'text-fg'
        )}
      >
        {formatSui(value, { compact })}
      </span>
      {!hideUnit && (
        <span className={cn('inline-flex items-center gap-1 self-center font-medium text-fg-subtle', s.unit)}>
          <SuiDrop size={s.drop} />
          SUI
        </span>
      )}
    </span>
  );

  if (!label) return <span className={cn('inline-flex', className)}>{amount}</span>;

  return (
    <span className={cn('inline-flex flex-col gap-1', align === 'end' ? 'items-end text-right' : 'items-start', className)}>
      <span className="text-xs leading-4 text-fg-subtle">{label}</span>
      {amount}
    </span>
  );
}

export { Price };
