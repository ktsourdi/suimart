import { cn } from './cn';

interface ProgressProps {
  value: number;
  max?: number;
  tone?: 'accent' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  /** Accessible name, e.g. "Auction time elapsed". */
  label?: string;
  className?: string;
}

const tones = {
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
};

const Progress = ({ value, max = 100, tone = 'accent', size = 'sm', label, className }: ProgressProps) => {
  const percentage = max > 0 ? Math.min(Math.max((value / max) * 100, 0), 100) : 0;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
      className={cn('w-full overflow-hidden rounded-full bg-surface-3', size === 'sm' ? 'h-1.5' : 'h-2.5', className)}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-500 ease-out-expo', tones[tone])}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

export { Progress };
export default Progress;
