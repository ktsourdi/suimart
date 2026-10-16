import Skeleton from './ui/Skeleton';
import { cn } from './ui/cn';

/** The detail page's two columns: artwork left, summary and price panel right. */
export const DETAIL_GRID =
  'grid gap-8 md:grid-cols-2 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-12 xl:gap-16';

/**
 * Loading placeholder with the listing detail page's footprint. Kept apart from
 * ListingClient so app/listing/page.tsx can render it without loading the wallet code.
 */
export function ListingDetailSkeleton() {
  return (
    <div className="container-page pt-10 sm:pt-14" role="status">
      <span className="sr-only">Loading listing</span>
      <Skeleton className="h-4 w-56 max-w-full" />
      <div className={cn('mt-6 sm:mt-8', DETAIL_GRID)}>
        <Skeleton className="aspect-square rounded-2xl" />
        <div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="mt-5 h-9 w-4/5" />
          <div className="mt-6 flex items-center gap-3 border-y border-line py-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <Skeleton className="mt-6 h-[300px] rounded-2xl" />
          <Skeleton className="mt-6 h-64 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export default ListingDetailSkeleton;
