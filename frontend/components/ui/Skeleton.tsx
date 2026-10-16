import { HTMLAttributes } from 'react';
import { cn } from './cn';

/**
 * Loading placeholder with a slow sheen (static under reduced motion).
 * Size it with classes: <Skeleton className="h-4 w-32" />, <Skeleton className="aspect-square rounded-2xl" />.
 */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" className={cn('skeleton', className)} {...props} />;
}

export default Skeleton;
