import { Star } from 'lucide-react';
import { cn } from './cn';

interface RatingProps {
  /** 0..max, fractions allowed (4.8 fills 80% of the fifth star). */
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  /** Show the numeric value after the stars ("4.8"). */
  showValue?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

const Rating = ({ value, max = 5, size = 'md', showValue = false, className }: RatingProps) => {
  const clamped = Math.max(0, Math.min(value, max));
  const label = `Rated ${clamped.toFixed(1)} out of ${max}`;

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)} role="img" aria-label={label}>
      <span className="inline-flex items-center gap-0.5" aria-hidden="true">
        {Array.from({ length: max }, (_, i) => {
          const fill = Math.max(0, Math.min(1, clamped - i));
          return (
            <span key={i} className={cn('relative inline-block', sizeClasses[size])}>
              <Star className={cn('absolute inset-0 text-fg-subtle/40', sizeClasses[size])} strokeWidth={1.75} />
              {fill > 0 && (
                <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                  <Star className={cn('fill-warning text-warning', sizeClasses[size])} strokeWidth={1.75} />
                </span>
              )}
            </span>
          );
        })}
      </span>
      {showValue && (
        <span aria-hidden="true" className="text-[13px] font-medium tabular-nums text-fg">
          {clamped.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export { Rating };
export default Rating;
